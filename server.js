const express = require("express");
const app = express();
const mysql = require("mysql2");
const crypto = require('crypto');

app.use(express.json());

//creates connection between API and database (using MAMP & phpMyAdmin for database)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'tradecard',
    port: '8889'
});

//sends an error if database could not be connected
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to tradecard database at port 4000');
});

//middleware to parse request body
app.use(express.urlencoded({ extended: true }));

//post to create a new account storing details in database
app.post('/createaccount', (req, res) => {
    let username = req.body.username;
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let plainPassword = req.body.password;

    //salted hashing from Neil's database lecture for passwords
    const salt = crypto.randomBytes(3).toString('hex');
    const saltedHash = crypto.createHash('sha1').update(salt + plainPassword).digest('hex');
    const storedSaltedHash = salt + saltedHash;

    //SQL statement to insert account details into database
    let newaccount = `INSERT INTO user (userID, userName, firstName, lastName, email, password) VALUES (NULL, ?, ?, ?, ?, ?)`;

    //response to database query dependant on account being creating or an error in the database
    db.query(newaccount, [username, firstname, lastname, email, storedSaltedHash], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.status(201).json({ message: 'User created successfully' });
        }
    });
});

//checks the database for the username and password
app.post('/login', (req, res) => {

    let username = req.body.username;
    let password = req.body.password;

    //SQL to search database for username and password before logging users in
    let accountsearch = `SELECT * FROM user WHERE userName = ?`;

    db.query(accountsearch, [username], (err, results) => {
    
        if (err) {
            console.error('Database query error:', err);
            res.json({ error: 'Database error' });
        } else if (results.length > 0) {
            let user = results[0];

            //converts password from binary and extracts salt and hash
            let storedPassword = user.password.toString('binary');
            let salt = storedPassword.substr(0, 6);
            let storedHash = storedPassword.substr(6, 40);
            let providedHash = crypto.createHash('sha1').update(salt + password).digest('hex'); 

            //compares passwords to authenticate user before logging them in if details are correct
            if (providedHash === storedHash) {
                res.json({ success : true, message: 'You have been logged in' });
            } else {
                res.json({ success : false, message: 'Invalid password' });
            }
        } else {
            console.log('No user found with provided username.');
            res.json({ message: 'Invalid username or password' });
        }
    });
});

app.listen(4000, () => {
    console.log("Server is running on port 4000");
});