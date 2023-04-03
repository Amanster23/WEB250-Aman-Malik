// Demonstrates session and cookie processing. The username is stored
// as a cookie and an internal userid is saved in a session variable.
// Also demonstrates secure password authentication using bcrypt salt
// and hash.
//
// References:
//  https://en.wikibooks.org/wiki/JavaScript
//  https://www.geeksforgeeks.org/http-cookies-in-node-js/
//  https://www.geeksforgeeks.org/session-cookies-in-nodejs/
//  https://www.npmjs.com/package/bcrypt

const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");
const handlebars = require('handlebars');
const router = express.Router();

users = [
    // Password is the same as the username, just salted and hashed.
    // Don't do this in a production application! Use custom passwords.
    {
        "userid": 1,
        "username": "admin",
        "password": "$2b$10$l20wKFNqyzWl9NgeexjQ9el9KY7HzbTAPefSyntaZE.jqJlHZI0Ba"
    },
    {
        "userid": 2,
        "username": "test",
        "password": "$2b$10$T.7DuAdfGVzq8uP1.xYZLe8rbPrOE6/DtMqbT5.O/bYwTFMZDC6ru"
    }
]

router.get("/", function (request, response) {
    let username = request.cookies.username;
    let userid = request.session.userid;
    let contact = request.cookies.contact;
    result = build_form(username, userid, contact);
    response.send(result);
});

router.post("/", function (request, response) {
    if (request.body["reload"]) {
        response.redirect(request.originalUrl);
    } else if (request.body["log-out"]) {
        request.session.destroy();
        let username = request.cookies.username;
        let userid = null;
        result = build_form(username, userid, null);
        response.send(result);
    } else if (request.body["forget-me"]) {
        request.session.destroy();
        result = build_form(null, null, null);
        response.cookie("username", "", {
            expires: 0
        });
        response.cookie("contact", "", {
            expires: 0
        });
        response.send(result);
    } else {
        let username = request.body.username;
        let password = request.body.password;
        let userid = authenticateUser(username, password);
        if (userid) {
            request.session.userid = userid;
            let contact = null;
            if (request.cookies.contact) {
                contact = JSON.parse(request.cookies.contact);
            }
            result = build_form(username, userid, contact);
            response.cookie("username", username);
            if (request.body.contact) {
                let contactInfo = JSON.stringify(request.body.contact);
                response.cookie("contact", contactInfo);
            }
            response.send(result);
        } else {
            response.redirect(303, request.originalUrl);
        }
    }
});

function build_form(username, userid, contact) {
    let cookie = !!username;
    let session = !!userid;
    if (username && userid) {
        welcome = "Welcome back " + username + "! You are logged in.";
    } else if (username) {
        welcome = "Welcome back " + username + "! Please log in.";
    } else {
        welcome = "Welcome! Please log in.";
    }

    let source = fs.readFileSync("./templates/lesson11.html");
    let template = handlebars.compile(source.toString());
    let data = {
        cookie: cookie,
        session: session,
        welcome: welcome,
        username: username,
        contact: contact
    }
    result = template(data);
    return result
}

function authenticateUser(username, password) {
    for (let index = 0; index < users.length; index++) {
        let user = users[index];
        console.log(`Checking user ${user.username}...`);
        if (user.username == username) {
            console.log(`Found user ${username}...`);
            console.log("Hashed Password:", user.password);
            if (bcrypt.compareSync(password, user.password)) {
                console.log(`User ${username} authenticated successfully!`);
                // Should track successful logins
                return user.userid;
            } else {
                console.log(`User ${username} authentication failed!`);
                // Should track failed attempts, lock account, etc.
                return null;
            }
        }
    }
    console.log(`User ${username} not found!`);
    return null;
}

function generateHashedPassword(password) {
    // Use this function to generate hashed passwords to save in 
    // the users list or a database.
    let salt = bcrypt.genSaltSync();
    let hashed = bcrypt.hashSync(password, salt);
    return hashed
}

module.exports = router;

