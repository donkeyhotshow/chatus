const puppeteer = require('puppeteer');
const fs = require('fs');
unction testUI() {
    console.log('🚀 Запуск UI тестирования...');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            args: ['--no-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        console.log('📱 Загрузка главной страницы...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Скриншот главной страницы
        await page.screenshot({ path: 'desktop-1280x720.png', fullPage: true });
        console.log('✅ Скриншот desktop сохранен');

        // Тест мобильной версии
        console.log('📱 Тестирование мобильной версии...');
        await page.setViewport({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'mobile-375x667.png', fullPage: true });
        console.log('✅ Скриншот mobile сохранен');

        // Тест планшетной версии
        console.log('📱 Тестирование планшетной версии...');
        await page.setViewport({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'tablet-768x1024.png', fullPage: true });
        console.log('✅ Скриншот tablet сохранен');

        // Проверка основных элементов
        console.log('🔍 Проверка элементов интерфейса...');
        const elements = await page.evaluate(() => {
            const title = document.querySelector('h1');
            const usernameInput = document.querySelector('input[placeholder*="НИК"]');
            const roomCodeInput = document.querySelector('input[placeholder*="КОД"]');
            const submitButton = document.querySelector('button[type="submit"]');

            return {
                hasTitle: !!title,
                titleText: title ? title.textContent : '',
                hasUsernameInput: !!usernameInput,
                hasRoomCodeInput: !!roomCodeInput,
                hasSubmitButton: !!submitButton,
                submitButtonEnabled: submitButton ? !submitButton.disabled : false
            };
        });

        console.log('📊 Результаты проверки элементов:');
        console.log('  Заголовок:', elements.hasTitle ? '✅' : '❌', elements.titleText);
        console.log('  Поле ника:', elements.hasUsernameInput ? '✅' : '❌');
        console.log('  Поле кода комнаты:', elements.hasRoomCodeInput ? '✅' : '❌');
        console.log('  Кнопка отправки:', elements.hasSubmitButton ? '✅' : '❌');

        // Тест заполнения формы
        console.log('🖱️ Тестирование интерактивности...');
        await page.type('input[placeholder*="НИК"]', 'TestUser');
        await page.type('input[placeholder*="КОД"]', 'TEST123');

        const buttonEnabledAfterInput = await page.evaluate(() => {
            const button = document.querySelector('button[type="submit"]');
            return button ? !button.disabled : false;
        });

        console.log('  Кнопка активна после ввода:', buttonEnabledAfterInput ? '✅' : '❌');

        // Проверка адаптивности
        console.log('📱 Проверка адаптивности...');
        const viewports = [
            { width: 320, height: 568, name: 'Mobile Small' },
            { width: 375, height: 667, name: 'Mobile' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 1366, height: 768, name: 'Desktop' }
        ];

        const responsiveResults = [];
        for (const viewport of viewports) {
            await page.setViewport(viewport);
            await page.waitForTimeout(500);

            const hasHorizontalScroll = await page.evaluate(() => {
                return document.body.scrollWidth > window.innerWidth;
            });

            responsiveResults.push({
                name: viewport.name,
                size: `${viewport.width}x${viewport.height}`,
                hasHorizontalScroll
            });

            console.log(`  ${viewport.name} (${viewport.width}x${viewport.height}):`,
                hasHorizontalScroll ? '❌ Горизонтальный скролл' : '✅ OK');
        }

        // Генерация отчета
        const report = {
            timestamp: new Date().toISOString(),
            elements,
            responsiveResults,
            interactivity: {
                buttonEnabledAfterInput
            },
            screenshots: [
                'desktop-1280x720.png',
                'mobile-375x667.png',
                'tablet-768x1024.png'
            ]
        };

        fs.writeFileSync('ui-test-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Отчет сохранен в ui-test-report.json');
        console.log('📸 Скриншоты сохранены в текущей папке');

        // Подсчет общего результата
        const totalChecks = 4; // title, username, roomcode, submit button
        const passedChecks = [
            elements.hasTitle,
            elements.hasUsernameInput,
            elements.hasRoomCodeInput,
            elements.hasSubmitButton
        ].filter(Boolean).length;

        const score = Math.round((passedChecks / totalChecks) * 10);
        console.log(`\n📊 ОБЩИЙ РЕЗУЛЬТАТ: ${score}/10`);

        if (score >= 8) {
            console.log('✅ UI/UX тестирование пройдено успешно!');
        } else {
            console.log('⚠️ Обнаружены проблемы в UI/UX');
        }

    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testUI();
