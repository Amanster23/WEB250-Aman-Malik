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
    // Gets values from user
    let value = Number(request.body.value);
    let numExpressions = Number(request.body.numExpressions);

    let submit = request.body.submit;

    if (submit == "Submit") {
        let result = processExpression(value, numExpressions, request.body.answer);
        let source = fs.readFileSync("./templates/lesson4.html");
        let template = handlebars.compile(source.toString());
        let data = {
            expression: result.expression,
            answer: result.answer,
            correct: result.correct,
            total: result.total,
            randomOperand: result.randomOperand
        }
        result = template(data);
        response.send(result);
    } else {
        response.send("Unexpected submit value: " + submit);
    }
});




let total = -1;
let numExpressionsTrue = 0;
let correct = 0;
let valueTrue = 0;
let lastAnswer = [];

function processExpression(value, numExpressions, answer) {
    // Store the number of expressions to create
    numExpressionsTrue = numExpressionsTrue + numExpressions;
    // Stores constnat number
    valueTrue = valueTrue + value;

    // 
    if (total + 1 >= numExpressionsTrue) {
        return {
            expression: "",
            answer: "Game Over. You answered " + correct + " out of " + total + " expressions correctly."
        };
    }

    console.log(numExpressionsTrue,total)
    total++;

    let randomOperand = Math.floor(Math.random() * valueTrue);
    let expression = `${valueTrue} + ${randomOperand} = `;
    let correctAnswer = valueTrue + randomOperand;
    let answerMessage = "";

    lastAnswer.push((correctAnswer));

    if (answer) {
        if (Number(answer) === lastAnswer[total - 1]) {
            correct++;
            answerMessage = "Correct!";
        } else {
            answerMessage = "Incorrect. The correct answer is " + lastAnswer[total - 1] + ".";
        }
    }

    return {
        expression: expression,
        answer: answerMessage
    };
}

module.exports = router;