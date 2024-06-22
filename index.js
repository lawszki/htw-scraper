const express = require("express");
const app = express();
const { scrapeLogic } = require("./scrapeLogic");

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
    res.send("Render Puppeteer server is up and running");
});

app.get("/scraper", (req, res) => {
    scrapeLogic(req, res);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
