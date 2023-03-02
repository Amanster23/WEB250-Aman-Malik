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

const express = require("express");
const fileUpload = require('express-fileupload');

const app = express();

app.use(express.static(__dirname + '/static'));
app.use(express.urlencoded({
        extended: true
}));

app.use(fileUpload({
    limits: { fileSize: 1 * 1024 * 1024 },
}));

const fs = require("fs");
fs.readdirSync("./routes").map((filename) => {
    const module = require("./routes/" + filename);
    const route = filename.replace(".js", "")
    app.use("/" + route, module);
});

app.listen(3000, () => console.log('server started'));