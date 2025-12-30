const puppeteer = require('puppeteer');

async function runTest()
 const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log('=== DEBUG TEST ===\n');

  const logs = [];
  page.on('console', msg => logs.push('[' + msg.type() + '] ' + msg.text()));
  page.on('pageerror', err => logs.push('[pageerror] ' + err.message));

  try {
    await page.goto('https://chatus-omega.vercel.app/chat/test-room', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    console.log('Page loaded, waiting 10s for React hydration...');
    await new Promise(r => setTimeout(r, 10000));

    const debug = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyHTML: document.body.innerHTML.substring(0, 500),
        bodyText: document.body.innerText.substring(0, 300),
        divCount: document.querySelectorAll('div').length,
        inputCount: document.querySelectorAll('input, textarea').length,
        buttonCount: document.querySelectorAll('button').length,
        hasReactRoot: !!document.getElementById('__next') || !!document.getElementById('root'),
        scripts: document.querySelectorAll('script').length
      };
    });

    console.log('URL:', debug.url);
    console.log('Title:', debug.title);
    console.log('Divs:', debug.divCount);
    console.log('Inputs:', debug.inputCount);
    console.log('Buttons:', debug.buttonCount);
    console.log('React root:', debug.hasReactRoot);
    console.log('Scripts:', debug.scripts);
    console.log('\nBody text:', debug.bodyText);
    console.log('\nBody HTML preview:', debug.bodyHTML);

    console.log('\n--- Console logs (' + logs.length + ') ---');
    logs.filter(l => l.includes('error') || l.includes('Error') || l.includes('warn')).slice(0, 10).forEach(l => console.log(l));

    await page.screenshot({ path: 'test-screenshots/debug.png', fullPage: true });
    console.log('\nScreenshot saved: test-screenshots/debug.png');

  } catch (err) {
    console.log('ERROR:', err.message);
  }

  await browser.close();
}

runTest();
