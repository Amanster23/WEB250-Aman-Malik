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
const mongoose = require('mongoose');
const Pizza = require('./routes/lesson10')

const app = express();

// connect to MongoDB

const dbURL = 'mongodb+srv://amanster23:Monsterking23@pizza.wlpmpex.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect((dbURL))
.then((result) => app.listen(3000, () => console.log('server started')))
.catch((err) => console.log(err));

// mongoose and mongo sandbox routes

app.get('/add-pizza', (req, res) => {
  const pizza = new Pizza({
    size: 'small',
    topping: 'cheese',
    price: '5'
  });

  pizza.save()
  .then((result) => {
    res.send(result)
  })
  .catch((err) => {
    console.log(err);
  })
})

app.get('/all-pizzas', (req, res) => {
  Pizza.find()
  .then((result) => {
    res.send(result);
  })
  .catch((err) => {
    console.log(err);
  })
})

app.use(express.static(__dirname + '/static'));
app.use(express.urlencoded({
  extended: true
}));

app.use(fileUpload({
  limits: {
    fileSize: 1 * 1024 * 1024
  },
}));

const fs = require("fs");
fs.readdirSync('./routes').forEach((filename) => {
  try {
    const module = require(`./routes/${filename}`);
    const route = filename.replace('.js', '');
    app.use(`/${route}`, module);
  } catch (err) {
    console.error(`Error loading route module ${filename}:`, err);
  }
});

