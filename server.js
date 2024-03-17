const express = require("express");
const app = express();
const mysql = require("mysql2");
const crypto = require('crypto');

app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'tradecard', 
    port: '8889'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to tradecard database at port 4000');
});

app.use(express.urlencoded({extended: true}));

app.post('/createaccount/new', (req, res) => {
    let username = req.body.username;
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let plainPassword = req.body.password;

    //salted hashing from Neil's database lecture for passwords
    const salt = crypto.randomBytes(3).toString('hex');
    const saltedHash = crypto.createHash('sha1').update(salt + plainPassword).digest('hex');
    const storedSaltedHash = salt + saltedHash;

    let newaccount = `INSERT INTO user (userID, userName, firstName, lastName, email, password) VALUES (NULL, '${username}', '${firstname}', '${lastname}', '${email}', '${storedSaltedHash}')`;

    db.query(newaccount, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.status(201).json({ message: 'User created successfully' });
        }
    });
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    let accountsearch = `SELECT * FROM user WHERE userName = '?'`;

    db.query(accountsearch, [username], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        } else if (results.length > 0) {
            const user = results[0];
            const salt = user.password.slice(0, 6);
            const saltedHash = crypto.createHash('sha1').update(salt + password).digest('hex');

            if (user.password === salt + saltedHash) {
                res.status(200).json({ message: 'Login successful' });
            } else {
                res.status(401).json({ message: 'Invalid username or password' });
            }
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    });
});

app.listen(4000, () => {
    console.log("Server is running on port 4000");
});