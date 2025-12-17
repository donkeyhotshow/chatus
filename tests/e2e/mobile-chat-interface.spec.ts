import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Chat Interface', () => {
    test.beforeEach(async ({ page }) => {
        // Сначала сорофиль
        await page.goto('/mobile-demo');

        // Быстрое создание профиля для тестов
        await page.locator('button:has-text("Случайный")').click();
        await page.waitForTimeout(500);
        await page.locator('input[placeholder*="имя"]').fill('TestUser');
        await page.locator('button:has-text("ВОЙТИ В ЧАТ")').click();

        // Ждем загрузки чата
        await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible({ timeout: 5000 });
    });

    test('should display chat interface correctly', async ({ page }) => {
        // Проверяем основные элементы чата
        await expect(page.locator('[data-testid="chat-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="messages-area"]')).toBeVisible();
        await expect(page.locator('[data-testid="input-area"]')).toBeVisible();

        // Проверяем кнопки в шапке
        await expect(page.locator('button[aria-label="Назад"]')).toBeVisible();
        await expect(page.locator('button[aria-label="Участники"]')).toBeVisible();
        await expect(page.locator('button[aria-label="Настройки"]')).toBeVisible();
    });

    test('should send message correctly', async ({ page }) => {
        const messageInput = page.locator('textarea[placeholder*="сообщение"]');
        const sendButton = page.locator('button[aria-label="Отправить"]');

        // Вводим сообщение
        await messageInput.fill('Тестовое сообщение');

        // Кнопка отправки должна появиться
        await expect(sendButton).toBeVisible();

        // Отправляем сообщение
        await sendButton.click();

        // Проверяем, что сообщение появилось в чате
        await expect(page.locator('[data-testid="message"]:has-text("Тестовое сообщение")')).toBeVisible();

        // Поле ввода должно очиститься
        await expect(messageInput).toHaveValue('');
    });

    test('should handle multiline messages', async ({ page }) => {
        const messageInput = page.locator('textarea[placeholder*="сообщение"]');

        // Вводим многострочное сообщение
        const multilineMessage = 'Первая строка\nВторая строка\nТретья строка';
        await messageInput.fill(multilineMessage);

        // Проверяем, что поле ввода расширилось
        const inputBox = await messageInput.boundingBox();
        expect(inputBox!.height).toBeGreaterThan(48); // Больше минимальной высоты

        // Отправляем сообщение
        await page.locator('button[aria-label="Отправить"]').click();

        // Проверяем, что сообщение отображается корректно
        await expect(page.locator('[data-testid="message"]').last()).toContainText('Первая строка');
    });

    test('should handle voice message recording', async ({ page }) => {
        const micButton = page.locator('button[aria-label*="голосовое"]');

        // Начинаем запись (долгое нажатие)
        await micButton.hover();
        await page.mouse.down();

        // Проверяем индикатор записи
        await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();

        // Ждем немного
        await page.waitForTimeout(1000);

        // Заканчиваем запись
        await page.mouse.up();

        // Индикатор записи должен исчезнуть
        await expect(page.locator('[data-testid="recording-indicator"]')).not.toBeVisible();
    });

    test('should open participants panel', async ({ page }) => {
        // Нажимаем кнопку участников
        await page.locator('button[aria-label="Участники"]').click();

        // Проверяем, что панель открылась
        await expect(page.locator('[data-testid="participants-panel"]')).toBeVisible();

        // Проверяем список участников
        await expect(page.locator('[data-testid="participant-item"]')).toHaveCount.greaterThan(0);

        // Закрываем панель
        await page.locator('button[aria-label="Закрыть"]').click();
        await expect(page.locator('[data-testid="participants-panel"]')).not.toBeVisible();
    });

    test('should open settings panel', async ({ page }) => {
        // Нажимаем кнопку настроек
        await page.locator('button[aria-label="Настройки"]').click();

        // Проверяем, что панель настроек открылась
        await expect(page.locator('[data-testid="settings-panel"]')).toBeVisible();

        // Проверяем основные секции настроек
        await expect(page.locator('text=Уведомления')).toBeVisible();
        await expect(page.locator('text=Внешний вид')).toBeVisible();
        await expect(page.locator('text=Приватность')).toBeVisible();
    });

    test('should handle swipe gestures on messages', async ({ page }) => {
        // Сначала отправляем сообщение
        await page.locator('textarea[placeholder*="сообщение"]').fill('Сообщение для свайпа');
        await page.locator('button[aria-label="Отправить"]').click();

        const message = page.locator('[data-testid="message"]').last();
        await expect(message).toBeVisible();

        // Симулируем свайп вправо (ответ)
        const messageBox = await message.boundingBox();
        await page.mouse.move(messageBox!.x + 10, messageBox!.y + messageBox!.height / 2);
        await page.mouse.down();
        await page.mouse.move(messageBox!.x + 100, messageBox!.y + messageBox!.height / 2);
        await page.mouse.up();

        // Проверяем, что появилась возможность ответить
        // (зависит от реализации - может быть индикатор или сразу поле ответа)
    });

    test('should show context menu on long press', async ({ page }) => {
        // Отправляем сообщение
        await page.locator('textarea[placeholder*="сообщение"]').fill('Сообщение для контекстного меню');
        await page.locator('button[aria-label="Отправить"]').click();

        const message = page.locator('[data-testid="message"]').last();
        await expect(message).toBeVisible();

        // Долгое нажатие на сообщение
        await message.hover();
        await page.mouse.down();
        await page.waitForTimeout(500); // Долгое нажатие
        await page.mouse.up();

        // Проверяем появление контекстного меню
        await expect(page.locator('[data-testid="context-menu"]')).toBeVisible();

        // Проверяем опции меню
        await expect(page.locator('button:has-text("Ответить")')).toBeVisible();
        await expect(page.locator('button:has-text("Копировать")')).toBeVisible();
        await expect(page.locator('button:has-text("Переслать")')).toBeVisible();
    });

    test('should handle keyboard appearance', async ({ page }) => {
        const messageInput = page.locator('textarea[placeholder*="сообщение"]');

        // Получаем начальную высоту viewport
        const initialViewport = page.viewportSize();

        // Фокусируемся на поле ввода (вызывает клавиатуру на мобильных)
        await messageInput.click();

        // На реальных мобильных устройствах viewport изменится
        // В тестах можем симулировать это
        await page.setViewportSize({
            width: initialViewport!.width,
            height: initialViewport!.height - 300
        });

        // Проверяем, что интерфейс адаптировался
        await expect(messageInput).toBeVisible();
        await expect(page.locator('[data-testid="messages-area"]')).toBeVisible();
    });

    test('should scroll messages correctly', async ({ page }) => {
        // Отправляем много сообщений для создания прокрутки
        for (let i = 1; i <= 20; i++) {
            await page.locator('textarea[placeholder*="сообщение"]').fill(`Сообщение ${i}`);
            await page.locator('button[aria-label="Отправить"]').click();
            await page.waitForTimeout(100);
        }

        // Проверяем, что последнее сообщение видно
        await expect(page.locator('[data-testid="message"]:has-text("Сообщение 20")')).toBeVisible();

        // Прокручиваем вверх
        await page.locator('[data-testid="messages-area"]').hover();
        await page.mouse.wheel(0, -500);

        // Проверяем, что видны более ранние сообщения
        await expect(page.locator('[data-testid="message"]:has-text("Сообщение 1")')).toBeVisible();
    });

    test('should maintain connection status', async ({ page }) => {
        // Проверяем индикатор подключения
        await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();

        // Симулируем потерю соединения
        await page.route('**/*', route => route.abort());

        // Проверяем, что статус изменился на офлайн
        await expect(page.locator('[data-testid="connection-status"][data-status="offline"]')).toBeVisible();

        // Восстанавливаем соединение
        await page.unroute('**/*');

        // Проверяем восстановление статуса
        await expect(page.locator('[data-testid="connection-status"][data-status="online"]')).toBeVisible();
    });
});

// Тесты производительности
test.describe('Mobile Chat Performance', () => {
    test('should load chat interface quickly', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/mobile-demo');

        // Быстрое создание профиля
        await page.locator('button:has-text("Случайный")').click();
        await page.locator('input[placeholder*="имя"]').fill('PerfTest');
        await page.locator('button:has-text("ВОЙТИ В ЧАТ")').click();

        // Ждем полной загрузки чата
        await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(5000); // Должно загружаться менее чем за 5 секунд
    });

    test('should handle rapid message sending', async ({ page }) => {
        await page.goto('/mobile-demo');

        // Создаем профиль
        await page.locator('button:has-text("Случайный")').click();
        await page.locator('input[placeholder*="имя"]').fill('SpeedTest');
        await page.locator('button:has-text("ВОЙТИ В ЧАТ")').click();
        await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

        // Быстро отправляем много сообщений
        const messageInput = page.locator('textarea[placeholder*="сообщение"]');
        const sendButton = page.locator('button[aria-label="Отправить"]');

        for (let i = 1; i <= 10; i++) {
            await messageInput.fill(`Быстрое сообщение ${i}`);
            await sendButton.click();
            // Минимальная задержка
            await page.waitForTimeout(50);
        }

        // Проверяем, что все сообщения отправились
        await expect(page.locator('[data-testid="message"]')).toHaveCount(10);
    });
});
