// This program reads a user-selected text file of Storm Data
// and shows the maximum sustained wind in mph and what Saffir Simpson 
// category it is in.
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
    let result = "<table><tr><th>Date</th><th>Storm</th><th>MaximumSustainedWinds</th></tr>";
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
    let index = line.indexOf("Date,Storm,MaximumSustainedWinds");
    if (index >= 0) {
        return;
    }

    let fields = line.split(",");
    if (fields.length != 3) {
        global.forEach += "<tr><td colspan='5'>Invalid file format</td></tr>";
        return;
    }

    let date = fields[0];
    let storm = fields[1];
    let windsInKmh = parseInt(fields[2]);

    let windsInMph = parseInt((windsInKmh * 0.621371).toFixed(1));
    let category = getSaffirSimpsonCategory(windsInKmh);

    global.forEach += "<tr><td>" + date + "</td>";
    global.forEach += "<td>" + storm + "</td>";
    global.forEach += "<td>" + windsInKmh + "km/h" + "</td>";
    global.forEach += "<td>" + windsInMph.toFixed(1) + "mph" + "</td>";
    global.forEach += "<td>" + category + "</td></tr>";
}


function getSaffirSimpsonCategory(windsInKmh) {
    let category;
    if (windsInKmh >= 252) {
        category = "<span class='category-5'>Category 5</span>";
    } else if (windsInKmh >= 209) {
        category = "<span class='category-4'>Category 4</span>";
    } else if (windsInKmh >= 178) {
        category = "<span class='category-3'>Category 3</span>";
    } else if (windsInKmh >= 154) {
        category = "<span class='category-2'>Category 2</span>";
    } else if (windsInKmh >= 119) {
        category = "<span class='category-1'>Category 1</span>";
    } else if (windsInKmh >= 63) {
        category = "<span class='tropical-storm'>Tropical Storm</span>";
    } else {
        category = "<span class='tropical-depression'>Tropical Depression</span>";
    }
    return category;
}

module.exports = router;