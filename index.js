const express = require("express");
const cors = require("cors");
const app = express();
const { scrapeLogic } = require("./scrapeLogic");

const PORT = process.env.PORT || 4000;

// Enable CORS for all routes
app.use(cors());

app.get("/", (req, res) => {
    res.send("Render Puppeteer server is up and running");
});

app.get("/scraper", (req, res) => {
    scrapeLogic(req, res);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});