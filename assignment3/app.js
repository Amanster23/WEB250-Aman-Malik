// Demonstrates a complete server-side website using:
//   * static HTML and CSS
//   * a template
//   * a code module
//
// NOTE: Static pages (html, css, images, etc.) are placed in
// a folder named "static". Template pages are placed in a folder
// named "templates". Code modules are placed in a folder named
// "routes".
//
// Folder structure:
// app.js
// routes
//   code.js
//   template.js
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
//  https://expressjs.com/en/starter/static-files.html

const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.static(__dirname + '/static'));
app.use(express.urlencoded({
    extended: true
}));

// Map routes to all .js files in the /routes folder.
fs.readdirSync("./routes").map((filename) => {
    const module = require("./routes/" + filename);
    const route = filename.replace(".js", "")
    app.use("/" + route, module);
});

app.listen(3000, () => console.log('server started'));