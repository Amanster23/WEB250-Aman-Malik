// This module returns a rendered template.
//
// References:
//  https://expressjs.com/en/starter/hello-world.html
//  https://expressjs.com/en/guide/routing.html
//  https://www.npmjs.com/package/handlebars
//  https://handlebarsjs.com/guide

const express = require('express')
const fs = require("fs");
const handlebars = require('handlebars');

const router = express.Router()
router.get("/", function (request, response) {
    let source = fs.readFileSync("./templates/template.html");
    let template = handlebars.compile(source.toString());
    let date = new Date();
    let data = {
        greeting: "Hello",
        name: "Aman",
        date: date,
        host:"hi",
        address: "hi",
        os: "hi"
    }
    let result = template(data);
    response.send(result);
});

module.exports = router;