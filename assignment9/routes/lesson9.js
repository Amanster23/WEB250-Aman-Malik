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
    }
    catch(error) {
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
        let toppings = request.body.toppings.trim();

        let order_id = await insertOrder(customer_name, customer_address, pizza_size);
        await insertOrderDetails(order_id, toppings);

        result = await getOrderData();
    }
    catch(error) {
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
            Address TEXT NOT NULL;
        `
    parameters = {};
    await sqliteRun(sql, parameters);

    sql = `
        CREATE TABLE Orders(
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            CustomerID INTEGER NOT NULL,
            Size TEXT NOT NULL,
            FOREIGN KEY (CustomerID) REFERENCES Customers(ID)
        `
    parameters = {};
    await sqliteRun(sql, parameters);

    sql = `
        CREATE TABLE OrderDetails(
            OrderID INTEGER NOT NULL,
            Topping TEXT NOT NULL,
            FOREIGN KEY (OrderID) REFERENCES Orders(ID)
        `
    parameters = {};
    await sqliteRun(sql, parameters);
}

async function getData() {
    let sql = `
            SELECT ID, Country, Temperature FROM Countries;
        `
    let parameters = {};
    let rows = await sqliteAll(sql, parameters);

    let result = "<table><tr><th>ID</th>";
    result += "<th>Country</th>";
    result += "<th>Temperature</th></tr>";
    for (i = 0; i < rows.length; i++) {
        result += "<tr><td>" + rows[i].ID + "</td>"
        result += "<td>" + rows[i].Country + "</td>"
        result += "<td>"+ rows[i].Temperature + "</td></tr>"
    }
    result += "</table>"    
    return result;
}

async function countryExists(country) {
    let sql = `
            SELECT EXISTS(
                SELECT * FROM Countries
                WHERE Country = $country) AS Count;
        `
    let parameters = {
        $country: country
    };
    let rows = await sqliteAll(sql, parameters);
    let result = !!rows[0].Count;
    return result;
}

async function insertCountry(country, temperature) {
    let sql = `
            INSERT INTO Countries (Country, Temperature)
            VALUES($country, $temperature);
        `
    let parameters = {
        $country: country,
        $temperature: temperature
    };
    await sqliteRun(sql, parameters);
}

async function updateCountry(country, temperature) {
    let sql = `
            UPDATE Countries
            SET Temperature = $temperature
            WHERE Country = $country;
        `
    let parameters = {
        $country: country,
        $temperature: temperature
    };
    await sqliteRun(sql, parameters);
}

async function deleteCountry(country) {
    let sql = `
            DELETE FROM Countries
            WHERE Country = $country;
        `
    let parameters = {
        $country: country
    };
    await sqliteRun(sql, parameters);
}

async function sqliteAll(sql, parameters) {
    let promise = new Promise((resolve, reject) => {
        let database = new sqlite3.Database(DATABASE);
        database.serialize();
        database.all(sql, parameters, function(error, rows) {
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

async function sqliteRun(sql, parameters) {
    let promise = new Promise((resolve, reject) => {
        let database = new sqlite3.Database(DATABASE);
        database.serialize();
        database.run(sql, parameters, function(error, rows) {
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

module.exports = router;