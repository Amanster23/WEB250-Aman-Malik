// This program reads a user-selected text file of countries
// and Celsius temperatures. It displays the data in Celsius
// and Fahrenheit sorted in descending order by temperature.
//
//  https://www.mathsisfun.com/temperature-conversion.html
//  https://en.wikibooks.org/wiki/JavaScript
//  https://www.npmjs.com/package/express-fileupload

const express = require('express');
const fs = require("fs");
const handlebars = require('handlebars');
const router = express.Router();

router.get("/", function (request, response) {
    let source = fs.readFileSync("./templates/lesson7.html");
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

    let source = fs.readFileSync("./templates/lesson7.html");
    let template = handlebars.compile(source.toString());
    let data = {
        table: result
    }
    result = template(data);
    response.send(result);
});

function processFile(file) {
    let result = "<table><tr><th>Storm</th><th>MaximumSustainedWinds</th><th>MaximumSustainedWinds</th><th>Category</th></tr>";
    let text = file.data.toString();
    let lines = text.trim().split("\n");

    // build associative array of storm data
    let stormData = [];
    lines.forEach(function(line) {
        let fields = line.split(",");
        if (fields.length == 3) {
            let storm = fields[1];
            let windsInKmh = parseInt(fields[2]);

            let windsInMph = parseInt((windsInKmh * 0.621371).toFixed(1));
            let category = getSaffirSimpsonCategory(windsInKmh);

            let stormObj = {
                storm: storm,
                windsInKmh: windsInKmh,
                windsInMph: windsInMph,
                category: category
            };
            stormData.push(stormObj);
        }
    });

    // sort storm data by storm intensity in decreasing order
    stormData.sort(function(a, b) {
        return b.windsInKmh - a.windsInKmh;
    });

    stormData.forEach(function(stormObj) {
        result += "<tr><td>" + stormObj.storm + "</td>";
        result += "<td>" + stormObj.windsInKmh + "km/h" + "</td>";
        result += "<td>" + stormObj.windsInMph + "mph" + "</td>";
        result += "<td>" + stormObj.category + "</td></tr>";
    });

    result += "</table>";
    return result

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
}

module.exports = router;
