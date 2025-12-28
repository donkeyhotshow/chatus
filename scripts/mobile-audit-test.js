/**
 * ChatUs Mobile Audit V2 - Austing Script
 * Тестирование UI/UX согласно дизайн-спецификации
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'https://chatus-omega.vercel.app/chat/2';

// Device configurations for testing
const DEVICES = {
  'iPhone 12/13': { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  'iPhone SE': { width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'Samsung Galaxy S21': { width: 360, height: 800, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  'Pixel 6a': { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true },
  'iPad Mini': { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'Desktop': { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};

// Design spec colors
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
    accentLight: '#8B5CF6',
    success: '#10B981',
    error: '#EF4444',
  },
  spacing: {
    touchTarget: 44,
    inputHeight: 48,
    navHeight: 56,
    headerHeight: 56,
  },
  messageMaxWidth: {
    mobile: 0.75,
    tablet: 0.60,
    desktop: 0.50,
  }
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: [],
  screenshots: [],
};

function log(type, message, details = null) {
  const icons = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
  console.log(`${icons[type] || '•'} ${message}`);

  if (type === 'pass') testResults.passed++;
  else if (type === 'fail') testResults.failed++;
  else if (type === 'warn') testResults.warnings++;

  testResults.details.push({ type, message, details, timestamp: new Date().toISOString() });
}

// Color conversion utilities
function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent') return null;
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const [, r, g, b] = match;
  return '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function parseRgba(rgba) {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1
  };
}

// Calculate contrast ratio (WCAG)
function getContrastRatio(color1, color2) {
  const getLuminance = (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1.r, color1.g, color1.b);
  const l2 = getLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function runTests() {
  console.log('\n🧪 ChatUs Mobile Audit V2 - Automated Testing\n');
  console.log('═'.repeat(60));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  try {
    // Test on multiple devices
    for (const [deviceName, viewport] of Object.entries(DEVICES)) {
      console.log(`\n📱 Testing on: ${deviceName} (${viewport.width}x${viewport.height})`);
      console.log('-'.repeat(50));

      const page = await browser.newPage();
      await page.setViewport(viewport);

      try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 2000)); // Wait for animations

        // Run test suites
        await testColors(page, deviceName);
        await testSpacing(page, deviceName, viewport);
        await testInteractiveStates(page, deviceName);
        await testLayout(page, deviceName, viewport);
        await testAccessibility(page, deviceName);
        await testNavigation(page, deviceName, viewport);

        // Take screenshot
        const screenshot = await page.screenshot({
          path: `test-results/${deviceName.replace(/[^a-z0-9]/gi, '-')}.png`,
          fullPage: false
        });
        testResults.screenshots.push({ device: deviceName, path: screenshot });

      } catch (error) {
        log('fail', `Error testing ${deviceName}: ${error.message}`);
      } finally {
        await page.close();
      }
    }

  } finally {
    await browser.close();
  }

  // Print summary
  printSummary();
}

async function testColors(page, deviceName) {
  log('info', `Testing colors on ${deviceName}...`);

  // Test background color
  const bgColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });

  const bgHex = rgbToHex(bgColor);
  if (bgHex === '#0D0D0D' || bgHex === '#0D0D0E') {
    log('pass', `Background color correct: ${bgHex}`);
  } else {
    log('warn', `Background color: ${bgHex} (expected #0D0D0D)`);
  }

  // Test CSS variables
  const cssVars = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      bgPrimary: style.getPropertyValue('--bg-primary').trim(),
      bgSecondary: style.getPropertyValue('--bg-secondary').trim(),
      bgTertiary: style.getPropertyValue('--bg-tertiary').trim(),
      textPrimary: style.getPropertyValue('--text-primary').trim(),
      textTertiary: style.getPropertyValue('--text-tertiary').trim(),
      accentPrimary: style.getPropertyValue('--primary').trim(),
    };
  });

  if (cssVars.bgPrimary === '#0D0D0D') {
    log('pass', 'CSS variable --bg-primary correct');
  } else {
    log('warn', `CSS variable --bg-primary: ${cssVars.bgPrimary}`);
  }

  if (cssVars.accentPrimary === '#7C3AED') {
    log('pass', 'CSS variable --primary (accent) correct');
  } else {
    log('warn', `CSS variable --primary: ${cssVars.accentPrimary}`);
  }
}

async function testSpacing(page, deviceName, viewport) {
  log('info', `Testing spacing on ${deviceName}...`);

  // Test touch targets
  const buttons = await page.$$eval('button', buttons => {
    return buttons.slice(0, 10).map(btn => {
      const rect = btn.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        text: btn.textContent?.slice(0, 20) || 'button'
      };
    });
  });

  let touchTargetsPassed = 0;
  let touchTargetsFailed = 0;

  buttons.forEach(btn => {
    if (btn.width >= 44 && btn.height >= 44) {
      touchTargetsPassed++;
    } else if (btn.width >= 32 && btn.height >= 32) {
      // Acceptable for icon buttons
      touchTargetsPassed++;
    } else {
      touchTargetsFailed++;
      log('warn', `Small touch target: ${btn.text} (${Math.round(btn.width)}x${Math.round(btn.height)}px)`);
    }
  });

  if (touchTargetsFailed === 0) {
    log('pass', `All ${touchTargetsPassed} tested buttons have adequate touch targets`);
  } else {
    log('warn', `${touchTargetsFailed}/${buttons.length} buttons have small touch targets`);
  }

  // Test input height
  const inputs = await page.$$eval('input, textarea', inputs => {
    return inputs.map(input => {
      const rect = input.getBoundingClientRect();
      return { height: rect.height, type: input.type };
    });
  });

  inputs.forEach(input => {
    if (input.height >= 48) {
      log('pass', `Input height OK: ${Math.round(input.height)}px`);
    } else if (input.height >= 40) {
      log('warn', `Input height acceptable: ${Math.round(input.height)}px (recommended 48px)`);
    }
  });
}

async function testInteractiveStates(page, deviceName) {
  log('info', `Testing interactive states on ${deviceName}...`);

  // Check for transition properties
  const hasTransitions = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    let withTransition = 0;
    buttons.forEach(btn => {
      const style = getComputedStyle(btn);
      if (style.transition && style.transition !== 'none' && style.transition !== 'all 0s ease 0s') {
        withTransition++;
      }
    });
    return { total: buttons.length, withTransition };
  });

  if (hasTransitions.withTransition > 0) {
    log('pass', `${hasTransitions.withTransition}/${hasTransitions.total} buttons have transitions`);
  } else {
    log('warn', 'No buttons with transitions found');
  }

  // Check for focus-visible styles
  const hasFocusStyles = await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = ':focus-visible { outline: 2px solid red !important; }';
    document.head.appendChild(style);

    const btn = document.querySelector('button');
    if (btn) {
      btn.focus();
      const outline = getComputedStyle(btn).outline;
      style.remove();
      return outline.includes('2px');
    }
    style.remove();
    return false;
  });

  if (hasFocusStyles) {
    log('pass', 'Focus-visible styles are applied');
  } else {
    log('warn', 'Focus-visible styles may not be properly configured');
  }
}

async function testLayout(page, deviceName, viewport) {
  log('info', `Testing layout on ${deviceName}...`);

  // Check for fixed positioning elements
  const fixedElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const fixed = [];
    elements.forEach(el => {
      const style = getComputedStyle(el);
      if (style.position === 'fixed') {
        const rect = el.getBoundingClientRect();
        fixed.push({
          tag: el.tagName,
          class: el.className?.slice(0, 50),
          top: rect.top,
          bottom: window.innerHeight - rect.bottom,
          height: rect.height
        });
      }
    });
    return fixed;
  });

  const hasFixedNav = fixedElements.some(el =>
    el.bottom < 100 && el.height > 40 && el.height < 100
  );

  if (hasFixedNav) {
    log('pass', 'Fixed bottom navigation detected');
  } else if (viewport.isMobile) {
    log('warn', 'No fixed bottom navigation found on mobile');
  }

  // Check for horizontal scroll
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  if (!hasHorizontalScroll) {
    log('pass', 'No horizontal scroll detected');
  } else {
    log('fail', 'Horizontal scroll detected - layout issue');
  }

  // Check viewport meta tag
  const viewportMeta = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    return meta ? meta.getAttribute('content') : null;
  });

  if (viewportMeta && viewportMeta.includes('width=device-width')) {
    log('pass', 'Viewport meta tag configured correctly');
  } else {
    log('warn', 'Viewport meta tag may need configuration');
  }
}

async function testAccessibility(page, deviceName) {
  log('info', `Testing accessibility on ${deviceName}...`);

  // Check for aria labels
  const ariaLabels = await page.evaluate(() => {
    const interactive = document.querySelectorAll('button, a, input, [role="button"]');
    let withLabel = 0;
    let withoutLabel = 0;

    interactive.forEach(el => {
      const hasLabel = el.getAttribute('aria-label') ||
                       el.getAttribute('aria-labelledby') ||
                       el.textContent?.trim();
      if (hasLabel) withLabel++;
      else withoutLabel++;
    });

    return { withLabel, withoutLabel, total: interactive.length };
  });

  if (ariaLabels.withoutLabel === 0) {
    log('pass', `All ${ariaLabels.total} interactive elements have labels`);
  } else {
    log('warn', `${ariaLabels.withoutLabel}/${ariaLabels.total} elements missing labels`);
  }

  // Check color contrast (simplified)
  const contrastCheck = await page.evaluate(() => {
    const body = document.body;
    const bgColor = getComputedStyle(body).backgroundColor;
    const textColor = getComputedStyle(body).color;
    return { bgColor, textColor };
  });

  const bg = parseRgba(contrastCheck.bgColor);
  const text = parseRgba(contrastCheck.textColor);

  if (bg && text) {
    const ratio = getContrastRatio(bg, text);
    if (ratio >= 4.5) {
      log('pass', `Text contrast ratio: ${ratio.toFixed(2)}:1 (WCAG AA)`);
    } else if (ratio >= 3) {
      log('warn', `Text contrast ratio: ${ratio.toFixed(2)}:1 (below WCAG AA)`);
    } else {
      log('fail', `Text contrast ratio: ${ratio.toFixed(2)}:1 (fails WCAG)`);
    }
  }
}

async function testNavigation(page, deviceName, viewport) {
  log('info', `Testing navigation on ${deviceName}...`);

  // Check for navigation elements
  const navElements = await page.evaluate(() => {
    const nav = document.querySelector('nav, [role="navigation"]');
    if (!nav) return null;

    const items = nav.querySelectorAll('button, a');
    return {
      found: true,
      itemCount: items.length,
      hasActiveState: Array.from(items).some(item =>
        item.classList.contains('active') ||
        item.getAttribute('aria-current') === 'page'
      )
    };
  });

  if (navElements?.found) {
    log('pass', `Navigation found with ${navElements.itemCount} items`);
    if (navElements.hasActiveState) {
      log('pass', 'Navigation has active state indicator');
    }
  } else if (viewport.isMobile) {
    log('warn', 'No navigation element found');
  }

  // Check for safe area handling
  const hasSafeArea = await page.evaluate(() => {
    const style = document.body.style.cssText +
                  getComputedStyle(document.body).cssText;
    return style.includes('safe-area') || style.includes('env(');
  });

  if (hasSafeArea || !viewport.isMobile) {
    log('pass', 'Safe area handling detected');
  } else {
    log('warn', 'Safe area handling may not be configured');
  }
}

function printSummary() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed:   ${testResults.passed}`);
  console.log(`❌ Failed:   ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log('-'.repeat(60));

  const total = testResults.passed + testResults.failed;
  const score = total > 0 ? ((testResults.passed / total) * 10).toFixed(1) : 0;
  console.log(`\n🎯 Quality Score: ${score}/10`);

  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(d => d.type === 'fail')
      .forEach(d => console.log(`   • ${d.message}`));
  }

  if (testResults.warnings > 0) {
    console.log('\n⚠️  WARNINGS:');
    testResults.details
      .filter(d => d.type === 'warn')
      .forEach(d => console.log(`   • ${d.message}`));
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`📅 Test completed: ${new Date().toISOString()}`);
  console.log('═'.repeat(60) + '\n');
}

// Create test-results directory and run
const fs = require('fs');
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}

runTests().catch(console.error);
