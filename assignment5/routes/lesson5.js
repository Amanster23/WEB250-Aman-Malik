// This program reads a user-selected text file of Celsius
// temperatures and converts the temperatures to Fahrenheit.
//
// File format:
// Country,MaximumTemperature
// Bulgaria,45.2 °C
// Canada,45 °C
//
//  https://www.mathsisfun.com/temperature-conversion.html
//  https://en.wikibooks.org/wiki/JavaScript
//  https://www.npmjs.com/package/express-fileupload

const express = require('express')
const fs = require("fs");
const handlebars = require('handlebars');
const router = express.Router()

router.get("/", function (request, response) {
    let source = fs.readFileSync("./templates/lesson5.html");
    let template = handlebars.compile(source.toString());
    let data = {
        table: ""
    }
    result = template(data);
    response.send(result);
});

router.post("/", function (request, response) {
    let result = "";

    if (!request.files || Object.keys(request.files).length == 0) {
        result = "No file selected"
    } else {
        let file = request.files.file;
        result += "<h2>" + file.name + "</h2>";
        result += processFile(file)
    }

    let source = fs.readFileSync("./templates/lesson5.html");
    let template = handlebars.compile(source.toString());
    let data = {
        table: result
    }
    result = template(data);
    response.send(result);
});

function processFile(file) {
    let result = "<table><tr><th>Celsius</th><th>Fahrenheit</th></tr>";
    let text = file.data.toString();
    let lines = text.trim().split("\n");

    // forEach doesn't return a value. Using global.forEach instead.
    global.forEach = "";
    lines.forEach(processLine);
    result += global.forEach;
    delete global.forEach;

    result += "</table>";
    return result
}

function processLine(line) {
    // skip heading
    let index = line.indexOf("Country,MaximumTemperature");
    if (index >= 0) {
        return;
    }

    // find temperature
    let start = line.indexOf(",");
    let end = line.indexOf("°C");
    if (start < 0 || end < 0) {
        global.forEach += "Invalid file format";
        return
    }

    let celsius = Number(line.substring(start + 1, end));
    let fahrenheit = celsius * 9 / 5 + 32;

    global.forEach += "<tr><td>" + celsius + "</td>";
    global.forEach += "<td>" + fahrenheit.toFixed(1) + "</td></tr>";
}

module.exports = router;