const express = require("express");
const fs = require("fs");
const handlebars = require('handlebars');
const axios = require('axios');
const sqlite3 = require("sqlite3");
const {
    log
} = require("console");
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

    let source = fs.readFileSync("./templates/lesson13.html");
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


        let order_id = await insertOrder(customer_name, customer_address, pizza_size);
        await insertOrderDetails(order_id, toppings);

        let zip_code = zipCode.match(/\b\d{5}\b/)[0];
        let tax_rate = await getTaxRate(zip_code);
        let price = await getPrice(pizza_size, toppings, zip_code, tax_rate);
        console.log(price) // Getting NaN as price
        result = `Thank you for your order! Your total price is $${price.toFixed(2)}.`;

    } catch (error) {
        result = error;
        let source = fs.readFileSync("./templates/lesson13.html");
        let template = handlebars.compile(source.toString());
        let data = {
            table: await getOrderData(),
            message: result,
        }
        result = template(data);
        response.send(result);
    }
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
        SELECT Orders.ID, Customers.Name AS CustomerName, Customers.Address AS CustomerAddress, Orders.Size, GROUP_CONCAT(OrderDetails.Topping, ', ') AS Toppings
        FROM Orders
        LEFT JOIN Customers ON Orders.CustomerID = Customers.ID
        LEFT JOIN OrderDetails ON Orders.ID = OrderDetails.OrderID
        GROUP BY Orders.ID
        ORDER BY Orders.ID DESC;
    `;
    let parameters = {};
    return await sqliteAll(sql, parameters);
}

async function insertOrder(customer_name, customer_address, pizza_size) {
    let sql = `
        INSERT INTO Customers (Name, Address)
        VALUES ($customer_name, $customer_address);
    `;
    let parameters = {
        $customer_name: customer_name,
        $customer_address: customer_address
    };
    await sqliteRun(sql, parameters);

    let customerID = await getLastInsertedId();

    sql = `
        INSERT INTO Orders (CustomerID, Size)
        VALUES ($customerID, $pizza_size);
    `;
    parameters = {
        $customerID: customerID,
        $pizza_size: pizza_size
    };
    await sqliteRun(sql, parameters);

    return await getLastInsertedId();
}

async function insertOrderDetails(order_id, toppings) {
    let toppingsArray = toppings.split(", ");
    let sql = `
        INSERT INTO OrderDetails (OrderID, Topping)
        VALUES ${toppingsArray.map(() => "(?, ?)").join(", ")};
    `;
    let parameters = [];
    for (let topping of toppingsArray) {
        parameters.push(order_id, topping);
    }
    await sqliteRun(sql, parameters);
}

// Get tax rate for a given zip code
async function getTaxRate(zip_code) {
    try {
        const url = `http://web250taxrates.harpercollege.org/taxrates/IL/${zip_code}`;
        const response = await axios.get(url);
        return response.data.taxRate;
    } catch (error) {
        console.error(error);
        throw new Error("Error getting tax rate.");
    }
}


async function getPrice(pizza_size, toppings, zip_code, tax_rate) {
    // Get base price based on pizza size
    let base_price = 0;
    switch (pizza_size) {
        case 'Small':
            base_price = 8.99;
            break;
        case 'Medium':
            base_price = 10.99;
            break;
        case 'Large':
            base_price = 12.99;
            break;
        default:
            throw new Error("Invalid pizza size.");
    }

    // Calculate topping price
    let topping_price = 0;
    if (toppings) {
        let topping_count = toppings.split(', ').length;
        topping_price = topping_count * 0.99;
    }

    // Calculate total price with tax
    let total_price = 0;
    if (tax_rate !== 0) {
        total_price = base_price + topping_price;
        total_price *= (1 + tax_rate / 100);
    }

    return total_price;
}


async function getLastInsertedId() {
    let sql = `SELECT last_insert_rowid() AS id;`;
    let parameters = {};
    let rows = await sqliteAll(sql, parameters);
    return rows[0].id;
}

async function sqliteRun(sql, parameters) {
    return new Promise((resolve, reject) => {
        let db = new sqlite3.Database(DATABASE, sqlite3.OPEN_READWRITE, (error) => {
            if (error) reject(error);
        });

        db.run(sql, parameters, function (error) {
            if (error) reject(error);
            resolve();
        });

        db.close();
    });
}

async function sqliteAll(sql, parameters) {
    return new Promise((resolve, reject) => {
        let db = new sqlite3.Database(DATABASE, sqlite3.OPEN_READONLY, (error) => {
            if (error) reject(error);
        });

        db.all(sql, parameters, (error, rows) => {
            if (error) reject(error);
            resolve(rows);
        });

        db.close();
    });
}

async function sqliteGet(sql, parameters) {
    return new Promise((resolve, reject) => {
        let db = new sqlite3.Database(DATABASE, sqlite3.OPEN_READONLY, (error) => {
            if (error) reject(error);
        });

        db.get(sql, parameters, (error, row) => {
            if (error) reject(error);
            resolve(row);
        });

        db.close();
    });
}

module.exports = router;