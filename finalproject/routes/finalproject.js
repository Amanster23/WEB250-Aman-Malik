const express = require("express");
const fs = require("fs");
const handlebars = require('handlebars');
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

    try {
        let customer_name = request.body.customer_name.trim();
        let customer_address = request.body.customer_address.trim();
        let pizza_size = request.body.pizza_size.trim();
        let toppings = request.body.toppings.filter(Boolean).join(", ");

        // Check if any field is empty
        if (!customer_name || !customer_address || !pizza_size || !toppings) {
            throw new Error("All fields are required.");
        }

        // Calculate pizza price based on size and toppings
        let pizzaPrice = pizzaSizes[pizza_size];
        let toppingPrices = toppings.split(",").map(topping => topping.trim() !== "" ? 0.99 : 0);
        let totalPrice = pizzaPrice + toppingPrices.reduce((acc, price) => acc + price, 0);

        let order_id = await insertOrder(customer_name, customer_address, pizza_size, totalPrice);
        await insertOrderDetails(order_id, toppings);

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
      Address TEXT NOT NULL
    );
  `
    parameters = {};
    await sqliteRun(sql, parameters);

    sql = `
    CREATE TABLE Orders(
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      CustomerID INTEGER NOT NULL,
      Size TEXT NOT NULL,
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
      Orders.Size AS PizzaSize,
      Orders.TotalPrice AS TotalPrice,
      GROUP_CONCAT(OrderDetails.Topping, '\n') AS Toppings
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

async function insertOrder(customer_name, customer_address, pizza_size, total_price) {
    let sql = 'INSERT INTO Customers(Name, Address) VALUES( ? , ? );';
    let parameters = [customer_name, customer_address];
    await sqliteRun(sql, parameters);

    sql = 'SELECT last_insert_rowid() AS id;';
    parameters = {};
    let rows = await sqliteAll(sql, parameters);
    let customer_id = rows[0].id;

    sql = 'INSERT INTO Orders(CustomerID, Size, TotalPrice) VALUES( ? , ? , ? );';
    parameters = [customer_id, pizza_size, total_price];
    await sqliteRun(sql, parameters);

    sql = 'SELECT last_insert_rowid() AS id;';
    parameters = {};
    rows = await sqliteAll(sql, parameters);
    let order_id = rows[0].id;

    return order_id;
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