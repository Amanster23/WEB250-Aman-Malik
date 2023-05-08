const express = require("express");
const fs = require("fs");
const handlebars = require('handlebars');
const axios = require('axios');
const sqlite3 = require("sqlite3")
const router = express.Router();

const DATABASE = "pizza.db";

// Define pizza sizes and their prices
const pizzaSizes = {
    small: 8.99,
    medium: 10.99,
    large: 12.99
};

router.get("/", async (request, response) => {
    let result = "";

    try {
        await checkDatabase();
        result = await getOrderData();
    } catch (error) {
        result = error;
    }

    let source = fs.readFileSync("./templates/finalproject.html");
    let template = handlebars.compile(source.toString());
    let data = {
        table: result
    }
    result = template(data);
    response.send(result);
});

router.post("/", async (request, response) => {
    let result = "";
    let salesTaxRate = 0;

    try {
        let customer_name = request.body.customer_name.trim();
        let customer_address = request.body.customer_address.trim();
        let customer_zip = request.body.customer_zip.trim();
        let customer_phone = request.body.customer_phone.trim(); // Added phone number input
        let pizza_sizes = request.body.pizza_size;
        let toppings_array = request.body.toppings;

        // Check if any field is empty
        if (!customer_name || !customer_address || !customer_zip || !customer_phone || !pizza_sizes || !toppings_array) {
            throw new Error("All fields are required.");
        }

        // Retrieve sales tax rate from API
        let response = await axios.get(`http://web250taxrates.harpercollege.org/taxrates/IL/${customer_zip}`);

        salesTaxRate = response.data.totalRate;

        let orders = [];

        // Calculate pizza price based on size and toppings for each pizza order
        for (let i = 0; i < pizza_sizes.length; i++) {
            let pizzaPrice = pizzaSizes[pizza_sizes[i]];
            let toppings = toppings_array[i].filter(Boolean).join(", ");
            let toppingPrices = toppings.split(",").map(topping => topping.trim() !== "" ? 0.99 : 0);
            let subtotal = pizzaPrice + toppingPrices.reduce((acc, price) => acc + price, 0);
            let taxAmount = (subtotal * salesTaxRate).toFixed(2);
            let totalPrice = (subtotal + parseFloat(taxAmount)).toLocaleString("en-US", {
                style: "currency",
                currency: "USD"
            });

            orders.push({
                pizza_size: pizza_sizes[i],
                toppings: toppings,
                subtotal: subtotal,
                taxAmount: taxAmount,
                totalPrice: totalPrice
            });
        }

        let customer_id = await insertCustomer(customer_name, customer_address, customer_phone, customer_zip);
        
        // Insert each pizza order into the Orders table
        for (let i = 0; i < orders.length; i++) {
            let order = orders[i];
            let order_id = await insertOrder(customer_id, order.pizza_size, order.subtotal, order.taxAmount, order.totalPrice);
            await insertOrderDetails(order_id, order.toppings);
        }

        result = await getOrderData();
    } catch (error) {
        result = error;
    }

    let source = fs.readFileSync("./templates/finalproject.html");
    let template = handlebars.compile(source.toString());
    let data = {
        table: result
    }
    result = template(data);
    response.send(result);
});

async function checkDatabase() {
    let sql = `
    SELECT COUNT(*) AS Count FROM sqlite_master
    WHERE name = 'Customers';
  `
    let parameters = {};
    let rows = await sqliteAll(sql, parameters);
    if (rows[0].Count > 0) {
        return;
    }

    sql = `
    CREATE TABLE Customers(
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Address TEXT NOT NULL,
      Zip TEXT NOT NULL,
      Phone TEXT NOT NULL
    );
  `
    parameters = {};
    await sqliteRun(sql, parameters);

    sql = `
    CREATE TABLE Orders(
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        CustomerID INTEGER NOT NULL,
        Size TEXT NOT NULL,
        Subtotal REAL NOT NULL,
        TaxAmount REAL NOT NULL,
        TotalPrice REAL NOT NULL,
        FOREIGN KEY (CustomerID) REFERENCES Customers(ID)
    );
  `
    parameters = {};
    await sqliteRun(sql, parameters);

    sql = `
    CREATE TABLE OrderDetails(
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      OrderID INTEGER NOT NULL,
      Topping TEXT NOT NULL,
      FOREIGN KEY (OrderID) REFERENCES Orders(ID)
    );
  `
    parameters = {};
    await sqliteRun(sql, parameters);
}

async function getOrderData() {
    let sql = `
    SELECT 
      Orders.ID AS OrderID, 
      Customers.ID AS CustomerID,
      Customers.Name AS CustomerName,
      Customers.Address AS CustomerAddress,
      Customers.Phone AS CustomerPhone,
      Orders.Size AS PizzaSize,
      Orders.TotalPrice AS TotalPrice,
      GROUP_CONCAT(OrderDetails.Topping, ',') AS Toppings
      FROM Orders
      LEFT JOIN Customers ON Orders.CustomerID = Customers.ID
      LEFT JOIN OrderDetails ON Orders.ID = OrderDetails.OrderID
      GROUP BY Orders.ID
      ORDER BY Orders.ID DESC;
      `;
    let parameters = {};
    let rows = await sqliteAll(sql, parameters);
    return JSON.stringify(rows); // Convert object to JSON string
}

async function insertOrder(customer_name, customer_address, customer_phone, customer_zip, pizza_size, subtotal, tax_amount, total_price) {
    // Check if customer already exists in the database
    let sql = 'SELECT ID FROM Customers WHERE Name = ? AND Address = ? AND Phone = ? AND Zip = ?;';
    let parameters = [customer_name, customer_address, customer_phone, customer_zip];
    let rows = await sqliteAll(sql, parameters);

    let customer_id;
    if (rows.length > 0) {
        customer_id = rows[0].ID;
    } else {
        // Insert new customer into the Customers table
        sql = 'INSERT INTO Customers(Name, Address, Phone, Zip) VALUES (?, ?, ?, ?);';
        parameters = [customer_name, customer_address, customer_phone, customer_zip];
        let result = await sqliteRun(sql, parameters);
        customer_id = result.lastID;
    }

    // Insert order into the Orders table
    sql = 'INSERT INTO Orders(CustomerID, Size, Subtotal, TaxAmount, TotalPrice) VALUES (?, ?, ?, ?, ?);';
    parameters = [customer_id, pizza_size, subtotal, tax_amount, total_price];
    let result = await sqliteRun(sql, parameters);
    return result.lastID;
}


async function insertOrderDetails(order_id, toppings) {
    let toppingsArray = toppings.split(",").map(topping => topping.trim()).filter(Boolean);
    let sql = 'INSERT INTO OrderDetails(OrderID, Topping) VALUES( ? , ? );';
    let parameters = toppingsArray.map(topping => [order_id, topping]);
    for (let parameter of parameters) {
        await sqliteRun(sql, parameter);
    }
}

function sqliteAll(sql, parameters) {
    return new Promise((resolve, reject) => {
        let db = new sqlite3.Database(DATABASE, (error) => {
            if (error) {
                reject(error);
            } else {
                db.all(sql, parameters, (error, rows) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(rows);
                    }
                    db.close();
                });
            }
        });
    });
}

function sqliteRun(sql, parameters) {
    return new Promise((resolve, reject) => {
        let db = new sqlite3.Database(DATABASE, (error) => {
            if (error) {
                reject(error);
            } else {
                db.run(sql, parameters, function (error) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(this);
                    }
                    db.close();
                });
            }
        });
    });
}

module.exports = router;