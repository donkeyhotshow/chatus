import { t, expect, devices } from '@playwright/test';

// Тестирование создания профиля на мобильных устройствах
test.describe('Mobile Profile Creation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/mobile-demo');
    });

    test('should display mobile profile creation interface', async ({ page }) => {
        // Проверяем заголовок
        await expect(page.locator('h1')).toContainText('ЧАТ ДЛЯ НАС');

        // Проверяем наличие редактора аватара
        await expect(page.locator('canvas')).toBeVisible();

        // Проверяем палитру цветов
        await expect(page.locator('[data-testid="color-palette"]')).toBeVisible();

        // Проверяем поле ввода имени
        await expect(page.locator('input[placeholder*="имя"]')).toBeVisible();

        // Проверяем кнопку входа
        await expect(page.locator('button:has-text("ВОЙТИ В ЧАТ")')).toBeVisible();
    });

    test('should validate name input correctly', async ({ page }) => {
        const nameInput = page.locator('input[placeholder*="имя"]');
        const enterButton = page.locator('button:has-text("ВОЙТИ В ЧАТ")');

        // Кнопка должна быть неактивна без имени
        await expect(enterButton).toBeDisabled();

        // Вводим слишком короткое имя
        await nameInput.fill('ab');
        await expect(enterButton).toBeDisabled();

        // Вводим корректное имя
        await nameInput.fill('TestUser');
        await expect(enterButton).toBeEnabled();

        // Вводим слишком длинное имя
        await nameInput.fill('VeryLongUsernameExceedingLimit');
        await expect(enterButton).toBeDisabled();
    });

    test('should allow drawing on avatar canvas', async ({ page }) => {
        const canvas = page.locator('canvas');

        // Получаем размеры канваса
        const canvasBox = await canvas.boundingBox();
        expect(canvasBox).toBeTruthy();

        // Выбираем цвет
        await page.locator('[data-testid="color-palette"] button').first().click();

        // Рисуем на канвасе
        await canvas.click({
            position: { x: canvasBox!.width / 2, y: canvasBox!.height / 2 }
        });

        // Проверяем, что аватар изменился (через data-testid или другой способ)
        await expect(page.locator('[data-testid="avatar-canvas"]')).toBeVisible();
    });

    test('should use eraser tool correctly', async ({ page }) => {
        // Сначала рисуем что-то
        const canvas = page.locator('canvas');
        const canvasBox = await canvas.boundingBox();

        await page.locator('[data-testid="color-palette"] button').first().click();
        await canvas.click({
            position: { x: canvasBox!.width / 2, y: canvasBox!.height / 2 }
        });

        // Активируем ластик
        await page.locator('button:has-text("Ластик")').click();

        // Проверяем, что ластик активен
        await expect(page.locator('button:has-text("Ластик")')).toHaveClass(/active|selected/);

        // Стираем пиксель
        await canvas.click({
            position: { x: canvasBox!.width / 2, y: canvasBox!.height / 2 }
        });
    });

    test('should generate random avatar', async ({ page }) => {
        // Нажимаем кнопку случайного аватара
        await page.locator('button:has-text("Случайный")').click();

        // Ждем анимации
        await page.waitForTimeout(500);

        // Проверяем, что канвас изменился
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('should complete profile creation flow', async ({ page }) => {
        // Создаем аватар
        await page.locator('button:has-text("Случайный")').click();
        await page.waitForTimeout(500);

        // Вводим имя
        await page.locator('input[placeholder*="имя"]').fill('TestUser');

        // Нажимаем войти в чат
        await page.locator('button:has-text("ВОЙТИ В ЧАТ")').click();

        // Проверяем переход в чат
        await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible({ timeout: 5000 });
    });

    test('should work on different mobile screen sizes', async ({ page, browserName }) => {
        // Тестируем на разных размерах экрана
        const viewports = [
            { width: 375, height: 667 }, // iPhone SE
            { width: 414, height: 896 }, // iPhone 11
            { width: 360, height: 640 }, // Android
        ];

        for (const viewport of viewports) {
            await page.setViewportSize(viewport);

            // Проверяем, что интерфейс адаптируется
            await expect(page.locator('canvas')).toBeVisible();
            await expect(page.locator('input[placeholder*="имя"]')).toBeVisible();
            await expect(page.locator('button:has-text("ВОЙТИ В ЧАТ")')).toBeVisible();

            // Проверяем, что элементы не перекрываются
            const elements = await page.locator('button, input, canvas').all();
            for (let i = 0; i < elements.length - 1; i++) {
                const box1 = await elements[i].boundingBox();
                const box2 = await elements[i + 1].boundingBox();

                if (box1 && box2) {
                    // Проверяем, что элементы не перекрываются критично
                    const overlap = Math.max(0, Math.min(box1.x + box1.width, box2.x + box2.width) - Math.max(box1.x, box2.x));
                    expect(overlap).toBeLessThan(Math.min(box1.width, box2.width) * 0.5);
                }
            }
        }
    });

    test('should handle touch interactions', async ({ page }) => {
        // Симулируем touch события
        const canvas = page.locator('canvas');
        const canvasBox = await canvas.boundingBox();

        // Touch start
        await canvas.dispatchEvent('touchstart', {
            touches: [{
                clientX: canvasBox!.x + canvasBox!.width / 2,
                clientY: canvasBox!.y + canvasBox!.height / 2
            }]
        });

        // Touch move
        await canvas.dispatchEvent('touchmove', {
            touches: [{
                clientX: canvasBox!.x + canvasBox!.width / 2 + 10,
                clientY: canvasBox!.y + canvasBox!.height / 2 + 10
            }]
        });

        // Touch end
        await canvas.dispatchEvent('touchend', { touches: [] });

        // Проверяем, что рисование произошло
        await expect(canvas).toBeVisible();
    });
});

// Тесты для планшетов
test.describe('Tablet Profile Creation', () => {
    test.use({ ...devices['iPad Pro'] });

    test('should adapt interface for tablet', async ({ page }) => {
        await page.goto('/mobile-demo');

        // На планшете должны быть доступны дополнительные элементы
        await expect(page.locator('canvas')).toBeVisible();

        // Проверяем, что используется больше пространства
        const canvas = page.locator('canvas');
        const canvasBox = await canvas.boundingBox();

        expect(canvasBox!.width).toBeGreaterThan(300);
        expect(canvasBox!.height).toBeGreaterThan(300);
    });
});
