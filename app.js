const express = require("express");
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));


app.get("/", (req, res) => {
    res.render("index");
});

app.get("/cards", async (req, res) => {
    let url = `https://api.tcgdex.net/v2/en/base1/image/`;

    let response = await fetch(url);
    let basePokemon = await response.json();

    // Check if basePokemon.cards is defined and is an array
    if (!basePokemon.cards || !Array.isArray(basePokemon.cards)) {
        console.error('Unexpected API response:', basePokemon);
        res.status(500).send('Error fetching data from API');
        return;
    }

    // Log the first card to the console
    console.log(basePokemon.cards[0]);

    // Pass all cards to the view
    res.render("cards", { cards: basePokemon.cards });
});

app.get("/login", (req, res) => {
    res.render("login");
});


app.listen(3000, (err) => {
    if (err) throw err;
    console.log("Server is running on port 3000");
});