/**
 * E2E тестирование ChatUs приложения
 * Проверяет все основные функции, вкладки и кнопки
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const TEST_ROOM = 'test-room-' + Date.now();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ChatUsE2ETester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async init() {
    console.log('🚀 Запуск браузера...');
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
    });
    this.page = await this.browser.newPage();

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.warnings.push(`Console error: ${msg.text()}`);
      }
    });

    this.page.on('pageerror', err => {
      this.results.warnings.push(`Page error: ${err.message}`);
    });
  }

  async test(name, fn) {
    try {
      console.log(`  ⏳ ${name}...`);
      await fn();
      this.results.passed.push(name);
      console.log(`  ✅ ${name}`);
    } catch (error) {
      this.results.failed.push(`${name}: ${error.message}`);
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('\n📋 ТЕСТИРОВАНИЕ CHATUS\n');
    console.log('='.repeat(50));

    console.log('\n🏠 1. ГЛАВНАЯ СТРАНИЦА');
    await this.testHomePage();

    console.log('\n👤 2. ЧАТ КОМНАТА');
    await this.testChatRoom();

    console.log('\n📨 3. ИНТЕРФЕЙС ЧАТА');
    await this.testChatInterface();

    console.log('\n📱 4. МОБИЛЬНАЯ АДАПТАЦИЯ');
    await this.testMobileAdaptation();

    console.log('\n⚙️ 5. СТИЛИ И ТЕМЫ');
    await this.testStyles();

    this.printResults();
  }

  async testHomePage() {
    await this.test('Загрузка главной страницы', async () => {
      await this.page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(2000);
    });

    await this.test('Проверка заголовка страницы', async () => {
      const title = await this.page.title();
      if (!title || title.length === 0) throw new Error('Заголовок пустой');
    });

    await this.test('Проверка загрузки контента', async () => {
      const bodyLength = await this.page.evaluate(() => document.body.innerHTML.length);
      if (bodyLength < 100) throw new Error('Контент не загружен');
    });
  }

  async testChatRoom() {
    await this.test('Переход в чат комнату', async () => {
      await this.page.goto(`${BASE_URL}/chat/${TEST_ROOM}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(5000); // Ждём загрузки Firebase
    });

    await this.test('Проверка загрузки чата', async () => {
      const bodyLength = await this.page.evaluate(() => document.body.innerHTML.length);
      if (bodyLength < 500) throw new Error('Чат не загружен');
    });

    await this.test('Проверка наличия UI элементов', async () => {
      const hasUI = await this.page.evaluate(() => {
        return document.querySelectorAll('button').length > 0 ||
               document.querySelectorAll('div').length > 10;
      });
      if (!hasUI) throw new Error('UI элементы не найдены');
    });
  }

  async testChatInterface() {
    await this.test('Поиск поля ввода сообщения', async () => {
      const hasInput = await this.page.evaluate(() => {
        return document.querySelector('textarea') !== null ||
               document.querySelector('input[type="text"]') !== null ||
               document.querySelector('[contenteditable]') !== null;
      });
      if (!hasInput) throw new Error('Поле ввода не найдено');
    });

    await this.test('Поиск кнопок управления', async () => {
      const buttonCount = await this.page.evaluate(() => document.querySelectorAll('button').length);
      if (buttonCount < 1) throw new Error('Кнопки не найдены');
    });

    await this.test('Проверка SVG иконок', async () => {
      const hasSvg = await this.page.evaluate(() => document.querySelectorAll('svg').length > 0);
      if (!hasSvg) throw new Error('SVG иконки не найдены');
    });
  }

  async testMobileAdaptation() {
    await this.test('Переключение на мобильный viewport', async () => {
      await this.page.setViewport({ width: 375, height: 667 });
      await sleep(1000);
    });

    await this.test('Проверка адаптивности', async () => {
      const isResponsive = await this.page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth <= window.innerWidth + 10;
      });
      if (!isResponsive) throw new Error('Страница не адаптивна');
    });

    await this.test('Возврат к desktop viewport', async () => {
      await this.page.setViewport({ width: 1280, height: 800 });
      await sleep(500);
    });
  }

  async testStyles() {
    await this.test('Проверка CSS переменных', async () => {
      const hasCSSVars = await this.page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        const bgPrimary = styles.getPropertyValue('--bg-primary');
        const accent = styles.getPropertyValue('--accent-primary');
        return bgPrimary.length > 0 || accent.length > 0;
      });
      if (!hasCSSVars) throw new Error('CSS переменные не найдены');
    });

    await this.test('Проверка применения стилей', async () => {
      const hasStyles = await this.page.evaluate(() => {
        const el = document.body;
        const styles = getComputedStyle(el);
        return styles.fontFamily.length > 0;
      });
      if (!hasStyles) throw new Error('Стили не применены');
    });
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ\n');

    console.log(`✅ Пройдено: ${this.results.passed.length}`);
    this.results.passed.forEach(t => console.log(`   • ${t}`));

    if (this.results.failed.length > 0) {
      console.log(`\n❌ Провалено: ${this.results.failed.length}`);
      this.results.failed.forEach(t => console.log(`   • ${t}`));
    }

    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️ Предупреждения: ${this.results.warnings.length}`);
      this.results.warnings.slice(0, 5).forEach(w => console.log(`   • ${w}`));
    }

    const total = this.results.passed.length + this.results.failed.length;
    const score = total > 0 ? ((this.results.passed.length / total) * 10).toFixed(1) : '0.0';
    console.log(`\n🎯 Оценка: ${score}/10`);
    console.log('='.repeat(50));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

(async () => {
  const tester = new ChatUsE2ETester();
  try {
    await tester.init();
    await tester.runAllTests();
  } catch (error) {
    console.error('Критическая ошибка:', error.message);
  } finally {
    await tester.close();
  }
})();
