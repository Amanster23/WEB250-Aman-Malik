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
const router = express.Router();

let countries = [];
let lastID = 0;

const instructions = `
<p>Use cURL commands to test the REST API.</p>
<p>Insert countries:<br>
curl -X POST -d "country=Bulgaria&temperature=45.2%20°C" http://host/example/countries<br>
curl -X POST -d "country=Canada&temperature=45%20°C" http://host/example/countries<br>
curl -X POST -d "country=Finland&temperature=37.2%20°C" http://host/example/countries<br>
curl -X POST -d "country=Germany&temperature=42.6%20°C" http://host/example/countries<br>
curl -X POST -d "country=Japan&temperature=41%20°C" http://host/example/countries<br>
curl -X POST -d "country=United%20States%20of%20America&temperature=56.7%20°C" http://host/example/countries</p>
<p>Get countries:<br>
curl -X GET http://host/example/countries</p>
<p>Get country #6:<br>
curl -X GET http://host/example/countries/6</p>
<p>Update country #6:<br>
curl -X PUT -d "country=United%20States%20of%20America&temperature=55%20°C" http://host/example/countries/6</p>
<p>Get country #6.<br>
curl -X GET http://host/example/countries/6</p>
<p>Delete country #6:<br>
curl -X DELETE http://host/example/countries/6</p>
<p>Get Countries:<br>
curl -X GET http://host/example/countries</p>
`

router.get("/", function (request, response) {
    let host = request.get("host");
    let baseUrl = request.baseUrl;
    let result = instructions.replace(/host\/example/g, host + baseUrl)
    response.send(result);
});

router.get("/countries", function (request, response) {
    let result = JSON.stringify(countries, null, 2);
    response.send(result);
});

router.get("/countries/:id", function (request, response) {
    let id = request.params.id;
    let country = countries[id];
    if (country == undefined) {
        response.status(404).send("Not found");
    }
    else {
        response.send(JSON.stringify(country, null, 2));
    }
});

router.post("/countries", function (request, response) {
    let country = {};
    let id = ++lastID;
    country["id"] = id;
    country["country"] = request.body.country;
    country["temperature"] = request.body.temperature;
    countries[id] = country;
    response.status(201).send(JSON.stringify(country, null, 2));
});

router.put("/countries/:id", function (request, response) {
    let id = request.params.id;
    let country = countries[id];
    if (country == undefined) {
        response.status(404).send("Not found");
    }
    else {
        country["country"] = request.body.country;
        country["temperature"] = request.body.temperature;
        response.send(JSON.stringify(country, null, 2));
    }
});

router.delete("/countries/:id", function (request, response) {
    let id = request.params.id;
    let country = countries[id];
    if (country == undefined) {
        response.status(404).send("Not found");
    }
    else {
        delete countries[id];
        response.send(JSON.stringify(country, null, 2));
    }
});

module.exports = router;