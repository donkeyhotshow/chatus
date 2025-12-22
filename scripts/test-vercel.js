const puppeteer = require('puppeteer');

async function runTest() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log('=== CHATUS VERCEL DEPLOYMENT TEST ===\n');

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text().substring(0, 200));
    }
  });
  page.on('pageerror', err => errors.push(err.message));

  try {
    console.log('1. Testing main page...');
    await page.goto('https://chatus-omega.vercel.app/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    console.log('   OK Main page loaded');

    console.log('2. Testing chat room...');
    await page.goto('https://chatus-omega.vercel.app/chat/test-room', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await new Promise(r => setTimeout(r, 5000));
    console.log('   OK Chat room loaded');

    console.log('3. Checking UI elements...');
    const ui = await page.evaluate(() => {
      return {
        title: document.title,
        hasInput: !!document.querySelector('textarea, input[type="text"]'),
        buttonCount: document.querySelectorAll('button').length,
        hasContent: document.body.innerText.length > 50
      };
    });
    console.log('   Title: ' + ui.title);
    console.log('   Has input: ' + (ui.hasInput ? 'YES' : 'NO'));
    console.log('   Buttons: ' + ui.buttonCount);
    console.log('   Has content: ' + (ui.hasContent ? 'YES' : 'NO'));

    console.log('4. Testing Health API...');
    await page.goto('https://chatus-omega.vercel.app/api/health', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    const healthResponse = await page.evaluate(() => document.body.innerText);
    const health = JSON.parse(healthResponse);
    console.log('   Status: ' + (health.status === 'ok' ? 'OK' : 'FAIL'));

    console.log('\n=== RESULTS ===');
    console.log('Console errors: ' + errors.length);
    if (errors.length > 0) {
      errors.slice(0, 5).forEach(e => console.log('  - ' + e));
    }

    const passed = ui.hasInput && ui.hasContent && health.status === 'ok';
    console.log('\nOverall: ' + (passed ? 'PASSED' : 'FAILED'));

  } catch (err) {
    console.log('ERROR: ' + err.message);
  }

  await browser.close();
}

runTest();
