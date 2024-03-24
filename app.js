//sets up all requirements for app.js file
const express = require("express");
let app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mysql = require("mysql2");
const crypto = require('crypto');
const axios = require('axios');

//middleware to use express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

//renders the ejs files
app.set('view engine', 'ejs');

//sets up sessions for users
const halfDay = 1000 * 60 * 60 * 12;
app.use(session({
    secret: 'secretsessionkey123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: halfDay, secure : false },
}));

//login page determined by login status
app.get('/login', (req, res) => {
    res.render("login", { loggedIn: req.session && req.session.loggedIn });
});

//post to check login details and redirect to home page if logged in or to the login page if details not found
app.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    //previous issues with users logging in without a username or password which should be fixed now
    if (!username || !password) {
        console.log('Username or password not provided.');
        res.redirect('/login');
        return;
    }

    try {
        const response = await axios.post('http://localhost:4000/login', {
            username: username,
            password: password,
        });

        console.log('Received response:', response.status, response.data);


        if (response.data.success) {
            console.log(response.data);
            req.session.loggedIn = true;
            req.session.user = response.data.user;
            console.log(req.session);
            res.redirect('/');
        } else {
            req.session.loggedIn = false;
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Axios request failed:', error);
    }
});

//gets the home page and determines the header based on login status
app.get("/", (req, res) => {
    if (req.session.loggedIn) {
        // If the user is logged in header for logged in user shows
        res.render('index', { header: 'headerloggedin' });
    } else {
        // If the user is not logged in normal header shows
        res.render('index', { header: 'header' });
    }
});

//gets create account page and determines the header based on login status
app.get('/createaccount', (req, res) => {
    if (req.session.loggedIn) {
        // If the user is logged in header for logged in user shows
        res.render('createaccount', { header: 'headerloggedin' });
    } else {
        // If the user is not logged in normal header shows
        res.render('createaccount', { header: 'header' });
    }
});

//middleware for parsing body of request
app.use(express.urlencoded({ extended: true }));

//post to create account through API in server.js file
app.post('/createaccount', async (req, res) => {

    let username = req.body.username;
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let plainPassword = req.body.password;

    const response = await axios.post('http://localhost:4000/createaccount', {
        username: username,
        firstname: firstname,
        lastname: lastname,
        email: email,
        password: plainPassword
    }).catch(error => {
        console.error(error);
        return res.redirect('/createaccount');
    });

    if (response && response.status === 201) {
        req.session.newAccount = true;
        req.session.username = username;
        res.redirect('/accountcreated');
    } else {
        res.redirect('/index');
    }

});

//gets account created page and determines the header based on login status
app.get('/accountcreated', (req, res) => {
    if (req.session.newAccount) {
        res.render('accountcreated', { header: 'headerloggedin', username: req.session.username });
    } else {
        res.render('accountcreated', { header: 'header' });
    }
});

//gets the logout page and logs the user out
app.get('/logout', (req, res) => {
    if (req.session.loggedIn) {
        req.session.destroy();
        res.redirect('/');
    } else {
        res.redirect('/');
    }
});

//gets information from database to make user profile page
app.get('/userprofile', async (req, res) => {
    if (req.session && req.session.user) {
        const userId = req.session.user.userID; // assuming the user's id is stored in the session
        try {
            const response = await axios.get(`http://localhost:4000/userprofile/${userId}`);
            console.log('Server response:', response.data);
            res.render('userprofile', { user: response.data });
        } catch (error) {
            console.error('Axios request failed:', error);
            res.status(500).json({ message: 'Failed to update user details' });
        }
    } else {
        res.redirect('/login');
    }
});

//gets update details page for ONLY users that are logged in
app.get('/updatedetails', (req, res) => {
    if (req.session.loggedIn) {
        let user = {userID: req.session.user.userID};
        res.render('updatedetails', { header: 'headerloggedin', user });
    } else {
        res.render('/login');
    }
});

//post to update user details through API in server.js file
app.post('/updatedetails/:userId', async (req, res) => {
    let userId = req.params.userId;
    let { userName, firstName, lastName, email } = req.body;

    console.log('Received request to update user details:', req.body);

    const userDetails = { userName, firstName, lastName, email };

    try {
        const response = await axios.post(`http://localhost:4000/updatedetails/${userId}`, userDetails);
        if (response.data.message === 'User details updated successfully') {
            res.redirect('/userprofile');
        } else {
            res.json({ message: 'Failed to update user details' });
        }
    } catch (error) {
        res.json({ message: 'Failed to update user details' });
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
    console.log("Tradecard is running on port 3000");
});