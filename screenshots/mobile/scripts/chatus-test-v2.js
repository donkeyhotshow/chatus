const puppeteer = require('puppeteer');
const fs = require('fs');

const CONFIG = {
  chatRoomUrl: 'https://chatus-omega.vercel.app/chat/2',
  viewports: {
    desktop: { width: 1920, height: 1080 },
    iphoneSE: { width: 375, height: 667 },
    iphone14: { width: 390, height: 844 },
    android: { width: 412, height: 915 },
    tablet: { width: 768, height: 1024 }
  }
};

const results = { bugs: [], uxIssues: [], perf: {}, screenshots: [], errors: [] };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (msg) => console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`);

async function runTest() {
  log('Starting ChatUs comprehensive test v2...');

  if (!fs.existsSync('test-screenshots')) fs.mkdirSync('test-screenshots');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: CONFIG.viewports.desktop
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') results.errors.push(msg.text());
  });

  try {
    // 1. Page Load Test
    log('TEST: Page Load');
    const start = Date.now();
    await page.goto(CONFIG.chatRoomUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    results.perf.loadTime = Date.now() - start;
    log(`Page loaded in ${results.perf.loadTime}ms`);
    await page.screenshot({ path: 'test-screenshots/01_loaded.png', fullPage: true });

    if (results.perf.loadTime > 5000) {
      results.bugs.push({ where: 'Page Load', what: `Slow load: ${results.perf.loadTime}ms`, severity: 'Major' });
    }

    // 2. Wait for app to initialize and check for profile dialog
    log('TEST: Profile Dialog');
    await sleep(3000);
    await page.screenshot({ path: 'test-screenshots/02_after_init.png', fullPage: true });

    // Check if profile dialog is shown
    const profileDialog = await page.$('[role="dialog"]');
    if (profileDialog) {
      log('Profile dialog found - creating profile');
      await page.screenshot({ path: 'test-screenshots/03_profile_dialog.png', fullPage: true });

      // Find and fill name input
      const nameInput = await page.$('input[type="text"], input[name="username"]');
      if (nameInput) {
        await nameInput.click();
        await nameInput.type('TestUser_' + Date.now());
        log('Name entered');
      }

      // Click submit button
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await sleep(4000);
        log('Profile submitted');
      }
      await page.screenshot({ path: 'test-screenshots/04_after_profile.png', fullPage: true });
    } else {
      log('No profile dialog - user already exists');
    }

    // Wait for chat interface to load
    await sleep(3000);

    // 3. Chat Functionality - using correct selectors
    log('TEST: Chat Functionality');

    // Look for textarea - try multiple times
    let msgInput = await page.$('textarea');
    if (!msgInput) {
      log('Textarea not found, waiting...');
      await sleep(3000);
      msgInput = await page.$('textarea');
    }
    if (!msgInput) {
      log('Still not found, taking screenshot for debug');
      await page.screenshot({ path: 'test-screenshots/debug_no_textarea.png', fullPage: true });
    }

    if (msgInput) {
      log('Message input found');

      // Test: Send normal message
      await msgInput.click();
      await sleep(300);
      await msgInput.type('Test message from automated test ' + Date.now());
      await page.screenshot({ path: 'test-screenshots/05_message_typed.png', fullPage: true });

      // Find send button (button with Send icon)
      const sendBtn = await page.$('button:has(svg)');
      if (sendBtn) {
        await sendBtn.click();
        await sleep(1000);
        log('Message sent via button');
      } else {
        await page.keyboard.press('Enter');
        await sleep(1000);
        log('Message sent via Enter');
      }
      await page.screenshot({ path: 'test-screenshots/06_message_sent.png', fullPage: true });

      // Test: Long message (1000+ chars)
      log('Testing long message...');
      await msgInput.click();
      const longMsg = 'A'.repeat(1000) + '_' + Date.now();
      await msgInput.type(longMsg);
      await page.keyboard.press('Enter');
      await sleep(1000);
      await page.screenshot({ path: 'test-screenshots/07_long_message.png', fullPage: true });

      // Test: Emoji
      log('Testing emoji...');
      await msgInput.click();
      await msgInput.type('Emoji test: 😀🎉🔥💯👍🏻❤️');
      await page.keyboard.press('Enter');
      await sleep(500);
      await page.screenshot({ path: 'test-screenshots/08_emoji.png', fullPage: true });

      // Test: Multiple rapid messages
      log('Testing rapid messages...');
      for (let i = 0; i < 5; i++) {
        await msgInput.click();
        await msgInput.type(`Rapid message ${i+1}`);
        await page.keyboard.press('Enter');
        await sleep(100);
      }
      await sleep(1000);
      await page.screenshot({ path: 'test-screenshots/09_rapid_messages.png', fullPage: true });

    } else {
      results.bugs.push({ where: 'Chat', what: 'Message textarea not found', severity: 'Critical' });
      log('ERROR: Message input not found!');
    }

    // 4. Test Sticker Picker
    log('TEST: Sticker Picker');
    const stickerBtn = await page.$('button:has(svg.lucide-smile), button[aria-label*="sticker"]');
    if (stickerBtn) {
      await stickerBtn.click();
      await sleep(500);
      await page.screenshot({ path: 'test-screenshots/10_sticker_picker.png', fullPage: true });
      log('Sticker picker opened');

      // Try to select a sticker
      const sticker = await page.$('[class*="sticker"]');
      if (sticker) {
        await sticker.click();
        await sleep(500);
        log('Sticker selected');
      }
      // Close picker by clicking outside
      await page.keyboard.press('Escape');
      await sleep(300);
    } else {
      log('Sticker button not found');
    }

    // 5. Test Image Upload Button
    log('TEST: Image Upload');
    const imageBtn = await page.$('button:has(svg.lucide-image)');
    if (imageBtn) {
      log('Image upload button found');
    } else {
      results.uxIssues.push({ where: 'Chat', issue: 'Image upload button not visible', severity: 'Minor' });
    }

    // 6. Test Navigation/Tabs (Desktop)
    log('TEST: Navigation Tabs');
    const sidebar = await page.$('aside, [class*="sidebar"]');
    if (sidebar) {
      log('Sidebar found');
      await page.screenshot({ path: 'test-screenshots/11_sidebar.png', fullPage: true });

      // Try clicking different tabs
      const tabs = await page.$$('aside button, [class*="sidebar"] button');
      log(`Found ${tabs.length} sidebar buttons`);

      for (let i = 0; i < Math.min(tabs.length, 4); i++) {
        await tabs[i].click();
        await sleep(500);
        await page.screenshot({ path: `test-screenshots/12_tab_${i}.png`, fullPage: true });
      }
    }

    // 7. Mobile Testing
    log('TEST: Mobile Viewports');

    for (const [name, vp] of Object.entries(CONFIG.viewports)) {
      if (name === 'desktop') continue;

      log(`Testing viewport: ${name} (${vp.width}x${vp.height})`);
      await page.setViewport(vp);
      await page.reload({ waitUntil: 'networkidle2' });
      await sleep(2000);
      await page.screenshot({ path: `test-screenshots/13_mobile_${name}.png`, fullPage: true });

      // Check for mobile navigation
      const mobileNav = await page.$('[class*="mobile"], nav, [class*="navigation"]');
      if (mobileNav) {
        log(`Mobile navigation found for ${name}`);
      }

      // Check touch targets (min 44x44px)
      const buttons = await page.$$('button, a, [role="button"]');
      let smallTargets = 0;
      for (const btn of buttons.slice(0, 20)) {
        const box = await btn.boundingBox();
        if (box && (box.width < 44 || box.height < 44)) {
          smallTargets++;
        }
      }
      if (smallTargets > 0) {
        results.uxIssues.push({
          where: `Mobile ${name}`,
          issue: `${smallTargets} touch targets < 44x44px`,
          severity: 'Major',
          recommendation: 'Increase button sizes to minimum 44x44px for better touch accessibility'
        });
      }

      // Check horizontal scroll
      const hScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      if (hScroll) {
        results.uxIssues.push({
          where: `Mobile ${name}`,
          issue: 'Horizontal scroll detected',
          severity: 'Major',
          recommendation: 'Fix overflow on container elements'
        });
      }

      // Check if input is accessible
      const mobileInput = await page.$('textarea');
      if (mobileInput) {
        await mobileInput.click();
        await sleep(500);
        await page.screenshot({ path: `test-screenshots/14_mobile_${name}_keyboard.png`, fullPage: true });

        // Check if input is visible (not covered by keyboard simulation)
        const inputBox = await mobileInput.boundingBox();
        if (inputBox && inputBox.y > vp.height * 0.7) {
          results.uxIssues.push({
            where: `Mobile ${name}`,
            issue: 'Input field may be covered by virtual keyboard',
            severity: 'Major',
            recommendation: 'Add scroll-into-view on input focus'
          });
        }
      }
    }

    // 8. Performance Metrics
    log('TEST: Performance');
    await page.setViewport(CONFIG.viewports.desktop);
    await page.goto(CONFIG.chatRoomUrl, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const perfData = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      const lcp = performance.getEntriesByType('largest-contentful-paint');
      return {
        domContentLoaded: nav?.domContentLoadedEventEnd - nav?.startTime,
        loadComplete: nav?.loadEventEnd - nav?.startTime,
        fcp: fcp?.startTime,
        lcp: lcp.length > 0 ? lcp[lcp.length - 1].startTime : null,
        resourceCount: performance.getEntriesByType('resource').length
      };
    });

    results.perf = { ...results.perf, ...perfData };
    log(`FCP: ${perfData.fcp?.toFixed(0)}ms, LCP: ${perfData.lcp?.toFixed(0)}ms`);
    log(`Resources loaded: ${perfData.resourceCount}`);

    if (perfData.fcp > 2500) {
      results.bugs.push({ where: 'Performance', what: `Slow FCP: ${perfData.fcp}ms (should be < 2500ms)`, severity: 'Major' });
    }
    if (perfData.lcp > 4000) {
      results.bugs.push({ where: 'Performance', what: `Slow LCP: ${perfData.lcp}ms (should be < 4000ms)`, severity: 'Major' });
    }

    // 9. Offline Mode Test
    log('TEST: Offline Mode');
    await page.setOfflineMode(true);
    await sleep(2000);
    await page.screenshot({ path: 'test-screenshots/15_offline.png', fullPage: true });

    // Check for offline indicator
    const offlineIndicator = await page.$('[class*="offline"], [class*="connection"], [class*="status"], [class*="error"]');
    if (!offlineIndicator) {
      results.uxIssues.push({
        where: 'Offline',
        issue: 'No visual offline indicator',
        severity: 'Major',
        recommendation: 'Add connection status indicator to inform users when offline'
      });
    }

    // Try to send message while offline
    const offlineInput = await page.$('textarea');
    if (offlineInput) {
      await offlineInput.click();
      await offlineInput.type('Offline test message');
      await page.keyboard.press('Enter');
      await sleep(1000);
      await page.screenshot({ path: 'test-screenshots/16_offline_send.png', fullPage: true });
    }

    await page.setOfflineMode(false);
    await sleep(3000);
    await page.screenshot({ path: 'test-screenshots/17_back_online.png', fullPage: true });

    // 10. Edge Cases
    log('TEST: Edge Cases');

    const edgeInput = await page.$('textarea');
    if (edgeInput) {
      // XSS attempt
      await edgeInput.click();
      await edgeInput.type('<script>alert("xss")</script>');
      await page.keyboard.press('Enter');
      await sleep(500);

      // SQL injection attempt
      await edgeInput.click();
      await edgeInput.type("'; DROP TABLE messages; --");
      await page.keyboard.press('Enter');
      await sleep(500);

      // Unicode and RTL text
      await edgeInput.click();
      await edgeInput.type('Unicode: 你好世界 مرحبا العالم שלום עולם');
      await page.keyboard.press('Enter');
      await sleep(500);

      // Very long word (no spaces)
      await edgeInput.click();
      await edgeInput.type('Verylongwordwithoutspaces'.repeat(20));
      await page.keyboard.press('Enter');
      await sleep(500);

      await page.screenshot({ path: 'test-screenshots/18_edge_cases.png', fullPage: true });
    }

    // 11. Scroll Performance
    log('TEST: Scroll Performance');
    const messageList = await page.$('[class*="message-list"], [class*="messages"], main');
    if (messageList) {
      // Scroll up and down
      await page.evaluate(() => {
        const container = document.querySelector('[class*="message"], main');
        if (container) {
          container.scrollTop = 0;
        }
      });
      await sleep(500);
      await page.evaluate(() => {
        const container = document.querySelector('[class*="message"], main');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
      await sleep(500);
      log('Scroll test completed');
    }

  } catch (err) {
    log(`ERROR: ${err.message}`);
    results.bugs.push({ where: 'Test Execution', what: err.message, severity: 'Critical' });
    await page.screenshot({ path: 'test-screenshots/error.png', fullPage: true });
  }

  // Generate Report
  const report = {
    testDate: new Date().toISOString(),
    url: CONFIG.chatRoomUrl,
    summary: {
      totalBugs: results.bugs.length,
      critical: results.bugs.filter(b => b.severity === 'Critical').length,
      major: results.bugs.filter(b => b.severity === 'Major').length,
      minor: results.bugs.filter(b => b.severity === 'Minor').length,
      uxIssues: results.uxIssues.length,
      consoleErrors: results.errors.length
    },
    performance: results.perf,
    bugs: results.bugs,
    uxIssues: results.uxIssues,
    consoleErrors: results.errors.slice(0, 20),

    top5CriticalBugs: results.bugs
      .filter(b => b.severity === 'Critical' || b.severity === 'Major')
      .slice(0, 5),

    top5MobileUXImprovements: results.uxIssues
      .filter(i => i.where.toLowerCase().includes('mobile'))
      .slice(0, 5)
  };

  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('CHATUS COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(60));
  console.log(`\nTest Date: ${report.testDate}`);
  console.log(`URL: ${report.url}`);

  console.log('\n--- SUMMARY ---');
  console.log(`Total Bugs: ${report.summary.totalBugs}`);
  console.log(`  Critical: ${report.summary.critical}`);
  console.log(`  Major: ${report.summary.major}`);
  console.log(`  Minor: ${report.summary.minor}`);
  console.log(`UX Issues: ${report.summary.uxIssues}`);
  console.log(`Console Errors: ${report.summary.consoleErrors}`);

  console.log('\n--- PERFORMANCE ---');
  console.log(`Page Load: ${results.perf.loadTime}ms`);
  console.log(`FCP: ${results.perf.fcp?.toFixed(0)}ms`);
  console.log(`LCP: ${results.perf.lcp?.toFixed(0)}ms`);
  console.log(`DOM Content Loaded: ${results.perf.domContentLoaded?.toFixed(0)}ms`);

  if (report.top5CriticalBugs.length > 0) {
    console.log('\n--- TOP 5 CRITICAL/MAJOR BUGS ---');
    report.top5CriticalBugs.forEach((bug, i) => {
      console.log(`${i+1}. [${bug.severity}] ${bug.where}`);
      console.log(`   ${bug.what}`);
    });
  }

  if (report.top5MobileUXImprovements.length > 0) {
    console.log('\n--- TOP 5 MOBILE UX IMPROVEMENTS ---');
    report.top5MobileUXImprovements.forEach((issue, i) => {
      console.log(`${i+1}. [${issue.severity}] ${issue.where}`);
      console.log(`   Issue: ${issue.issue}`);
      if (issue.recommendation) {
        console.log(`   Fix: ${issue.recommendation}`);
      }
    });
  }

  if (results.errors.length > 0) {
    console.log('\n--- CONSOLE ERRORS (first 5) ---');
    results.errors.slice(0, 5).forEach((err, i) => {
      console.log(`${i+1}. ${err.substring(0, 100)}...`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('Report saved: test-report.json');
  console.log('Screenshots: test-screenshots/');
  console.log('='.repeat(60));

  await browser.close();
}

runTest().catch(console.error);
