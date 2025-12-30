const puppeteer = require('puppeteer');

(async () => {
    console.log('Starting UI tests...');
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport to mobile size to test mobile specific features
    await page.setViewport({ width: 375, height: 667 });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    try {
        console.log('Navigating to http://localhost:3000/chat/test-room...');
        await page.goto('http://localhost:3000/chat/test-room', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait for hydration
        await new Promise(r => setTimeout(r, 5000));

        const bodyText = await page.evaluate(() => document.body.innerText);
        console.log('Body text snapshot:', bodyText.substring(0, 200).replace(/\n/g, ' '));

        // Check for login dialog
        const loginInput = await page.$('input[placeholder="Ваше имя"]');
        if (loginInput) {
            console.log('Login dialog detected. Logging in...');
            await loginInput.type('Test User');
            
            const buttons = await page.$$('button');
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('Присоединиться') || text.includes('Join') || text.includes('Start')) {
                    await btn.click();
                    break;
                }
            }
            await new Promise(r => setTimeout(r, 5000));
        }

        console.log('Waiting for chat interface...');
        try {
            await page.waitForSelector('textarea', { timeout: 15000 });
        } catch (e) {
            console.log('Textarea not found. Checking for other states...');
            const html = await page.content();
            if (html.includes('Загрузка')) console.log('Stuck on Loading screen');
            else if (html.includes('Ошибка')) console.log('Error screen detected');
            else console.log('Unknown state');
            
            throw new Error('Chat interface did not load');
        }

        console.log('Checking for critical UI elements...');

        // 1. Check Input Font Size (P2 fix)
        const fontSize = await page.evaluate(() => {
            const textarea = document.querySelector('textarea');
            if (!textarea) return 'No textarea found';
            return window.getComputedStyle(textarea).fontSize;
        });
        console.log(`Input Font Size: ${fontSize} (Expected: 16px)`);

        // 2. Check Send Button Accessibility (P1 fix)
        const sendButtonLabel = await page.evaluate(() => {
            const btn = document.querySelector('button[aria-label*="сообщение"]');
            return btn ? btn.getAttribute('aria-label') : 'No send button found';
        });
        console.log(`Send Button Label: ${sendButtonLabel}`);

        // 3. Check Touch Targets (P1 fix)
        const touchTargetCheck = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const smallButtons = buttons.filter(b => {
                const rect = b.getBoundingClientRect();
                return rect.width < 44 || rect.height < 44;
            });
            return {
                total: buttons.length,
                small: smallButtons.length,
                smallClasses: smallButtons.map(b => b.className).slice(0, 3)
            };
        });
        console.log(`Touch Targets: ${touchTargetCheck.total} buttons, ${touchTargetCheck.small} too small.`);
        if (touchTargetCheck.small > 0) {
             console.log('Sample small buttons:', touchTargetCheck.smallClasses);
        }

        // 4. Check Max Width on Desktop (P2 fix)
        await page.setViewport({ width: 1440, height: 900 });
        const chatContainerWidth = await page.evaluate(() => {
            const container = document.querySelector('.max-w-\\[var\\(--max-chat-width\\)\\]');
            if (!container) return 'Container not found';
            return window.getComputedStyle(container).maxWidth;
        });
        console.log(`Desktop Chat Width Limit: ${chatContainerWidth}`);

    } catch (error) {
        console.error('Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();
