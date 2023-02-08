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
        answer: "",
        correct: 0,
        total: 0
    }
    let result = template(data);
    response.send(result);
});

router.post("/", function (request, response) {
    let value = Number(request.body.value);
    let numExpressions = Number(request.body.numExpressions);
    let submit = request.body.submit;
    let correct = Number(request.body.correct);
    let total = Number(request.body.total);

    if (submit == "Submit") {
        let result = processExpression(value, correct, total, numExpressions, request.body.answer);
        let source = fs.readFileSync("./templates/lesson4.html");
        let template = handlebars.compile(source.toString());
        let data = {
            expression: result.expression,
            answer: result.answer,
            correct: result.correct,
            total: result.total
        }
        result = template(data);
        response.send(result);
    }
    else {
        response.send("Unexpected submit value: " + submit);
    }
});

function processExpression(value, correct, total, numExpressions, answer) {
    if (total >= numExpressions) {
        return { expression: "", answer: "Game Over. You answered " + correct + " out of " + total + " expressions correctly.", correct: correct, total: total};
    }

    let expression = "";
    let randomOperand = Math.floor(Math.random() * value);
    expression = `${value} + ${randomOperand} = `;
    total++;

    let correctAnswer = value + randomOperand;
    let result = "Incorrect. The correct answer is " + correctAnswer + ".";
    if (answer && answer == correctAnswer) {
        correct++;
        result = "Correct!";
    }

    return { expression: expression, answer: result, correct: correct, total: total };
}

module.exports = router;


