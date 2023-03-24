// This program creates and displays a temperature database
// with options to insert, update, and delete records.
//
// References:
//  https://en.wikibooks.org/wiki/JavaScript
//  https://zellwk.com/blog/async-await-express/
//  https://docs.mongodb.com/drivers/node/usage-examples

const express = require("express");
const fs = require("fs");
const handlebars = require('handlebars');
const mongodb = require("mongodb")
const bcrypt = require('bcrypt');
const router = express.Router();

const HOST = "mongodb://127.0.0.1:27017";
const DATABASE = "pizza-order-app";
const COLLECTION = "employees";
const SALT_ROUNDS = 10;

router.get("/", async (request, response) => {
    let result = "";

    try {
        result = await getEmployeeData();
    } catch (error) {
        result = error;
    }

    let source = fs.readFileSync("./templates/lesson10.html");
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
        let username = request.body.username.trim();
        let full_name = request.body.full_name.trim();
        let password = request.body.password.trim();
        let employee_status = request.body.employee_status.trim();

        if (!await employeeExists(username)) {
            await insertEmployee(username, full_name, password, employee_status)
        } else if (password != "") {
            await updateEmployee(username, full_name, password, employee_status)
        } else {
            await deleteEmployee(username)
        }

        result = await getEmployeeData();
    } catch (error) {
        result = error;
    }

    let source = fs.readFileSync("./templates/lesson10.html");
    let template = handlebars.compile(source.toString());
    let data = {
        table: result
    }
    result = template(data);
    response.send(result);
});

async function getEmployeeData() {
    const client = new mongodb.MongoClient(HOST);
    await client.connect();
    const database = client.db(DATABASE);
    const collection = database.collection(COLLECTION);
    const documents = await collection.find().toArray();


    let result = "<table><tr><th>Username</th>";
    result += "<th>Full Name</th>";
    result += "<th>Employee Status</th></tr>";
    for (i = 0; i < documents.length; i++) {
        result += "<tr><td>" + documents[i].username + "</td>";
        result += "<td>" + documents[i].full_name + "</td>";
        result += "<td>" + documents[i].employee_status + "</td></tr>";
    }
    result += "</table>";
    await client.close();
    return result;
}

async function employeeExists(username) {
    const client = new mongodb.MongoClient(HOST);
    await client.connect();
    const database = client.db(DATABASE);
    const collection = database.collection(COLLECTION);
    const filter = {
        username: username
    };
    const count = await collection
        .countDocuments(filter);
    await client.close();
    return count > 0;
}

async function insertEmployee(username, full_name, password, employee_status) {
    const client = new mongodb.MongoClient(HOST);
    await client.connect();
    const database = client.db(DATABASE);
    const collection = database.collection(COLLECTION);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const employee = {
        username: username,
        full_name: full_name,
        password: hashedPassword,
        employee_status: employee_status
    };
    await collection.insertOne(employee);
    await client.close();
}

async function updateEmployee(username, full_name, password, employee_status) {
    const client = new mongodb.MongoClient(HOST);
    await client.connect();
    const database = client.db(DATABASE);
    const collection = database.collection(COLLECTION);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const filter = {
        username: username
    };
    const update = {
        $set: {
            full_name: full_name,
            password: hashedPassword,
            employee_status: employee_status
        }
    };
    await collection.updateOne(filter, update);
    await client.close();
}

async function deleteEmployee(username) {
    const client = new mongodb.MongoClient(HOST);
    await client.connect();
    const database = client.db(DATABASE);
    const collection = database.collection(COLLECTION);
    const filter = {
        username: username
    };
    await collection.deleteOne(filter);
    await client.close();
}

module.exports = router;

// Requires a Mongo installation to manage the database.
// Use of a Docker container is recommended.
// See https://en.wikiversity.org/wiki/Docker/MongoDB .
// If both the Node website and Mongo are running in containers, 
// use 172.17.0.2 for the mongodb host address.
// If the Node website and/or Mongo are running locally, use 127.0.0.1
// for the mongodb host address.

// const HOST = "mongodb://127.0.0.1:27017";
// const DATABASE = "temperature";
// const COLLECTION = "countries";

// router.get("/", async (request, response) => {
//     let result = "";

//     try {
//         result = await getData();
//     } catch (error) {
//         result = error;
//     }

//     let source = fs.readFileSync("./templates/lesson10.html");
//     let template = handlebars.compile(source.toString());
//     let data = {
//         table: result
//     }
//     result = template(data);
//     response.send(result);
// });

// router.post("/", async (request, response) => {
//     let result = "";

//     try {
//         let country = request.body.country.trim();
//         let temperature = request.body.temperature.trim();

//         if (!await countryExists(country)) {
//             await insertCountry(country, temperature)
//         } else if (temperature != "") {
//             await updateCountry(country, temperature)
//         } else {
//             await deleteCountry(country)
//         }

//         result = await getData();
//     } catch (error) {
//         result = error;
//     }

//     let source = fs.readFileSync("./templates/lesson10.html");
//     let template = handlebars.compile(source.toString());
//     let data = {
//         table: result
//     }
//     result = template(data);
//     response.send(result);
// });

// async function getData() {
//     const client = new mongodb.MongoClient(HOST);
//     await client.connect();
//     const database = client.db(DATABASE);
//     const collection = database.collection(COLLECTION);
//     const documents = await collection.find().toArray();


//     let result = "<table><tr><th>ID</th>";
//     result += "<th>Country</th>";
//     result += "<th>Temperature</th></tr>";
//     for (i = 0; i < documents.length; i++) {
//         result += "<tr><td>" + documents[i]._id + "</td>";
//         result += "<td>" + documents[i].country + "</td>";
//         result += "<td>" + documents[i].temperature + "</td></tr>";
//     }
//     result += "</table>";
//     await client.close();
//     return result;
// }

// async function countryExists(country) {
//     const client = new mongodb.MongoClient(HOST);
//     await client.connect();
//     const database = client.db(DATABASE);
//     const collection = database.collection(COLLECTION);
//     const filter = {
//         country: country
//     };
//     const count = await collection.countDocuments(filter);
//     await client.close();
//     return !!(count);
// }

// async function insertCountry(country, temperature) {
//     const client = new mongodb.MongoClient(HOST);
//     await client.connect();
//     const database = client.db(DATABASE);
//     const collection = database.collection(COLLECTION);
//     const document = {
//         country: country,
//         temperature: temperature
//     };
//     await collection.insertOne(document);
//     await client.close();
// }

// async function updateCountry(country, temperature) {
//     const client = new mongodb.MongoClient(HOST);
//     await client.connect();
//     const database = client.db(DATABASE);
//     const collection = database.collection(COLLECTION);
//     const filter = {
//         country: country
//     };
//     const update = {
//         "$set": {
//             "temperature": temperature
//         }
//     };
//     await collection.updateOne(filter, update);
//     await client.close();
// }

// async function deleteCountry(country) {
//     const client = new mongodb.MongoClient(HOST);
//     await client.connect();
//     const database = client.db(DATABASE);
//     const collection = database.collection(COLLECTION);
//     const filter = {
//         country: country
//     };
//     await collection.deleteOne(filter);
//     await client.close();
// }

// module.exports = router;