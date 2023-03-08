// This program reads JSON data from Wikidata with countries
// and Celsius temperatures. It displays the data in Celsius
// and Fahrenheit sorted in decending order by temperature.
//
// References:
//  https://www.mathsisfun.com/temperature-conversion.html
//  https://en.wikibooks.org/wiki/JavaScript
//  https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service
//  https://hackersandslackers.com/making-api-requests-with-nodejs/
//  https://zellwk.com/blog/async-await-express/

const express = require('express');
const fs = require("fs");
const handlebars = require('handlebars');
const router = express.Router();

router.get('/', (req, res) => {
  const source = fs.readFileSync('./templates/lesson8.html');
  const template = handlebars.compile(source.toString());
  const jsonData = fs.readFileSync('./routes/lesson8.json', 'utf8');
  const json = JSON.parse(jsonData);
  const stormData = [];

  json.forEach((line) => {
    const windsInKmh = parseInt(line.MaximumSustainedWinds);
    const windsInMph = parseInt((windsInKmh * 0.621371).toFixed(1));
    const category = getSaffirSimpsonCategory(windsInKmh);

    const stormObj = {
      storm: line.Storm,
      windsInKmh,
      windsInMph,
      category,
    };
    stormData.push(stormObj);
  });

  stormData.sort((a, b) => b.windsInKmh - a.windsInKmh);

  const data = {
    table: generateTable(stormData),
  };

  const result = template(data);
  res.send(result);
});


router.post('/', (req, res) => {
  let result = '';

  if (!req.files || Object.keys(req.files).length === 0) {
    result = 'No file selected';
  } else {
    const file = req.files.file;
    result += '<h2>' + file.name + '</h2>';
    result += generateTable(JSON.parse(file.data));
  }

  const source = fs.readFileSync('./templates/lesson8.html');
  const template = handlebars.compile(source.toString());
  const data = {
    table: result,
  };
  const output = template(data);
  res.send(output);
});

function generateTable(stormData) {
  let result = '<table><tr><th>Storm</th><th>MaximumSustainedWinds</th><th>MaximumSustainedWinds</th><th>Category</th></tr>';

  stormData.forEach((stormObj) => {
    result += '<tr><td>' + stormObj.storm + '</td>';
    result += '<td>' + stormObj.windsInKmh + 'km/h' + '</td>';
    result += '<td>' + stormObj.windsInMph + 'mp/h' + '</td>';
    result += '<td>' + stormObj.category + '</td></tr>';
  });

  stormData.sort((a, b) => b.windsInKmh - a.windsInKmh);

  result += '</table>';
  return result;
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