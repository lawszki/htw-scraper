jest.setTimeout(30000);

const puppeteer = require('puppeteer');

describe('scrapeLogic function', () => {
    it('should clean text properly', () => {
        const text = 'This is a test (with extra info)';
        const cleanText = text.replace(/\s*[(*].*/, '').trim();
        expect(cleanText).toBe('This is a test');
    });

    it('should launch the browser', async () => {
        const browser = await puppeteer.launch({
            args: [
                "--disable-setuid-sandbox",
                "--no-sandbox",
                "--single-process",
                "--no-zygote"
            ],
            executablePath: puppeteer.executablePath(),
            protocolTimeout: 1200000
        });

        const page = await browser.newPage();
        await page.goto('https://sport.htw-berlin.de/angebote/aktueller_zeitraum/index.html');

        const title = await page.title();
        expect(title).toBe('Sportangebot');

        await browser.close();
    });

    it('should scrape the correct number of links', async () => {
        const browser = await puppeteer.launch({
            args: [
                "--disable-setuid-sandbox",
                "--no-sandbox",
                "--single-process",
                "--no-zygote"
            ],
            executablePath: puppeteer.executablePath(),
            protocolTimeout: 1200000
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

        expect(Array.isArray(links)).toBe(true);
        expect(links.length).toBeGreaterThan(0);

        await browser.close();
    });
});
