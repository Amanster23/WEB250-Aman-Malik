// This module returns a rendered template.
//
// References:
//  https://expressjs.com/en/starter/hello-world.html
//  https://expressjs.com/en/guide/routing.html
//  https://www.npmjs.com/package/handlebars
//  https://handlebarsjs.com/guide
//  https://nodejs.org/api/os.html

const express = require('express')
const fs = require("fs");
const handlebars = require('handlebars');
const os = require('os');

const router = express.Router()
router.get("/", function (request, response) {
    let source = fs.readFileSync("./templates/template.html");
    let template = handlebars.compile(source.toString());
    let date = new Date();
    let host = os.hostname();
    let interfaces = os.networkInterfaces();
    let ip;
    for (let interface in interfaces) {
        interfaces[interface].forEach(function(address) {
            if (address.family === 'IPv4' && !address.internal) {
               ip = address.address;
            }
        });
    } 
    let system = os.platform();
    let version = process.version;
    let data = {
        greeting: "Hello",
        name: "Aman",
        date: date,
        host: host,
        address: ip,
        system: system,
        version: version
    }
    let result = template(data);
    response.send(result);
});

module.exports = router;