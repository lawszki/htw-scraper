const puppeteer = require('puppeteer');
require("dotenv").config();

const scrapeLogic = async (req, res) => {
    function cleanText(text) {
        return text.replace(/\s*[(*].*/, '').trim();
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            args: [
                "--disable-setuid-sandbox",
                "--no-sandbox",
                "--single-process",
                "--no-zygote"
            ],
            executablePath: process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : puppeteer.executablePath(),
            protocolTimeout: 1200000 // Setzen Sie das globale Timeout auf 120 Sekunden
        });

        const page = await browser.newPage();

        await page.goto('https://sport.htw-berlin.de/angebote/aktueller_zeitraum/index.html');

        const links = await page.evaluate(() => {
            const ddElements = document.querySelectorAll('dd');
            const linkList = [];
            ddElements.forEach((element) => {
                const link = element.querySelector('a');
                if (link && link.innerText !== 'RESTPLÄTZE - alle freien Kursplätze dieses Zeitraums') {
                    linkList.push({
                        href: link.getAttribute('href'),
                        text: link.innerText
                    });
                }
            });
            return linkList;
        });

        const allQuotes = [];

        for (const link of links) {
            await page.goto(`https://sport.htw-berlin.de/angebote/aktueller_zeitraum/${link.href}`, { waitUntil: 'networkidle2', timeout: 60000 });

            const quotes = await page.evaluate((text) => {
                const quoteElements = document.querySelectorAll('.bs_even, .bs_odd');
                const quoteArray = [];
                for (const quoteElement of quoteElements) {
                    const quoteTag = quoteElement.querySelector(".bs_stag").innerText;
                    const quoteOrt = quoteElement.querySelector(".bs_sort").innerText;
                    const quoteZeit = quoteElement.querySelector(".bs_szeit").innerText;
                    const quoteZeitraum = quoteElement.querySelector(".bs_szr").innerText;
                    const quoteLeitung = quoteElement.querySelector(".bs_skl").innerText;
                    quoteArray.push({
                        titel: text,
                        tag: quoteTag,
                        ort: quoteOrt,
                        zeit: quoteZeit,
                        zeitraum: quoteZeitraum,
                        leitung: quoteLeitung,
                    });
                }
                return quoteArray;
            }, cleanText(link.text));

            allQuotes.push(...quotes);
        }

        res.json(allQuotes);
    } catch (err) {
        console.error(err);
        res.send("Da stimmt was nicht mit dem scraper!");
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = { scrapeLogic };