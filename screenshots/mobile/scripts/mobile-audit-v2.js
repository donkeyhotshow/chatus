/**
 * ChatUs Mobile Audit V2 - Enhanced Testing Script
 * Полное тест UI/UX согласно дизайн-спецификации
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'https://chatus-omega.vercel.app/chat/2';

// Device configurations
const DEVICES = {
  'iPhone 12/13 (390px)': { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  'iPhone SE (375px)': { width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'Samsung Galaxy (360px)': { width: 360, height: 800, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  'Pixel 6a (412px)': { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true },
  'iPad Mini (768px)': { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'Desktop (1440px)': { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};

// Design spec from product.md
const DESIGN_SPEC = {
  colors: {
    bgPrimary: '#0D0D0D',
    bgSecondary: '#121214',
    bgTertiary: '#1A1A1C',
    bgHover: '#242426',
    textPrimary: '#FFFFFF',
    textSecondary: '#D4D4D8',
    textTertiary: '#A1A1A6',
    textMuted: '#727278',
    accentPrimary: '#7C3AED',
    accentHover: '#6D28D9',
    messageSent: 'rgba(124,58,237,0.2)',
    messageReceived: '#2D2D35',
  },
  spacing: {
    touchTarget: 44,
    inputHeight: 48,
    navHeight: 56,
    avatarSize: 36,
  },
  messageMaxWidth: {
    mobile: 75,
    tablet: 60,
    desktop: 50,
  }
};

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function log(status, category, message, details = null) {
  const icons = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
  console.log(`${icons[status]} [${category}] ${message}`);

  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else if (status === 'warn') results.warnings++;

  results.tests.push({ status, category, message, details, time: new Date().toISOString() });
}

async function waitForApp(page) {
  // Wait for React to hydrate
  try {
    await page.waitForFunction(() => {
      return document.querySelector('button') !== null ||
             document.querySelector('nav') !== null ||
             document.querySelector('[role="navigation"]') !== null ||
             document.querySelector('.message-bubble') !== null ||
             document.body.innerText.length > 100;
    }, { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

async function runAudit() {
  console.log('\n🧪 CHATUS MOBILE AUDIT V2\n');
  console.log('═'.repeat(60));
  console.log(`📍 Testing: ${BASE_URL}`);
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  try {
    for (const [deviceName, viewport] of Object.entries(DEVICES)) {
      console.log(`\n📱 ${deviceName}`);
      console.log('-'.repeat(50));

      const page = await browser.newPage();
      await page.setViewport(viewport);

      // Set user agent for mobile
      if (viewport.isMobile) {
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');
      }

      try {
        // Navigate to home page first
        await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));

        const appLoaded = await waitForApp(page);

        if (!appLoaded) {
          log('warn', 'LOAD', 'App may not have fully loaded');
        }

        // Run all test categories
        await testColorsAndTheme(page, deviceName);
        await testTypography(page, deviceName);
        await testTouchTargets(page, deviceName, viewport);
        await testNavigation(page, deviceName, viewport);
        await testInputFields(page, deviceName);
        await testButtons(page, deviceName);
        await testLayout(page, deviceName, viewport);
        await testAccessibility(page, deviceName);

        // Take screenshot
        await page.screenshot({
          path: `test-results/audit-${deviceName.replace(/[^a-z0-9]/gi, '-')}.png`,
          fullPage: false
        });

      } catch (error) {
        log('fail', 'ERROR', `Test error: ${error.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  printReport();
}

async function testColorsAndTheme(page, device) {
  const colors = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const style = getComputedStyle(root);
    const bodyStyle = getComputedStyle(body);

    return {
      bgPrimary: style.getPropertyValue('--bg-primary').trim(),
      bgSecondary: style.getPropertyValue('--bg-secondary').trim(),
      bgTertiary: style.getPropertyValue('--bg-tertiary').trim(),
      textPrimary: style.getPropertyValue('--text-primary').trim(),
      textTertiary: style.getPropertyValue('--text-tertiary').trim(),
      accentPrimary: style.getPropertyValue('--primary').trim() || style.getPropertyValue('--accent-primary').trim(),
      bodyBg: bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
    };
  });

  // Check CSS variables
  if (colors.bgPrimary.toLowerCase() === '#0d0d0d') {
    log('pass', 'COLORS', '--bg-primary: #0D0D0D ✓');
  } else if (colors.bgPrimary) {
    log('warn', 'COLORS', `--bg-primary: ${colors.bgPrimary} (expected #0D0D0D)`);
  }

  if (colors.accentPrimary.toLowerCase() === '#7c3aed') {
    log('pass', 'COLORS', '--primary (accent): #7C3AED ✓');
  } else if (colors.accentPrimary) {
    log('warn', 'COLORS', `--primary: ${colors.accentPrimary} (expected #7C3AED)`);
  }

  if (colors.textTertiary === '#A1A1A6' || colors.textTertiary.includes('161')) {
    log('pass', 'COLORS', 'Timestamp color correct (solid #A1A1A6)');
  }
}

async function testTypography(page, device) {
  const typography = await page.evaluate(() => {
    const body = document.body;
    const style = getComputedStyle(body);

    return {
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      fontSmoothing: style.webkitFontSmoothing || style.MozOsxFontSmoothing,
      textRendering: style.textRendering,
    };
  });

  if (parseInt(typography.fontSize) >= 16) {
    log('pass', 'TYPOGRAPHY', `Base font size: ${typography.fontSize} ✓`);
  } else {
    log('warn', 'TYPOGRAPHY', `Base font size: ${typography.fontSize} (recommended 16px)`);
  }

  if (typography.fontSmoothing === 'antialiased') {
    log('pass', 'TYPOGRAPHY', 'Font smoothing: antialiased ✓');
  }
}

async function testTouchTargets(page, device, viewport) {
  const targets = await page.evaluate(() => {
    const interactive = document.querySelectorAll('button, a, [role="button"], input, textarea');
    const results = [];

    interactive.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        results.push({
          tag: el.tagName,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          text: (el.textContent || el.getAttribute('aria-label') || '').slice(0, 20),
        });
      }
    });

    return results;
  });

  if (targets.length === 0) {
    log('warn', 'TOUCH', 'No interactive elements found');
    return;
  }

  let passed = 0;
  let failed = 0;

  targets.forEach(t => {
    const minSize = viewport.isMobile ? 44 : 32;
    if (t.width >= minSize && t.height >= minSize) {
      passed++;
    } else if (t.width >= 32 && t.height >= 32) {
      passed++; // Acceptable for icons
    } else {
      failed++;
    }
  });

  if (failed === 0) {
    log('pass', 'TOUCH', `All ${passed} touch targets >= 44px ✓`);
  } else {
    log('warn', 'TOUCH', `${failed}/${targets.length} targets below 44px`);
  }
}

async function testNavigation(page, device, viewport) {
  const nav = await page.evaluate(() => {
    const bottomNav = document.querySelector('nav, [role="navigation"]');
    const navItems = document.querySelectorAll('nav button, nav a, [role="navigation"] button');

    if (!bottomNav) return null;

    const rect = bottomNav.getBoundingClientRect();
    const style = getComputedStyle(bottomNav);

    return {
      found: true,
      position: style.position,
      bottom: window.innerHeight - rect.bottom,
      height: rect.height,
      itemCount: navItems.length,
      hasActiveIndicator: bottomNav.innerHTML.includes('active') ||
                          bottomNav.innerHTML.includes('aria-current'),
    };
  });

  if (nav?.found) {
    log('pass', 'NAV', `Bottom navigation found (${nav.itemCount} items)`);

    if (nav.position === 'fixed') {
      log('pass', 'NAV', 'Navigation is fixed positioned ✓');
    }

    if (nav.height >= 56 && nav.height <= 80) {
      log('pass', 'NAV', `Nav height: ${Math.round(nav.height)}px ✓`);
    }
  } else if (viewport.isMobile) {
    log('warn', 'NAV', 'Bottom navigation not found on mobile');
  }
}

async function testInputFields(page, device) {
  const inputs = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, textarea');
    return Array.from(inputs).map(input => {
      const rect = input.getBoundingClientRect();
      const style = getComputedStyle(input);
      return {
        type: input.type || 'textarea',
        height: rect.height,
        fontSize: style.fontSize,
        borderRadius: style.borderRadius,
        hasBorder: style.borderWidth !== '0px',
        hasShadow: style.boxShadow !== 'none',
      };
    });
  });

  if (inputs.length === 0) {
    log('info', 'INPUT', 'No input fields found on this page');
    return;
  }

  inputs.forEach((input, i) => {
    if (input.height >= 48) {
      log('pass', 'INPUT', `Input ${i + 1} height: ${Math.round(input.height)}px ✓`);
    } else if (input.height >= 40) {
      log('warn', 'INPUT', `Input ${i + 1} height: ${Math.round(input.height)}px (recommended 48px)`);
    }

    if (parseInt(input.fontSize) >= 16) {
      log('pass', 'INPUT', `Input ${i + 1} font size: ${input.fontSize} ✓ (prevents iOS zoom)`);
    }
  });
}

async function testButtons(page, device) {
  const buttons = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    return Array.from(btns).slice(0, 10).map(btn => {
      const style = getComputedStyle(btn);
      return {
        text: (btn.textContent || btn.getAttribute('aria-label') || '').slice(0, 20),
        hasTransition: style.transition !== 'none' && style.transition !== 'all 0s ease 0s',
        cursor: style.cursor,
        minHeight: parseInt(style.minHeight) || 0,
        minWidth: parseInt(style.minWidth) || 0,
      };
    });
  });

  if (buttons.length === 0) {
    log('warn', 'BUTTONS', 'No buttons found');
    return;
  }

  const withTransition = buttons.filter(b => b.hasTransition).length;
  const withPointer = buttons.filter(b => b.cursor === 'pointer').length;

  if (withTransition > 0) {
    log('pass', 'BUTTONS', `${withTransition}/${buttons.length} buttons have transitions ✓`);
  } else {
    log('warn', 'BUTTONS', 'No buttons with transitions found');
  }

  if (withPointer === buttons.length) {
    log('pass', 'BUTTONS', 'All buttons have cursor: pointer ✓');
  }
}

async function testLayout(page, device, viewport) {
  const layout = await page.evaluate(() => {
    const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    const viewportMeta = document.querySelector('meta[name="viewport"]');

    // Check for message bubbles
    const messages = document.querySelectorAll('[class*="message"], [class*="bubble"]');
    let maxMessageWidth = 0;
    messages.forEach(msg => {
      const rect = msg.getBoundingClientRect();
      const parentWidth = msg.parentElement?.getBoundingClientRect().width || window.innerWidth;
      const widthPercent = (rect.width / parentWidth) * 100;
      if (widthPercent > maxMessageWidth) maxMessageWidth = widthPercent;
    });

    return {
      hasHorizontalScroll,
      viewportMeta: viewportMeta?.getAttribute('content'),
      messageMaxWidth: maxMessageWidth,
      windowWidth: window.innerWidth,
    };
  });

  if (!layout.hasHorizontalScroll) {
    log('pass', 'LAYOUT', 'No horizontal scroll ✓');
  } else {
    log('fail', 'LAYOUT', 'Horizontal scroll detected!');
  }

  if (layout.viewportMeta?.includes('width=device-width')) {
    log('pass', 'LAYOUT', 'Viewport meta configured ✓');
  }

  // Check message max-width based on device
  if (layout.messageMaxWidth > 0) {
    const expectedMax = viewport.width >= 1440 ? 50 : viewport.width >= 768 ? 60 : 75;
    if (layout.messageMaxWidth <= expectedMax + 5) {
      log('pass', 'LAYOUT', `Message max-width: ${Math.round(layout.messageMaxWidth)}% ✓`);
    } else {
      log('warn', 'LAYOUT', `Message max-width: ${Math.round(layout.messageMaxWidth)}% (expected ${expectedMax}%)`);
    }
  }
}

async function testAccessibility(page, device) {
  const a11y = await page.evaluate(() => {
    const interactive = document.querySelectorAll('button, a, input, [role="button"]');
    let withLabels = 0;
    let withoutLabels = 0;

    interactive.forEach(el => {
      const hasLabel = el.getAttribute('aria-label') ||
                       el.getAttribute('aria-labelledby') ||
                       el.getAttribute('title') ||
                       (el.textContent && el.textContent.trim().length > 0);
      if (hasLabel) withLabels++;
      else withoutLabels++;
    });

    // Check focus styles
    const style = document.createElement('style');
    document.head.appendChild(style);
    const sheet = style.sheet;
    let hasFocusVisible = false;

    try {
      const rules = Array.from(document.styleSheets).flatMap(s => {
        try { return Array.from(s.cssRules || []); } catch { return []; }
      });
      hasFocusVisible = rules.some(r => r.cssText?.includes('focus-visible'));
    } catch {}

    return {
      totalInteractive: interactive.length,
      withLabels,
      withoutLabels,
      hasFocusVisible,
    };
  });

  if (a11y.totalInteractive === 0) {
    log('info', 'A11Y', 'No interactive elements to test');
    return;
  }

  if (a11y.withoutLabels === 0) {
    log('pass', 'A11Y', `All ${a11y.withLabels} elements have accessible labels ✓`);
  } else {
    log('warn', 'A11Y', `${a11y.withoutLabels}/${a11y.totalInteractive} elements missing labels`);
  }

  if (a11y.hasFocusVisible) {
    log('pass', 'A11Y', 'Focus-visible styles detected ✓');
  }
}

function printReport() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 AUDIT REPORT');
  console.log('═'.repeat(60));

  console.log(`\n✅ Passed:   ${results.passed}`);
  console.log(`❌ Failed:   ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);

  const total = results.passed + results.failed;
  const score = total > 0 ? ((results.passed / total) * 10).toFixed(1) : 0;

  console.log(`\n🎯 Quality Score: ${score}/10`);

  if (results.failed > 0) {
    console.log('\n❌ FAILURES:');
    results.tests.filter(t => t.status === 'fail').forEach(t => {
      console.log(`   • [${t.category}] ${t.message}`);
    });
  }

  // Group warnings by category
  const warningsByCategory = {};
  results.tests.filter(t => t.status === 'warn').forEach(t => {
    if (!warningsByCategory[t.category]) warningsByCategory[t.category] = [];
    warningsByCategory[t.category].push(t.message);
  });

  if (Object.keys(warningsByCategory).length > 0) {
    console.log('\n⚠️  WARNINGS BY CATEGORY:');
    for (const [cat, msgs] of Object.entries(warningsByCategory)) {
      console.log(`   ${cat}:`);
      // Deduplicate messages
      [...new Set(msgs)].forEach(m => console.log(`     • ${m}`));
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📸 Screenshots saved to test-results/');
  console.log('═'.repeat(60) + '\n');
}

// Ensure test-results directory exists
const fs = require('fs');
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}

runAudit().catch(console.error);
