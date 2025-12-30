/**
 * Этап 8: Bundle Size Check Script
 * Проверка размера бандла иция отчёта
 *
 * Использование: node scripts/bundle-check.js
 */

const fs = require('fs');
const path = require('path');

// Бюджеты размеров (в KB)
const BUDGETS = {
  // Критические чанки
  'framework': 150,
  'main': 100,

  // Lazy-loaded чанки
  'firebase': 200,
  'animations': 80,
  'radix-ui': 100,
  'vendors': 250,

  // Общий бюджет
  'total-initial': 300,
  'total-all': 1000,
};

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function formatSize(bytes) {
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

function getStatusColor(size, budget) {
  const ratio = size / (budget * 1024);
  if (ratio > 1) return colors.red;
  if (ratio > 0.8) return colors.yellow;
  return colors.green;
}

function analyzeBuild() {
  const buildDir = path.join(process.cwd(), '.next');

  if (!fs.existsSync(buildDir)) {
    console.log(`${colors.red}Error: .next directory not found. Run 'npm run build' first.${colors.reset}`);
    process.exit(1);
  }

  console.log(`\n${colors.cyan}📊 Bundle Size Analysis${colors.reset}\n`);
  console.log('='.repeat(60));

  // Анализ static chunks
  const staticDir = path.join(buildDir, 'static', 'chunks');
  if (!fs.existsSync(staticDir)) {
    console.log(`${colors.yellow}Warning: Static chunks directory not found.${colors.reset}`);
    return;
  }
chunks = {};
  let totalSize = 0;
  let initialSize = 0;

  // Рекурсивно собираем все JS файлы
  function collectFiles(dir, prefix = '') {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        collectFiles(filePath, `${prefix}${file}/`);
      } else if (file.endsWith('.js')) {
        const size = stat.size;
        const name = `${prefix}${file}`;

        // Категоризация чанков
        let category = 'other';
        if (name.includes('framework')) category = 'framework';
        else if (name.includes('main')) category = 'main';
        else if (name.includes('firebase')) category = 'firebase';
        else if (name.includes('framer') || name.includes('motion')) category = 'animations';
        else if (name.includes('radix')) category = 'radix-ui';
        else if (name.includes('vendor') || name.includes('node_modules')) category = 'vendors';

        if (!chunks[category]) {
          chunks[category] = { files: [], totalSize: 0 };
        }

        chunks[category].files.push({ name, size });
        chunks[category].totalSize += size;
        totalSize += size;

        // Initial chunks (framework + main)
        if (category === 'framework' || category === 'main') {
          initialSize += size;
        }
      }
    });
  }

  collectFiles(staticDir);

  // Вывод результатов по категориям
  console.log(`\n${colors.blue}Chunks by Category:${colors.reset}\n`);

  const violations = [];

  Object.entries(chunks)
    .sort((a, b) => b[1].totalSize - a[1].totalSize)
    .forEach(([category, data]) => {
      const budget = BUDGETS[category];
      const sizeKB = data.totalSize / 1024;
      const statusColor = budget ? getStatusColor(data.totalSize, budget) : colors.reset;
      const budgetStr = budget ? ` (budget: ${budget} KB)` : '';
      const status = budget && sizeKB > budget ? ' ⚠️ OVER BUDGET' : '';

      console.log(`${statusColor}${category}: ${formatSize(data.totalSize)}${budgetStr}${status}${colors.reset}`);

      if (budget && sizeKB > budget) {
        violations.push({
          category,
          size: sizeKB,
          budget,
          overage: sizeKB - budget,
        });
      }

      // Показываем топ-3 файла в категории
      data.files
        .sort((a, b) => b.size - a.size)
        .slice(0, 3)
        .forEach(file => {
          console.log(`  └─ ${file.name}: ${formatSize(file.size)}`);
        });
    });

  // Итоги
  console.log('\n' + '='.repeat(60));
  console.log(`\n${colors.blue}Summary:${colors.reset}\n`);

  const initialColor = getStatusColor(initialSize, BUDGETS['total-initial']);
  const totalColor = getStatusColor(totalSize, BUDGETS['total-all']);

  console.log(`${initialColor}Initial Load: ${formatSize(initialSize)} (budget: ${BUDGETS['total-initial']} KB)${colors.reset}`);
  console.log(`${totalColor}Total Bundle: ${formatSize(totalSize)} (budget: ${BUDGETS['total-all']} KB)${colors.reset}`);

  // Нарушения бюджета
  if (violations.length > 0) {
    console.log(`\n${colors.red}⚠️  Budget Violations:${colors.reset}\n`);
    violations.forEach(v => {
      console.log(`  ${v.category}: ${v.size.toFixed(1)} KB (over by ${v.overage.toFixed(1)} KB)`);
    });

    console.log(`\n${colors.yellow}Recommendations:${colors.reset}`);
    console.log('  • Consider code splitting for large chunks');
    console.log('  • Use dynamic imports for non-critical features');
    console.log('  • Check for duplicate dependencies');
    console.log('  • Run: npm run analyze for detailed analysis');
  } else {
    console.log(`\n${colors.green}✅ All chunks within budget!${colors.reset}`);
  }

  console.log('\n');

  // Возвращаем код ошибки если есть нарушения
  return violations.length > 0 ? 1 : 0;
}

// Запуск
const exitCode = analyzeBuild();
process.exit(exitCode);
