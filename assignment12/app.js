// Demonstrates a complete server-side website using:
//   * static HTML and CSS
//   * a template
//   * a code module
//
// NOTE: Static pages (html, css, images, etc.) are placed in
// a folder named "static". Template pages are placed in a folder
// named "templates".
//
// Folder structure:
// app.js
// hello.js
// static
//   index.html
//   static.html
//   styles.css
// templates
//   template.html
//
// References:
//  https://repl.it/languages/express
//  https://expressjs.com/en/guide/routing.html
//  https://www.npmjs.com/package/express-fileupload
//  https://www.tutorialspoint.com/expressjs/expressjs_cookies.htm
//  https://www.geeksforgeeks.org/session-cookies-in-nodejs/
//  https://www.geeksforgeeks.org/node-js-crypto-randombytes-method/

const express = require("express");
const fileUpload = require('express-fileupload');
const cookieParser = require("cookie-parser");
const session = require("express-session");
const crypto = require("crypto");

const app = express();

app.use(express.static(__dirname + '/static'));
app.use(express.urlencoded({
        extended: true
}));

app.use(fileUpload({
    limits: { fileSize: 1 * 1024 * 1024 },
}));
app.use(cookieParser());
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: crypto.randomBytes(16).toString("hex")
}));

const fs = require("fs");
fs.readdirSync("./routes").map((filename) => {
    const module = require("./routes/" + filename);
    const route = filename.replace(".js", "")
    app.use("/" + route, module);
});

app.listen(3000, () => console.log('server started'));