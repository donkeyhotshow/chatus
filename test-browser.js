const puppeteer = require('puppeteer')

async function test() {
  console.log('Starting browser test...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });

  const page = await browser.newPage();
  let errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    console.log('Test 1: Loading page...');
    const t1 = Date.now();
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('PASS: Loaded in ' + (Date.now() - t1) + 'ms');
    await page.screenshot({ path: 'screenshot-1-home.png' });

    console.log('Test 2: Checking UI...');
    const form = await page.$('form');
    console.log(form ? 'PASS: Form found' : 'FAIL: Form not found');

    console.log('Test 3: Entering data...');
    const inputs = await page.$$('input');
    await inputs[0].type('TestUser');

    const btns = await page.$$('button');
    for (const btn of btns) {
      const txt = await btn.evaluate(el => el.textContent);
      if (txt && txt.includes('Создать')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    console.log('PASS: Data entered');
    await page.screenshot({ path: 'screenshot-2-filled.png' });

    console.log('Test 4: Joining room...');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 5000));

    const url = page.url();
    console.log(url.includes('/chat/') ? 'PASS: In chat room' : 'PARTIAL: URL=' + url);
    await page.screenshot({ path: 'screenshot-3-chat.png' });

    const metrics = await page.metrics();
    console.log('Memory: ' + (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2) + ' MB');

  } catch (e) {
    console.log('ERROR: ' + e.message);
  }

  console.log('Console errors: ' + errors.length);
  console.log('Closing in 10s...');
  await new Promise(r => setTimeout(r, 10000));
  await browser.close();
  console.log('Done!');
}

test().catch(console.error);
