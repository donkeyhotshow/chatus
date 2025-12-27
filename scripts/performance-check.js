#!/usr/bin/env node
/**
 * Performance Check Script
 * P0: Analyzes bundle size and performance metrics
 */

const fs = require('fs');
const path = require('path');

const BUNDLE_SIZE_LIMITS = {
  'framework': 150 * 1024,      // 150KB
  'firebase': 200 * 1024,       // 200KB
  'radix-ui': 100 * 1024,       // 100KB
  'animations': 80 * 1024,      // 80KB
  'vendors': 150 * 1024,        // 150KB
  'total-initial': 300 * 1024,  // 300KB initial JS
};

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function checkBuildOutput() {
  const buildDir = path.join(process.cwd(), '.next');

  if (!fs.existsSync(buildDir)) {
    console.log(`${COLORS.yellow}⚠ No build found. Run 'npm run build' first.${COLORS.reset}`);
    return null;
  }

  const staticDir = path.join(buildDir, 'static', 'chunks');
  if (!fs.existsSync(staticDir)) {
    console.log(`${COLORS.yellow}⚠ No chunks found in build.${COLORS.reset}`);
    return null;
  }

  const chunks = {};
  let totalSize = 0;

  const files = fs.readdirSync(staticDir);
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(staticDir, file);
      const stats = fs.statSync(filePath);
      const size = stats.size;
      totalSize += size;

      // Categorize chunks
      if (file.includes('framework')) {
        chunks.framework = (chunks.framework || 0) + size;
      } else if (file.includes('firebase')) {
        chunks.firebase = (chunks.firebase || 0) + size;
      } else if (file.includes('radix')) {
        chunks['radix-ui'] = (chunks['radix-ui'] || 0) + size;
      } else if (file.includes('animation') || file.includes('framer')) {
        chunks.animations = (chunks.animations || 0) + size;
      } else if (file.includes('vendor') || file.includes('node_modules')) {
        chunks.vendors = (chunks.vendors || 0) + size;
      }
    }
  });

  chunks['total-initial'] = totalSize;
  return chunks;
}

function analyzePerformance() {
  console.log('\n📊 Performance Analysis\n');
  console.log('='.repeat(50));

  const chunks = checkBuildOutput();

  if (!chunks) {
    process.exit(1);
  }

  let hasWarnings = false;
  let hasErrors = false;

  console.log('\n📦 Bundle Size Analysis:\n');

  Object.entries(chunks).forEach(([name, size]) => {
    const limit = BUNDLE_SIZE_LIMITS[name];
    const formattedSize = formatBytes(size);

    if (limit) {
      const percentage = ((size / limit) * 100).toFixed(1);
      const formattedLimit = formatBytes(limit);

      if (size > limit) {
        console.log(`${COLORS.red}❌ ${name}: ${formattedSize} (${percentage}% of ${formattedLimit} limit)${COLORS.reset}`);
        hasErrors = true;
      } else if (size > limit * 0.8) {
        console.log(`${COLORS.yellow}⚠ ${name}: ${formattedSize} (${percentage}% of ${formattedLimit} limit)${COLORS.reset}`);
        hasWarnings = true;
      } else {
        console.log(`${COLORS.green}✓ ${name}: ${formattedSize} (${percentage}% of ${formattedLimit} limit)${COLORS.reset}`);
      }
    } else {
      console.log(`  ${name}: ${formattedSize}`);
    }
  });

  console.log('\n' + '='.repeat(50));

  // Performance recommendations
  console.log('\n💡 Recommendations:\n');

  if (chunks.firebase > 150 * 1024) {
    console.log('  • Consider lazy loading Firebase modules');
  }
  if (chunks.animations > 60 * 1024) {
    console.log('  • Consider using CSS animations instead of framer-motion for simple effects');
  }
  if (chunks['radix-ui'] > 80 * 1024) {
    console.log('  • Import only needed Radix UI components');
  }
  if (chunks['total-initial'] > 250 * 1024) {
    console.log('  • Consider code splitting for non-critical components');
  }

  console.log('\n');

  if (hasErrors) {
    console.log(`${COLORS.red}❌ Performance check failed - bundle size limits exceeded${COLORS.reset}\n`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`${COLORS.yellow}⚠ Performance check passed with warnings${COLORS.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${COLORS.green}✓ Performance check passed${COLORS.reset}\n`);
    process.exit(0);
  }
}

// Run analysis
analyzePerformance();
