const promises = links.map(async (link) => {
    const page = await browser.newPage();
    try {
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

        return quotes;
    } catch (error) {
        console.error(`Error scraping ${link.href}:`, error);
        return []; // Return empty array on error
    } finally {
        await page.close();
    }
});

const results = await Promise.allSettled(promises);
const allQuotes = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)
    .flat();

res.json(allQuotes);
