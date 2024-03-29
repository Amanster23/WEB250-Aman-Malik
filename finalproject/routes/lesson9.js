// This program creates and displays a temperature database
// with options to insert, update, and delete records.
//
// References:
//  https://en.wikibooks.org/wiki/JavaScript
//  https://zellwk.com/blog/async-await-express/
//  https://github.com/mapbox/node-sqlite3/wiki
//  https://blog.pagesd.info/2019/10/29/use-sqlite-node-async-await/

const express = require("express");
const fs = require("fs");
const handlebars = require('handlebars');
const sqlite3 = require("sqlite3")
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

    let source = fs.readFileSync("./templates/lesson9.html");
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

        let order_id = await insertOrder(customer_name, customer_address, pizza_size);
        await insertOrderDetails(order_id, toppings);

        result = await getOrderData();
    } catch (error) {
        result = error;
    }

    let source = fs.readFileSync("./templates/lesson9.html");
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
async function insertOrder(customer_name, customer_address, pizza_size) {
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
    let topping_array = toppings.split(",");
    let sql = `
            INSERT INTO OrderDetails (OrderID, Topping) 
            VALUES (?, ?); 
        `
    let parameters = [];
    for (i = 0; i < topping_array.length; i++) {
        let topping = topping_array[i].trim();
        if (topping.length > 0) {
            parameters.push(order_id);
            parameters.push(topping);
            let result = await sqliteRun(sql, parameters);
            order_id = result.lastID;
            parameters = [];
        }
    }
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
        database.run(sql, parameters, function(err) {
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