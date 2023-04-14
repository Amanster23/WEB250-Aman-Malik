// This program creates and displays a temperature database
// with options to insert, update, and delete records using
// a REST API.
//
// Test using cURL commands.
//
// Insert countries:
// curl -X POST -d "country=Bulgaria&temperature=45.2%20°C" http://localhost:3000/lesson13/countries
// curl -X POST -d "country=Canada&temperature=45%20°C" http://localhost:3000/lesson13/countries
// curl -X POST -d "country=Finland&temperature=37.2%20°C" http://localhost:3000/lesson13/countries
// curl -X POST -d "country=Germany&temperature=42.6%20°C" http://localhost:3000/lesson13/countries
// curl -X POST -d "country=Japan&temperature=41%20°C" http://localhost:3000/lesson13/countries
// curl -X POST -d "country=United%20States%20of%20America&temperature=56.7%20°C" http://localhost:3000/lesson13/countries
//
// Get countries:
// curl -X GET http://localhost:3000/lesson13/countries
//
// Get country #6:
// curl -X GET http://localhost:3000/lesson13/countries/6
//
// Update country #6:
// curl -X PUT -d "country=United%20States%20of%20America&temperature=55%20°C" http://localhost:3000/lesson13/countries/6
//
// Get country #6:
// curl -X GET http://localhost:3000/lesson13/countries/6
//
// Delete country #6:
// curl -X DELETE http://localhost:3000/lesson13/countries/6
//
// Get Countries:
// curl -X GET http://localhost:3000/lesson13/countries
//
// References:
//  https://en.wikibooks.org/wiki/JavaScript
//  https://medium.com/@onejohi/building-a-simple-rest-api-with-nodejs-and-express-da6273ed7ca9
//  https://www.baeldung.com/curl-rest

const express = require("express");
const fs = require("fs");
const handlebars = require('handlebars');
const axios = require('axios');
const sqlite3 = require("sqlite3");
const { log } = require("console");
const router = express.Router();

const DATABASE = "pizza.db";

router.get("/", async (request, response) => {
    let result = "";

    try {
        await checkDatabase();
        result = await getOrderData();
    } catch (error) {
        result = error;
    }

    let source = fs.readFileSync("./templates/lesson12.html");
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
        let zipCode = request.body.zipCode.trim();
        let pizza_size = request.body.pizza_size.trim();
        let toppings = request.body.toppings.filter(Boolean).join(", ");

        // Check if any field is empty
        if (!customer_name || !customer_address || !pizza_size || !toppings) {
            throw new Error("All fields are required.");
        }

        let order_id = await insertOrder(customer_name, customer_address, pizza_size);
        await insertOrderDetails(order_id, toppings);

        let zip_code = zipCode.match(/\b\d{5}\b/)[0];
        let tax_rate = await getTaxRate(zip_code);
        let price = await getPrice(pizza_size, toppings, zip_code, tax_rate);

        result = `Thank you for your order! Your total price is $${price.toFixed(2)}.`;
    } catch (error) {
        result = error;
    }

    let source = fs.readFileSync("./templates/lesson12.html");
    let template = handlebars.compile(source.toString());
    let data = {
        table: await getOrderData(),
        message: result,
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
        Orders.Size AS Size,
        GROUP_CONCAT(OrderDetails.Topping, ', ') AS Toppings
    FROM Orders
    JOIN Customers ON Orders.CustomerID = Customers.ID
    JOIN OrderDetails ON Orders.ID = OrderDetails.OrderID
    GROUP BY Orders.ID;
     `
    let parameters = {};
    let rows = await sqliteAll(sql, parameters);

    let result = "<table><tr><th>Order ID</th>";
    result += "<th>Customer Name</th>";
    result += "<th>Customer Address</th>";
    result += "<th>Size</th>";
    result += "<th>Toppings</th></tr>";
    for (i = 0; i < rows.length; i++) {
        result += "<tr><td>" + rows[i].OrderID + "</td>"
        result += "<td>" + rows[i].CustomerID + "</td>"
        result += "<td>" + rows[i].CustomerName + "</td>"
        result += "<td>" + rows[i].CustomerAddress + "</td>"
        result += "<td>" + rows[i].Size + "</td>"
        result += "<td>" + rows[i].Toppings + "</td></tr>"
    }
    result += "</table>"
    return result;
}

async function insertOrder(customer_name, customer_address, pizza_size, ) {
    // Insert customer and order data into the database
    let sql = `
            INSERT INTO Customers (Name, Address)
            VALUES (?, ?);
        `
    let parameters = [customer_name, customer_address];
    let result = await sqliteRun(sql, parameters);
    let customer_id = result.lastID;

    sql = `
            INSERT INTO Orders (CustomerID, Size)
            VALUES (?, ?);
        `
    parameters = [customer_id, pizza_size];
    result = await sqliteRun(sql, parameters);
    let order_id = result.lastID;

    return order_id;
}

async function insertOrderDetails(order_id, toppings) {
    let topping_array = toppings.split(", ");
    let sql = "";
    let parameters = {};
    topping_array.forEach((topping, index) => {
        sql += 'INSERT INTO OrderDetails (OrderID, Topping) VALUES ($order_id_${index}, $topping_${index});';
        parameters['$order_id_${index}'] = order_id;
        parameters['$topping_${index}'] = topping;
    });
    await sqliteRun(sql, parameters);
}

// Get tax rate for a given zip code
async function getTaxRate(zip_code) {
    try {
        const url = `http://web250taxrates.harpercollege.edu/taxrates/IL/${zip_code}`;
        const response = await axios.get(url);
        return response.data.taxRate;
    } catch (error) {
        console.error(error);
        throw new Error("Error getting tax rate.");
    }
}

async function getPrice(pizza_size, toppings, zip_code) {
    // Define base price based on pizza size
    let base_price;
    switch (pizza_size) {
        case "small":
            base_price = 10;
            break;
        case "medium":
            base_price = 12;
            break;
        case "large":
            base_price = 14;
            break;
        case "extra-large":
            base_price = 16;
            break;
        default:
            throw new Error(`Invalid pizza size: ${pizza_size}`);
    }

    // Add topping prices
    let topping_prices = {
        pepperoni: 1,
        mushrooms: 1,
        onions: 1,
        sausage: 1,
    };

    let total_topping_price = 0;
    toppings.forEach((topping) => {
        if (topping_prices[topping]) {
            total_topping_price += topping_prices[topping];
        }
    });

    // Add tax based on zip code
    let tax_rate = await getTaxRate(zip_code);
    let tax = base_price * tax_rate;

    // Calculate total price
    let total_price = base_price + total_topping_price + tax;

    return total_price;
}

async function sqliteAll(sql, parameters) {
    let promise = new Promise((resolve, reject) => {
        let database = new sqlite3.Database(DATABASE);
        database.serialize();
        database.all(sql, parameters, function (error, rows) {
            if (error)
                reject(error);
            else
                resolve(rows);
        });
        database.close();
    });

    let result = await promise;
    return result;
}

function sqliteRun(sql, parameters) {
    return new Promise((resolve, reject) => {
        let database = new sqlite3.Database(DATABASE);
        database.run(sql, parameters, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
        database.close();
    });
}

module.exports = router;