// Creating a math expressions game where user enters the value and number of expressions.
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
    let source = fs.readFileSync("./templates/lesson4.html");
    let template = handlebars.compile(source.toString());
    let data = {
        expression: "",
        answer: ""
    }
    result = template(data);
    response.send(result);
});

router.post("/", function (request, response) {
    let value = Number(request.body.value);
    let numExpressions = Number(request.body.numExpressions);
    let submit = request.body.submit;

    let result = "";
    if (submit == "Submit") {
        result = processExpressions(value, numExpressions);
    }
    else {
        result = "Unexpected submit value: " + submit;
    }

    let source = fs.readFileSync("./templates/lesson4.html");
    let template = handlebars.compile(source.toString());
    let data = {
        expression: result,
        answer: ""
    }
    result = template(data);
    response.send(result);
});

function processExpressions(value, numExpressions) {
    let expression = "";
    let randomOperand = Math.floor(Math.random() * value);
    expression = `${value} + ${randomOperand} = `;
    return expression;
}

module.exports = router;

