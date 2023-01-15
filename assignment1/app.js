// Displays 'Hello Aman!'
//
// References:
//   https://repl.it/languages/express
//   https://expressjs.com/en/starter/hello-world.html

const express = require('express');
const app = express();

app.get('/', (request, response) => {
    response.send('Hello Aman!');
});

app.listen(port=3000);
