// Displays "Hello code world!"
//
// References:
//  https://expressjs.com/en/starter/hello-world.html
//  https://expressjs.com/en/guide/routing.html

const express = require('express')
const router = express.Router()

const HTML = `
<!DOCTYPE html>
<html lang="en">
<meta charset="UTF-8">
<title>Hello World</title>
<link rel="stylesheet" href="styles.css">    
`

router.get("/", function (request, response) {
    result = HTML;
    result += "Hello Aman!";
    response.send(result);
});

module.exports = router;