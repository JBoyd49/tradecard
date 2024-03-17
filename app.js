const express = require("express");
let app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mysql = require("mysql2");
const crypto = require('crypto');
const axios = require('axios');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

const halfDay = 1000 * 60 * 60 * 12;

app.use(session({
    secret: 'secretsessionkey123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: halfDay },
}));

function authenticateUser(username, password) {
    // Replace this with your actual user authentication logic
    return true;
}

app.get("/login", (req, res) => {
    res.render("login", { loggedIn: req.session && req.session.loggedIn });
});

app.use(express.urlencoded({ extended: true }));

app.post('/login', (req, res) => {
    const username = req.body.usernameField;
    const password = req.body.passwordField;

    // replace this with your actual user authentication logic
    const user = authenticateUser(username, password);

    if (user) {
        req.session.loggedIn = true;
        res.redirect('/');
    } else {
        res.redirect('/loginfailed');
    }
});

app.get("/", (req, res) => {
    if (req.session.loggedIn) {
        // If the user is logged in header for logged in user shows
        res.render('index', { header: 'headerloggedin' });
    } else {
        // If the user is not logged in normal header shows
        res.render('index', { header: 'header' });
    }
});

app.get('/createaccount', (req, res) => {
    if (req.session.loggedIn) {
        // If the user is logged in header for logged in user shows
        res.render('createaccount', { header: 'headerloggedin' });
    } else {
        // If the user is not logged in normal header shows
        res.render('createaccount', { header: 'header' });
    }
});

app.use(express.urlencoded({ extended: true }));

app.post('/createaccount', async (req, res) => {

    let username = req.body.username;
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let plainPassword = req.body.password;

    //To be used to hash the password for very basic security - taken from Neil's Database module
    const salt = crypto.randomBytes(3).toString('hex');
    const saltedHash = crypto.createHash('sha1').update(salt + plainPassword).digest('hex');
    const storedSaltedHash = salt + saltedHash;

    const response = await axios.post('http://localhost:4000/createaccount/new', {
        username: username,
        firstname: firstname,
        lastname: lastname,
        email: email,
        password: storedSaltedHash,
    });

    if (response.status === 201) {
        req.session.newAccount = true;
        res.redirect('/accountcreated');
    } else {
        res.redirect('/accountnotcreated');
    }

});

app.get('/accountcreated', (req, res) => {
    if (req.session.newAccount) {
        res.render('accountcreated', { header: 'headerloggedin' });
    } else {
        res.render('accountcreated', { header: 'header' });
    }
});

app.get("/cards", async (req, res, next) => {

    // Check if the user is logged in and displays the correct header
    if (req.session.loggedIn) {
        res.render('cards', { header: 'headerloggedin' });
    } else {
        res.render('cards', { header: 'header' });
    }

    try {
        const url = "https://api.tcgdex.net/v2/en/base/base1";

        const response = await fetch(url);
        const basePokemon = await response.json();

        // Check if basePokemon.cards is defined and is an array
        if (!basePokemon.cards || !Array.isArray(basePokemon.cards)) {
            console.error('Unexpected API response:', basePokemon);
            res.status(500).send("Error fetching data from API");
            return;
        }

        // Log the first card to the console
        console.log(basePokemon.cards[0]);

        // Pass all cards to the view
        res.render("cards", { cards: basePokemon.cards })
    } catch (error) {
        next(error) // This will now work correctly
    }
});

app.listen(3000, (err) => {
    if (err) throw err;
    console.log("Server is running on port 3000");
});