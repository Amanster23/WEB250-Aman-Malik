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
        "password": "$2b$10$l20wKFNqyzWl9NgeexjQ9el9KY7HzbTAPefSyntaZE.jqJlHZI0Ba",
        "role": "manager"
    },
    {
        "userid": 2,
        "username": "test",
        "password": "$2b$10$T.7DuAdfGVzq8uP1.xYZLe8rbPrOE6/DtMqbT5.O/bYwTFMZDC6ru",
        "role": "employee"
    }
]

loginAttempts = []

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
            let user = getUserById(userid);
            request.session.userid = userid;
            request.session.role = user.role;
            recordLogin(request, user);
            let contact = null;
            if (request.cookies.contact) {
                contact = JSON.parse(request.cookies.contact);
                console.log('Returning customer contact info:', contact);
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
        contact: contact
    }
    result = template(data);
    return result
}

function authenticateUser(username, password) {
    for (let index = 0; index < users.length; index++) {
        let user = users[index];
        // console.log(`Checking user ${user.username}...`);
        if (user.username == username) {
            // console.log(`Found user ${username}...`);
            // console.log("Hashed Password:", user.password);
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

function getUserById(userid) {
    for (let index = 0; index < users.length; index++) {
        let user = users[index];
        if (user.userid == userid) {
            return user;
        }
    }
    return null;
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
    for (let index = 0; index < users.length; index++) {
        let user = users[index];
        if (user.userid == userid) {
            return user;
        }
    }
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

// const express = require("express");
// const bcrypt = require("bcrypt");
// const fs = require("fs");
// const handlebars = require('handlebars');
// const sqlite3 = require('sqlite3').verbose();

// const router = express.Router();

// const db = new sqlite3.Database('./users.db');

// db.serialize(() => {
//     db.run('CREATE TABLE IF NOT EXISTS users (userid INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL)');
// });

// router.get("/", function (request, response) {
//     let username = request.cookies.username;
//     let userid = request.session.userid;
//     let contact = request.cookies.contact;
//     let role = request.session.role;
//     result = build_form(username, userid, contact, role);
//     response.send(result);
// });

// router.post("/", function (request, response) {
//     if (request.body["reload"]) {
//         response.redirect(request.originalUrl);
//     } else if (request.body["log-out"]) {
//         recordLogout(request);
//         request.session.destroy();
//         let username = request.cookies.username;
//         let userid = null;
//         result = build_form(username, userid, null, null);
//         response.send(result);
//     } else if (request.body["forget-me"]) {
//         recordLogout(request);
//         request.session.destroy();
//         result = build_form(null, null, null, null);
//         response.cookie("username", "", {
//             expires: 0
//         });
//         response.cookie("contact", "", {
//             expires: 0
//         });
//         response.send(result);
//     } else {
//         let username = request.body.username;
//         let password = request.body.password;
//         authenticateUser(username, password, (userid, role) => {
//             if (userid) {
//                 let user = getUserById(userid);
//                 request.session.userid = userid;
//                 request.session.role = user.role;
//                 recordLogin(request, user);
//                 let contact = null;
//                 if (request.cookies.contact) {
//                     contact = JSON.parse(request.cookies.contact);
//                     console.log('Returning customer contact info:', contact);
//                 }
//                 result = build_form(username, userid, contact, user.role);
//                 response.cookie("username", username);
//                 if (request.body.contact) {
//                     let contactInfo = JSON.stringify(request.body.contact);
//                     response.cookie("contact", contactInfo);
//                 }
//                 response.send(result);
//             } else {
//                 recordFailedLogin(request, username);
//                 response.redirect(303, request.originalUrl);
//             }
//         });
//     }
// });

// function build_form(username, userid, contact, role) {
//     let cookie = !!username;
//     let session = !!userid;
//     let welcome;
//     let employeeContent = "";
//     let managerContent = "";

//     if (username && userid) {
//         welcome = "Welcome back " + username + "! You are logged in.";
//         if (role === "employee") {
//             employeeContent = "This is the employee content.";
//         } else if (role === "manager") {
//             managerContent = "This is the manager content.";
//         }
//     } else {
//         welcome = "Please log in.";
//     }

//     let source = fs.readFileSync("./templates/lesson11.html");
//     let template = handlebars.compile(source.toString());
//     let data = {
//         cookie: cookie,
//         session: session,
//         welcome: welcome,
//         employeeContent: employeeContent,
//         managerContent: managerContent,
//         username: username,
//         contact: contact
//     }
//     result = template(data);
//     return result
// }

// function authenticateUser(username, password, callback) {
//     let query = `SELECT userid, password, role FROM users WHERE username = ?`;
//     db.get(query, [username], (error, row) => {
//         if (error) {
//             console.log(error);
//             callback(null);
//         } else if (!row) {
//             console.log("No user found with username:", username);
//             callback(null);
//         } else {
//             bcrypt.compare(password, row.password, (error, result) => {
//                 if (error) {
//                     console.log(error);
//                     callback(null);
//                 } else if (!result) {
//                     console.log("Incorrect password for username:", username);
//                     callback(null);
//                 } else {
//                     callback(row.userid);
//                 }
//             });
//         }
//     });
// }

// function recordLogin(request, user) {
//     // Log successful login attempt
//     console.log(`User ${user.username} with ID ${user.userid} and role ${user.role} logged in at ${new Date()}`);
// }

// function recordLogout(request) {
//     // Log logout event
//     console.log(`User with ID ${request.session.userid} logged out at ${new Date()}`);
// }

// function recordFailedLogin(request, username) {
//     // Log failed login attempt
//     console.log(`Failed login attempt for username ${username} at ${new Date()}`);
// }

// function getUserById(userid) {
//     let query = `SELECT userid, username, role FROM users WHERE userid = ?`;
//     db.get(query, [userid], (error, row) => {
//         if (error) {
//             console.log(error);
//             return null;
//         } else if (!row) {
//             console.log("No user found with ID:", userid);
//             return null;
//         } else {
//             return {
//                 userid: row.userid,
//                 username: row.username,
//                 role: row.role
//             };
//         }
//     });
// }

// module.exports = router;



