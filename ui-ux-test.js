const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ChatAper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            timestamp: new Date().toISOString(),
            overall_status: 'PENDING',
            quality_score: 0,
            tests: [],
            screenshots: {},
            issues: {
                critical: [],
                high: [],
                medium: [],
                low: []
            },
            recommendations: []
        };
    }

    async initialize() {
        console.log('🚀 Запуск браузера для тестирования UI/UX...');

        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Используем системный Chrome
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--allow-running-insecure-content'
            ]
        });

        this.page = await this.browser.newPage();

        // Настройка обработчиков ошибок
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.addIssue('medium', 'console_error', `Console error: ${msg.text()}`);
            }
        });

        this.page.on('pageerror', error => {
            this.addIssue('high', 'page_error', `Page error: ${error.message}`);
        });

        await this.page.setViewport({ width: 1280, height: 720 });
    }

    async runFullTest() {
        try {
            await this.initialize();

            console.log('📱 Тестирование главной страницы...');
            await this.testHomePage();

            console.log('📱 Тестирование адаптивности...');
            await this.testResponsiveness();

            console.log('🎯 Тестирование доступности...');
            await this.testAccessibility();

            console.log('⚡ Тестирование производительности...');
            await this.testPerformance();

            console.log('🖱️ Тестирование интерактивности...');
            await this.testInteractivity();

            console.log('📊 Генерация отчета...');
            await this.generateReport();

        } catch (error) {
            console.error('❌ Ошибка при тестировании:', error);
            this.addIssue('critical', 'test_failure', `Test execution failed: ${error.message}`);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async testHomePage() {
        const testName = 'home_page_load';
        console.log('  🏠 Загрузка главной страницы...');

        try {
            const startTime = Date.now();
            await this.page.goto('http://localhost:3000', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            const loadTime = Date.now() - startTime;

            // Скриншот главной страницы
            await this.takeScreenshot('home_page_desktop');

            // Проверка основных элементов
            const elements = await this.page.evaluate(() => {
                const results = {};

                // Проверка заголовка
                const title = document.querySelector('h1');
                results.hasTitle = !!title;
                results.titleText = title?.textContent || '';

                // Проверка формы входа
                const usernameInput = document.querySelector('input[placeholder*="НИК"]');
                const roomCodeInput = docu.querySelector('input[placeholder*="КОД"]');
                const submitButton = document.querySelector('button[type="submit"]');

                results.hasUsernameInput = !!usernameInput;
                results.hasRoomCodeInput = !!roomCodeInput;
                results.hasSubmitButton = !!submitButton;

                // Проверка видимости элементов
                results.elementsVisible = {
                    title: title?.offsetWidth > 0 && title?.offsetHeight > 0,
                    usernameInput: usernameInput?.offsetWidth > 0 && usernameInput?.offsetHeight > 0,
                    roomCodeInput: roomCodeInput?.offsetWidth > 0 && roomCodeInput?.offsetHeight > 0,
                    submitButton: submitButton?.offsetWidth > 0 && submitButton?.offsetHeight > 0
                };

                return results;
            });

            const passed = elements.hasTitle && elements.hasUsernameInput &&
                elements.hasRoomCodeInput && elements.hasSubmitButton;

            this.addTestResult(testName, passed ? 'passed' : 'failed', {
                loadTime,
                elements,
                issues: passed ? [] : ['Отсутствуют основные элементы интерфейса']
            });

            if (loadTime > 3000) {
                this.addIssue('medium', 'slow_load', `Медленная загрузка главной страницы: ${loadTime}ms`);
            }

        } catch (error) {
            this.addTestResult(testName, 'failed', { error: error.message });
            this.addIssue('critical', 'page_load_failure', `Не удалось загрузить главную страницу: ${error.message}`);
        }
    }

    async testResponsiveness() {
        const viewports = [
            { width: 1920, height: 1080, name: 'desktop_large' },
            { width: 1366, height: 768, name: 'desktop_medium' },
            { width: 768, height: 1024, name: 'tablet' },
            { width: 375, height: 667, name: 'mobile' },
            { width: 320, height: 568, name: 'mobile_small' }
        ];

        for (const viewport of viewports) {
            console.log(`  📱 Тестирование ${viewport.name} (${viewport.width}x${viewport.height})...`);

            await this.page.setViewport(viewport);
            await this.page.waitForTimeout(1000); // Ждем применения стилей

            // Скриншот для каждого разрешения
            await this.takeScreenshot(`responsive_${viewport.name}`);

            const responsiveIssues = await this.page.evaluate(() => {
                const issues = [];

                // Проверка горизонтального скролла
                if (document.body.scrollWidth > window.innerWidth) {
                    issues.push({
                        type: 'horizontal_scroll',
                        description: 'Появился нежелательный горизонтальный скролл',
                        scrollWidth: document.body.scrollWidth,
                        viewportWidth: window.innerWidth
                    });
                }

                // Проверка элементов, выходящих за границы
                const elements = document.querySelectorAll('*');
                elements.forEach(element => {
                    const rect = element.getBoundingClientRect();
                    if (rect.right > window.innerWidth + 5) { // +5px допуск
                        issues.push({
                            type: 'element_overflow',
                            description: 'Элемент выходит за правую границу экрана',
                            element: element.tagName + (element.className ? '.' + element.className : ''),
                            overflow: rect.right - window.innerWidth
                        });
                    }
                });

                // Проверка размеров кнопок для touch устройств
                if (window.innerWidth <= 768) {
                    const buttons = document.querySelectorAll('button, a, input[type="submit"]');
                    buttons.forEach(button => {
                        const rect = button.getBoundingClientRect();
                        if (rect.width < 44 || rect.height < 44) {
                            issues.push({
                                type: 'small_touch_target',
                                description: 'Кнопка слишком мала для touch устройств (< 44px)',
                                element: button.tagName + (button.className ? '.' + button.className : ''),
                                size: { width: rect.width, height: rect.height }
                            });
                        }
                    });
                }

                return issues;
            });

            this.addTestResult(`responsive_${viewport.name}`,
                responsiveIssues.length === 0 ? 'passed' : 'warning',
                { viewport, issues: responsiveIssues }
            );

            // Добавляем проблемы в общий список
            responsiveIssues.forEach(issue => {
                const severity = issue.type === 'horizontal_scroll' ? 'high' :
                    issue.type === 'small_touch_target' ? 'medium' : 'low';
                this.addIssue(severity, issue.type, `${viewport.name}: ${issue.description}`);
            });
        }
    }

    async testAccessibility() {
        console.log('  ♿ Проверка доступности...');

        const accessibilityIssues = await this.page.evaluate(() => {
            const issues = [];

            // Проверка alt текста для изображений
            document.querySelectorAll('img').forEach(img => {
                if (!img.alt && !img.getAttribute('aria-label')) {
                    issues.push
                    type: 'missing_alt_text',
                        element: img.src || 'unknown image',
                            description: 'Изображение без alt текста'
                });
        }
      });

        // Проверка меток для форм
        document.querySelectorAll('input, select, textarea').forEach(input => {
            const id = input.id;
            const hasLabel = id && document.querySelector(`label[for="${id}"]`);
            const hasAriaLabel = input.getAttribute('aria-label');
            const hasPlaceholder = input.placeholder;

            if (!hasLabel && !hasAriaLabel && !hasPlaceholder) {
    issues.push({
        type: 'missing_form_label',
        element: input.type || input.tagName,
        description: 'Элемент формы без метки или placeholder'
    });
}
        });

// Проверка контрастности (упрощенная)
const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a');
textElements.forEach(element => {
    if (element.textContent.trim()) {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;

        // Простая проверка на очень темный текст на темном фоне
        if (color.includes('rgb(0, 0, 0)') && backgroundColor.includes('rgb(0, 0, 0)')) {
            issues.push({
                type: 'potential_contrast_issue',
                element: element.tagName + (element.className ? '.' + element.className : ''),
                description: 'Возможная проблема с контрастностью'
            });
        }
    }
});

// Проверка keyboard navigation
const focusableElements = document.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);

let keyboardIssues = 0;
focusableElements.forEach(element => {
    if (element.tabIndex < 0 && !element.hasAttribute('tabindex')) {
        keyboardIssues++;
    }
});

if (keyboardIssues > 0) {
    issues.push({
        type: 'keyboard_navigation',
        description: `${keyboardIssues} элементов недоступны для навигации с клавиатуры`
    });
}

return issues;
    });

this.addTestResult('accessibility',
    accessibilityIssues.length === 0 ? 'passed' : 'warning',
    { issues: accessibilityIssues }
);

accessibilityIssues.forEach(issue => {
    const severity = issue.type === 'missing_alt_text' ? 'medium' : 'low';
    this.addIssue(severity, issue.type, issue.description);
});
  }

  async testPerformance() {
    console.log('  ⚡ Анализ производительности...');

    // Получение метрик производительности
    const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        return {
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            resourceCount: performance.getEntriesByType('resource').length
        };
    });

    // Анализ размера страницы
    const resourceSizes = await this.page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        let totalSize = 0;
        const resourceTypes = {};

        resources.forEach(resource => {
            const size = resource.transferSize || 0;
            totalSize += size;

            const type = resource.initiatorType || 'other';
            resourceTypes[type] = (resourceTypes[type] || 0) + size;
        });

        return { totalSize, resourceTypes };
    });

    const performanceIssues = [];

    if (performanceMetrics.loadTime > 3000) {
        performanceIssues.push('Медленная загрузка страницы (> 3s)');
        this.addIssue('medium', 'slow_load', `Время загрузки: ${performanceMetrics.loadTime}ms`);
    }

    if (performanceMetrics.firstContentfulPaint > 2000) {
        performanceIssues.push('Медленный First Contentful Paint (> 2s)');
        this.addIssue('medium', 'slow_fcp', `FCP: ${performanceMetrics.firstContentfulPaint}ms`);
    }

    if (resourceSizes.totalSize > 2 * 1024 * 1024) { // 2MB
        performanceIssues.push('Большой размер страницы (> 2MB)');
        this.addIssue('low', 'large_page_size', `Размер страницы: ${(resourceSizes.totalSize / 1024 / 1024).toFixed(2)}MB`);
    }

    this.addTestResult('performance',
        performanceIssues.length === 0 ? 'passed' : 'warning',
        { metrics: performanceMetrics, resourceSizes, issues: performanceIssues }
    );
}

  async testInteractivity() {
    console.log('  🖱️ Тестирование интерактивности...');

    try {
        // Тест заполнения формы
        await this.page.type('input[placeholder*="НИК"]', 'TestUser');
        await this.page.waitForTimeout(500);

        await this.page.type('input[placeholder*="КОД"]', 'TEST123');
        await this.page.waitForTimeout(500);

        // Проверка состояния кнопки
        const buttonEnabled = await this.page.evaluate(() => {
            const button = document.querySelector('button[type="submit"]');
            return button && !button.disabled;
        });

        // Тест клика по кнопке (но не отправляем форму)
        const clickResponse = await this.page.evaluate(() => {
            const button = document.querySelector('button[type="submit"]');
            if (button) {
                const startTime = Date.now();
                button.focus();
                return Date.now() - startTime;
            }
            return -1;
        });

        const interactivityIssues = [];

        if (!buttonEnabled) {
            interactivityIssues.push('Кнопка отправки не активируется при заполнении полей');
            this.addIssue('high', 'button_not_enabled', 'Кнопка отправки не активируется');
        }

        if (clickResponse > 100) {
            interactivityIssues.push('Медленный отклик на взаимодействие');
            this.addIssue('medium', 'slow_interaction', `Время отклика: ${clickResponse}ms`);
        }

        this.addTestResult('interactivity',
            interactivityIssues.length === 0 ? 'passed' : 'warning',
            { buttonEnabled, clickResponse, issues: interactivityIssues }
        );

    } catch (error) {
        this.addTestResult('interactivity', 'failed', { error: error.message });
        this.addIssue('high', 'interaction_failure', `Ошибка при тестировании интерактивности: ${error.message}`);
    }
}

  async takeScreenshot(name) {
    try {
        const screenshot = await this.page.screenshot({
            fullPage: true,
            type: 'png'
        });

        this.testResults.screenshots[name] = screenshot.toString('base64');

        // Сохраняем скриншот в файл
        const screenshotPath = path.join(__dirname, 'screenshots', `${name}.png`);
        if (!fs.existsSync(path.dirname(screenshotPath))) {
            fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        }
        fs.writeFileSync(screenshotPath, screenshot);

    } catch (error) {
        console.error(`Ошибка при создании скриншота ${name}:`, error);
    }
}

addTestResult(testName, status, data = {}) {
    this.testResults.tests.push({
        name: testName,
        status,
        timestamp: new Date().toISOString(),
        ...data
    });
}

addIssue(severity, type, description) {
    this.testResults.issues[severity].push({
        type,
        description,
        timestamp: new Date().toISOString()
    });
}

  async generateReport() {
    // Подсчет общего качества
    const totalTests = this.testResults.tests.length;
    const passedTests = this.testResults.tests.filter(t => t.status === 'passed').length;
    const failedTests = this.testResults.tests.filter(t => t.status === 'failed').length;

    this.testResults.quality_score = totalTests > 0 ? Math.round((passedTests / totalTests) * 10) : 0;

    // Определение общего статуса
    if (this.testResults.issues.critical.length > 0 || failedTests > 0) {
        this.testResults.overall_status = 'FAIL';
    } else if (this.testResults.issues.high.length > 0) {
        this.testResults.overall_status = 'PASS_WITH_WARNINGS';
    } else {
        this.testResults.overall_status = 'PASS';
    }

    // Генерация рекомендаций
    this.generateRecommendations();

    // Сохранение отчета
    const reportPath = path.join(__dirname, 'ui-ux-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));

    console.log('\n📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ UI/UX:');
    console.log(`📈 Общий балл качества: ${this.testResults.quality_score}/10`);
    console.log(`✅ Статус: ${this.testResults.overall_status}`);
    console.log(`🧪 Тестов выполнено: ${totalTests}`);
    console.log(`✅ Пройдено: ${passedTests}`);
    console.log(`❌ Провалено: ${failedTests}`);
    console.log(`⚠️ Критических проблем: ${this.testResults.issues.critical.length}`);
    console.log(`🔶 Высокоприоритетных проблем: ${this.testResults.issues.high.length}`);
    console.log(`🔸 Среднеприоритетных проблем: ${this.testResults.issues.medium.length}`);
    console.log(`🔹 Низкоприоритетных проблем: ${this.testResults.issues.low.length}`);

    if (this.testResults.recommendations.length > 0) {
        console.log('\n💡 РЕКОМЕНДАЦИИ:');
        this.testResults.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
    }

    console.log(`\n📄 Полный отчет сохранен: ${reportPath}`);
    console.log(`📸 Скриншоты сохранены в папке: ./screenshots/`);
}

generateRecommendations() {
    const recommendations = [];

    // Рекомендации на основе найденных проблем
    if (this.testResults.issues.critical.length > 0) {
        recommendations.push('🚨 Исправьте критические ошибки перед релизом');
    }

    if (this.testResults.issues.high.some(i => i.type === 'slow_load')) {
        recommendations.push('⚡ Оптимизируйте загрузку страницы (сжатие изображений, минификация CSS/JS)');
    }

    if (this.testResults.issues.medium.some(i => i.type === 'horizontal_scroll')) {
        recommendations.push('📱 Исправьте горизонтальный скролл на мобильных устройствах');
    }

    if (this.testResults.issues.medium.some(i => i.type === 'small_touch_target')) {
        recommendations.push('👆 Увеличьте размер кнопок для touch устройств (минимум 44x44px)');
    }

    if (this.testResults.issues.low.some(i => i.type === 'missing_alt_text')) {
        recommendations.push('♿ Добавьте alt текст для изображений для улучшения доступности');
    }

    if (this.testResults.quality_score < 8) {
        recommendations.push('🔧 Проведите дополнительное тестирование и исправление найденных проблем');
    }

    this.testResults.recommendations = recommendations;
}
}

// Запуск тестирования
async function runTests() {
    const tester = new ChatAppUITester();
    await tester.runFullTest();
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = ChatAppUITester;
