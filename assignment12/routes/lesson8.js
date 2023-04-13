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
const fetch = require('node-fetch');
const router = express.Router();

router.get('/', async (req, res) => {
  const source = fs.readFileSync('./templates/lesson8.html');
  const template = handlebars.compile(source.toString());
  const response = await fetch('https://query.wikidata.org/sparql?query=%23%20Tropical%20Cyclones%20and%20Maximum%20Sustained%20Winds%0A%0ASELECT%20DISTINCT%20%3FDate%20%3FStorm%20%3FMaximumSustainedWinds%0AWHERE%20%7B%0A%20%20%3FstormItem%20wdt%3AP31%20wd%3AQ8092.%0A%20%20%7B%0A%20%20%20%20%3FstormItem%20rdfs%3Alabel%20%3FStorm.%0A%20%20%20%20FILTER((LANG(%3FStorm))%20%3D%20%22en%22)%0A%20%20%7D%0A%0A%20%20%3FstormItem%20wdt%3AP580%20%3FDate.%0A%20%20%0A%20%20%3FstormItem%20wdt%3AP2895%20%3FMaximumSustainedWindsValue%20.%0A%20%20%3FstormItem%20p%3AP2895%2Fpsv%3AP2895%20%3FmaximumSustainedWinds.%0A%20%20%3FmaximumSustainedWinds%20wikibase%3AquantityUnit%20%3FmaximumSustainedWindsUnit.%0A%20%20%7B%0A%20%20%20%20%3FmaximumSustainedWindsUnit%20rdfs%3Alabel%20%3FmaximumSustainedWindsLabel.%0A%20%20%20%20FILTER((LANG(%3FmaximumSustainedWindsLabel))%20%3D%20%22en%22)%0A%20%20%20%20FILTER(CONTAINS(%3FmaximumSustainedWindsLabel%2C%20%22kilometre%20per%20hour%22))%0A%20%20%7D%0A%20%20BIND(CONCAT(STR(%3FMaximumSustainedWindsValue)%2C%20%22%20km%2Fh%22)%20AS%20%3FMaximumSustainedWinds)%0A%7D%0AORDER%20BY%20(%3FDate)&format=json');
  const json = await response.json();
  const stormData = [];

  json.results.bindings.forEach((line) => {
    const windsInKmh = parseInt(line.MaximumSustainedWinds.value);
    const windsInMph = parseInt((windsInKmh * 0.621371).toFixed(1));
    const category = getSaffirSimpsonCategory(windsInKmh);

    const stormObj = {
      date: line.Date.value,
      storm: line.Storm.value,
      windsKmh: windsInKmh,
      windsMph: windsInMph,
      category: category,
    };
    stormData.push(stormObj);
  });

  const context = {
    table: generateTable(stormData),
  };

  const html = template(context);
  res.send(html);
});

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

function generateTable(stormData) {
  let result = '<table><tr><th>Storm</th><th>MaximumSustainedWinds</th><th>MaximumSustainedWinds</th><th>Category</th></tr>';

  stormData.sort((a, b) => b.windsKmh - a.windsKmh);

  stormData.forEach((stormObj) => {
    result += '<tr><td>' + stormObj.storm + '</td>';
    result += '<td>' + stormObj.windsKmh + 'km/h' + '</td>';
    result += '<td>' + stormObj.windsMph + 'mp/h' + '</td>';
    result += '<td>' + stormObj.category + '</td></tr>';
  });

  
  result += '</table>';
  return result;
}

module.exports = router;