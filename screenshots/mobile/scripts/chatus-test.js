const puppeteer = require('puppeteer');
const fs = require('fs');

const CONFIG = {
  chatRoomUrl: 'https://chatus-omega.vercel.app/chat/2',
  viewports: {
    desktop: { width: 1920, height: 1080 },
    iphoneSE: { width: 375, height: 667 },
    iphone14: { width: 390, height: 844 },
    android: { width: 412, height: 915 }
  }
};

const results = { bugs: [], uxIssues: [], perf: {}, screenshots: [], errors: [] };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`);

async function runTest() {
  log('Starting ChatUs comprehensive test...');

  if (!fs.existsSync('test-screenshots')) fs.mkdirSync('test-screenshots');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: CONFIG.viewports.desktop
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') results.errors.push(msg.text());
  });

  try {
    // 1. Page Load Test
    log('Testing page load...');
    const start = Date.now();
    await page.goto(CONFIG.chatRoomUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    results.perf.loadTime = Date.now() - start;
    log(`Page loaded in ${results.perf.loadTime}ms`);
    await page.screenshot({ path: 'test-screenshots/01_loaded.png' });

    if (results.perf.loadTime > 5000) {
      results.bugs.push({ where: 'Load', what: 'Slow load', severity: 'Major' });
    }

    // 2. Profile Dialog
    log('Checking profile dialog...');
    await sleep(2000);
    const dialog = await page.$('[role="dialog"]');
    if (dialog) {
      log('Profile dialog found');
      await page.screenshot({ path: 'test-screenshots/02_profile_dialog.png' });
      const input = await page.$('input[type="text"]');
      if (input) {
        await input.type('TestUser_' + Date.now());
        const btn = await page.$('button[type="submit"]');
        if (btn) { await btn.click(); await sleep(1000); }
      }
    } else {
      log('No profile dialog - already logged in');
    }

    // 3. Chat Functionality
    log('Testing chat...');
    const msgInput = await page.$('textarea, input[placeholder*="сообщ"], input[placeholder*="message"]');
    if (msgInput) {
      await msgInput.click();
      await msgInput.type('Test message ' + Date.now());
      await page.keyboard.press('Enter');
      await sleep(1000);
      await page.screenshot({ path: 'test-screenshots/03_message_sent.png' });
      log('Message sent');

      // Long message test
      await msgInput.click();
      await msgInput.type('A'.repeat(500));
      await page.keyboard.press('Enter');
      await sleep(500);

      // Emoji test
      await msgInput.click();
      await msgInput.type('Emoji test: 😀🎉🔥💯');
      await page.keyboard.press('Enter');
      await sleep(500);
      await page.screenshot({ path: 'test-screenshots/04_emoji.png' });
    } else {
      results.bugs.push({ where: 'Chat', what: 'Message input not found', severity: 'Critical' });
    }

    // 4. Mobile Testing
    log('Testing mobile viewports...');
    for (const [name, vp] of Object.entries(CONFIG.viewports)) {
      if (name === 'desktop') continue;
      await page.setViewport(vp);
      await page.reload({ waitUntil: 'networkidle2' });
      await sleep(1000);
      await page.screenshot({ path: `test-screenshots/05_mobile_${name}.png` });

      // Check touch targets
      const buttons = await page.$$('button, a');
      let small = 0;
      for (const btn of buttons.slice(0, 15)) {
        const box = await btn.boundingBox();
        if (box && (box.width < 44 || box.height < 44)) small++;
      }
      if (small > 0) {
        results.uxIssues.push({ where: `Mobile ${name}`, issue: `${small} small touch targets`, severity: 'Major' });
      }

      // Check horizontal scroll
      const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      if (hScroll) {
        results.uxIssues.push({ where: `Mobile ${name}`, issue: 'Horizontal scroll', severity: 'Major' });
      }
      log(`Tested ${name} (${vp.width}x${vp.height})`);
    }

    // 5. Performance metrics
    log('Collecting performance metrics...');
    await page.setViewport(CONFIG.viewports.desktop);
    await page.goto(CONFIG.chatRoomUrl, { waitUntil: 'networkidle2' });

    const perfData = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      return {
        domContentLoaded: nav?.domContentLoadedEventEnd - nav?.startTime,
        fcp: fcp?.startTime
      };
    });
    results.perf = { ...results.perf, ...perfData };
    log(`FCP: ${perfData.fcp?.toFixed(0)}ms, DCL: ${perfData.domContentLoaded?.toFixed(0)}ms`);

    // 6. Offline test
    log('Testing offline mode...');
    await page.setOfflineMode(true);
    await sleep(1000);
    await page.screenshot({ path: 'test-screenshots/06_offline.png' });

    const offlineIndicator = await page.$('[class*="offline"], [class*="connection"], [class*="status"]');
    if (!offlineIndicator) {
      results.uxIssues.push({ where: 'Offline', issue: 'No offline indicator', severity: 'Major' });
    }

    await page.setOfflineMode(false);
    await sleep(2000);
    await page.screenshot({ path: 'test-screenshots/07_back_online.png' });

    // 7. Edge cases
    log('Testing edge cases...');
    const input2 = await page.$('textarea, input[type="text"]');
    if (input2) {
      // Rapid messages
      for (let i = 0; i < 5; i++) {
        await input2.type(`Rapid ${i}`);
        await page.keyboard.press('Enter');
        await sleep(50);
      }
      await sleep(1000);

      // XSS attempt
      await input2.type('<script>alert(1)</script>');
      await page.keyboard.press('Enter');
      await sleep(500);

      // Unicode
      await input2.type('Unicode: 你好 مرحبا');
      await page.keyboard.press('Enter');
      await sleep(500);
      await page.screenshot({ path: 'test-screenshots/08_edge_cases.png' });
    }

  } catch (err) {
    log(`Error: ${err.message}`);
    results.bugs.push({ where: 'Test', what: err.message, severity: 'Critical' });
  }

  // Generate report
  const report = {
    date: new Date().toISOString(),
    url: CONFIG.chatRoomUrl,
    summary: {
      bugs: results.bugs.length,
      critical: results.bugs.filter(b => b.severity === 'Critical').length,
      major: results.bugs.filter(b => b.severity === 'Major').length,
      uxIssues: results.uxIssues.length,
      consoleErrors: results.errors.length
    },
    performance: results.perf,
    bugs: results.bugs,
    uxIssues: results.uxIssues,
    consoleErrors: results.errors.slice(0, 10)
  };

  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log('TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`Bugs: ${report.summary.bugs} (Critical: ${report.summary.critical}, Major: ${report.summary.major})`);
  console.log(`UX Issues: ${report.summary.uxIssues}`);
  console.log(`Console Errors: ${report.summary.consoleErrors}`);
  console.log(`Load Time: ${results.perf.loadTime}ms`);
  console.log(`FCP: ${results.perf.fcp?.toFixed(0)}ms`);

  if (results.bugs.length > 0) {
    console.log('\nBUGS:');
    results.bugs.forEach((b, i) => console.log(`  ${i+1}. [${b.severity}] ${b.where}: ${b.what}`));
  }

  if (results.uxIssues.length > 0) {
    console.log('\nUX ISSUES:');
    results.uxIssues.forEach((u, i) => console.log(`  ${i+1}. [${u.severity}] ${u.where}: ${u.issue}`));
  }

  console.log('\nReport saved to test-report.json');
  console.log('Screenshots saved to test-screenshots/');

  await browser.close();
}

runTest().catch(console.error);
