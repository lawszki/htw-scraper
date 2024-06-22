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
        });

        const page = await browser.newPage();
        await page.goto('https://sport.htw-berlin.de/angebote/aktueller_zeitraum/index.html', { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('dd');

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

        // Close the initial page as we don't need it anymore
        await page.close();

        // Parallel scraping of each link
        const promises = links.map(async (link) => {
            const page = await browser.newPage();
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
                        titel: text, // Fügt den Text, Titel der Sportart aus der oberen Abfrage hinzu
                        tag: quoteTag,
                        ort: quoteOrt,
                        zeit: quoteZeit,
                        zeitraum: quoteZeitraum,
                        leitung: quoteLeitung,
                    });
                }
                return quoteArray;
            }, cleanText(link.text));

            await page.close();
            return quotes;
        });

        // Wait for all promises to resolve
        const allQuotes = await Promise.all(promises);

        // Flatten the array of arrays into a single array of quotes
        const flattenedQuotes = allQuotes.flat();

        // Return results as JSON
        res.json(flattenedQuotes);
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong with the scraper!");
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = { scrapeLogic };
