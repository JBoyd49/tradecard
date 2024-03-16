const express = require("express");
const app = express();
const mysql = require("mysql2");
const crypto = require('crypto');
const axios = require('axios');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.render("index");
});

app.get('/createaccount', (req, res) => {
    res.render('createaccount');
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

    if(response.status === 201) {
        res.render('/accountcreated');
    } else {
        res.render('/accountnotcreated');
    }
});

app.get("/cards", async (req, res, next) => { // Add 'next' here
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

app.get("/login", (req, res) => {
    res.render("login");
});

app.use(express.urlencoded({ extended: true }));

app.post('/login', (req, res) => {
    const username = req.body.usernameField;

    if (username === '123') {
        res.send('<code>logged in</code>');
    } else {
        res.send('<code>accessed denied</code>');
    }
});

app.listen(3000, (err) => {
    if (err) throw err;
    console.log("Server is running on port 3000");
});