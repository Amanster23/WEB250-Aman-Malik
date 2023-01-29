// Converts a feet temperature to yards using a GET request and
// converts a yards temperature to feet using a POST request.
//
// References:
//  https://www.mathsisfun.com/temperature-conversion.html
//  https://en.wikibooks.org/wiki/JavaScript
//  https://stackabuse.com/get-query-strings-and-parameters-in-express-js/
//  https://flaviocopes.com/express-forms/
//  https://expressjs.com/en/guide/routing.html

const express = require('express')
const fs = require("fs");
const handlebars = require('handlebars');
const router = express.Router()

router.get("/", function (request, response) {
    let result = "";
    if (request.query.feet) {
        let feet = request.query.feet;
        let yards = feet / 3 ;
        let inches = feet * 12;
        result = feet + " feet is " +
            yards + " yards and " + inches + " inches.";
    }

    let source = fs.readFileSync("./templates/lesson3.html");
    let template = handlebars.compile(source.toString());
    let data = {
        feet: result,
        yards: ""
    }
    result = template(data);
    response.send(result);
});

router.post("/", function (request, response) {
    let result = "";

    if (request.body.yards) {
        let yards = request.body.yards;
        let feet = yards * 3;
        let inches = yards * 36;
        result = yards + " yards is " +
            feet + " feet and " + inches + " inches.";
    }

    let source = fs.readFileSync("./templates/lesson3.html");
    let template = handlebars.compile(source.toString());
    let data = {
        feet: "",
        yards: result
    }
    result = template(data);
    response.send(result);
});

module.exports = router;