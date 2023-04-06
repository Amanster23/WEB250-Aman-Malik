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
const handlebars = require("handlebars");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();

// Open a database connection
const db = new sqlite3.Database("user.db");

// Create the users table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    userid INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )
`);

router.get("/", function (request, response) {
    let username = request.cookies.username;
    let userid = request.session.userid;
    let contact = request.cookies.contact;
    let role = request.session.role;
    result = build_form(username, userid, contact, role);
    response.send(result);
});

router.post("/", function (request, response) {
    if (request.body["reload"]) {
        response.redirect(request.originalUrl);
    } else if (request.body["log-out"]) {
        recordLogout(request);
        request.session.destroy();
        let username = request.cookies.username;
        let userid = null;
        result = build_form(username, userid, null, null);
        response.send(result);
    } else if (request.body["forget-me"]) {
        recordLogout(request);
        request.session.destroy();
        result = build_form(null, null, null, null);
        response.cookie("username", "", {
            expires: 0,
        });
        response.cookie("contact", "", {
            expires: 0,
        });
        response.send(result);
    } else {
        let username = request.body.username;
        let password = request.body.password;
        let userid = authenticateUser(username, password);
        if (userid) {
            let user = getUserById(userid);
            request.session.userid = userid;
            request.session.role = user.role;
            recordLogin(request, user);
            let contact = null;
            if (request.cookies.contact) {
                contact = JSON.parse(request.cookies.contact);
                console.log("Returning customer contact info:", contact);
            }
            result = build_form(username, userid, contact, user.role);
            response.cookie("username", username);
            if (request.body.contact) {
                let contactInfo = JSON.stringify(request.body.contact);
                response.cookie("contact", contactInfo);
            }
            response.send(result);
        } else {
            recordFailedLogin(request, username);
            response.redirect(303, request.originalUrl);
        }
    }
});

function build_form(username, userid, contact, role) {
    let cookie = !!username;
    let session = !!userid;
    let welcome;
    let employeeContent = "";
    let managerContent = "";

    if (username && userid) {
        welcome = "Welcome back " + username + "! You are logged in.";
        if (role === "employee") {
            employeeContent = "This is the employee content.";
        } else if (role === "manager") {
            managerContent = "This is the manager content.";
        }
    } else {
        welcome = "Please log in.";
    }    

    let source = fs.readFileSync("./templates/lesson11.html");
    let template = handlebars.compile(source.toString());
    let data = {
        cookie: cookie,
        session: session,
        welcome: welcome,
        employeeContent: employeeContent,
        managerContent: managerContent,
        username: username,
        contact: contact,
    };
    result = template(data);
    return result;
}

function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT userid, password FROM users WHERE username = ?",
            [username],
            function (err, row) {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else if (!row) {
                    console.log(`Username ${username} not found`);
                    resolve(false);
                } else {
                    const hash = row.password;
                    bcrypt.compare(password, hash, function (err, result) {
                        if (result) {
                            console.log(`User ${username} authenticated`);
                            resolve(row.userid);
                        } else {
                            console.log(`Incorrect password for user ${username}`);
                            resolve(false);
                        }
                    });
                }
            }
        );
    });
}


function recordLogin(request, user) {
    let loginEvent = {
        "username": user.username,
        "timestamp": new Date(),
    };
    console.log("User " + user.username + " logged in at " + loginEvent.timestamp);
}

function recordFailedLogin(request, username) {
    let loginEvent = {
        "username": username,
        "timestamp": new Date(),
    };
    console.log("User " + username + " failed to log in at " + loginEvent.timestamp);
}

function recordLogout(request) {
    let username = request.cookies.username;
    let logoutEvent = {
        "username": username,
        "timestamp": new Date(),
    };
    console.log("User " + username + " logged out at " + logoutEvent.timestamp);
}

function getUserById(userid) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE userid = ?",
        [userid],
        function (err, row) {
          if (err) {
            console.error(err.message);
            reject(err);
          } else if (!row) {
            console.log(`User with id ${userid} not found`);
            resolve(false);
          } else {
            const user = {
              userid: row.userid,
              username: row.username,
              role: row.role,
            };
            console.log(`User ${user.username} retrieved from database`);
            resolve(user);
          }
        }
      );
    });
  }
  
function generateHashedPassword(password) {
    // Use this function to generate hashed passwords to save in 
    // the users list or a database.
    let salt = bcrypt.genSaltSync();
    let hashed = bcrypt.hashSync(password, salt);
    return hashed
}

module.exports = router;