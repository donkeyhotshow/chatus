const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    try {
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 60000 });

        const isErrorPage = await page.evaluate(() => {
            return document.body.innerText.includes('Что-то пошло не так');
        });

        if (isErrorPage) {
            console.log('Error page detected. Expanding details...');
            await page.click('summary');
            const details = await page.evaluate(() => {
                return document.querySelector('pre')?.innerText;
            });
            console.log('ERROR DETAILS:', details);
        } else {
            console.log('No error page detected.');
        }
    } catch (error) {
        console.error('Navigation failed:', error.message);
    } finally {
        await browser.close();
    }
})();
