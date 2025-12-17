#!/usr/bin/env node

// Скрипт проверки готовности к деплою
const fe('fs');
const path = require('path');

console.log('🔍 Проверка готовности к деплою...\n');

const checks = [];

// Проверка 1: Наличие манифеста PWA
const manifestPath = path.join(__dirname, '../public/manifest.json');
if (fs.existsSync(manifestPath)) {
    checks.push({ name: 'PWA Manifest', status: '✅', details: 'manifest.json найден' });
} else {
    checks.push({ name: 'PWA Manifest', status: '❌', details: 'manifest.json отсутствует' });
}

// Проверка 2: Наличие Service Worker
const swPath = path.join(__dirname, '../public/sw.js');
if (fs.existsSync(swPath)) {
    checks.push({ name: 'Service Worker', status: '✅', details: 'sw.js найден' });
} else {
    checks.push({ name: 'Service Worker', status: '❌', details: 'sw.js отсутствует' });
}

// Проверка 3: Наличие иконок PWA
const iconsDir = path.join(__dirname, '../public/icons');
const requiredIcons = ['icon-192x192.svg', 'icon-512x512.svg', 'apple-touch-icon.svg'];
let iconsFound = 0;

if (fs.existsSync(iconsDir)) {
    const iconFiles = fs.readdirSync(iconsDir);
    requiredIcons.forEach(icon => {
        if (iconFiles.includes(icon)) iconsFound++;
    });
}

if (iconsFound === requiredIcons.length) {
    checks.push({ name: 'PWA Icons', status: '✅', details: `${iconsFound}/${requiredIcons.length} иконок найдено` });
} else {
    checks.push({ name: 'PWA Icons', status: '⚠️', details: `${iconsFound}/${requiredIcons.length} иконок найдено` });
}

// Проверка 4: Мобильные компоненты
const mobileComponents = [
    'src/components/mobile/MobileApp.tsx',
    'src/components/mobile/MobileProfileCreation.tsx',
    'src/components/mobile/MobileChatInterface.tsx',
    'src/components/mobile/MobilePixelAvatarEditor.tsx'
];

let mobileComponentsFound = 0;
mobileComponents.forEach(component => {
    if (fs.existsSync(path.join(__dirname, '..', component))) {
        mobileComponentsFound++;
    }
});

if (mobileComponentsFound === mobileComponents.length) {
    checks.push({ name: 'Mobile Components', status: '✅', details: `${mobileComponentsFound}/${mobileComponents.length} компонентов найдено` });
} else {
    checks.push({ name: 'Mobile Components', status: '❌', details: `${mobileComponentsFound}/${mobileComponents.length} компонентов найдено` });
}

// Проверка 5: Система тем
const themeSystemPath = path.join(__dirname, '../src/lib/theme-system.ts');
if (fs.existsSync(themeSystemPath)) {
    checks.push({ name: 'Theme System', status: '✅', details: 'Система тем найдена' });
} else {
    checks.push({ name: 'Theme System', status: '❌', details: 'Система тем отсутствует' });
}

// Проверка 6: PWA хуки
const pwaHookPath = path.join(__dirname, '../src/hooks/use-pwa.tsx');
if (fs.existsSync(pwaHookPath)) {
    checks.push({ name: 'PWA Hooks', status: '✅', details: 'PWA хуки найдены' });
} else {
    checks.push({ name: 'PWA Hooks', status: '❌', details: 'PWA хуки отсутствуют' });
}

// Проверка 7: Демо страницы
const demoPages = [
    'src/app/mobile-demo/page.tsx',
    'src/app/enhanced-demo/page.tsx'
];

let demoPagesFound = 0;
demoPages.forEach(page => {
    if (fs.existsSync(path.join(__dirname, '..', page))) {
        demoPagesFound++;
    }
});

if (demoPagesFound === demoPages.length) {
    checks.push({ name: 'Demo Pages', status: '✅', details: `${demoPagesFound}/${demoPages.length} страниц найдено` });
} else {
    checks.push({ name: 'Demo Pages', status: '⚠️', details: `${demoPagesFound}/${demoPages.length} страниц найдено` });
}

// Вывод результатов
console.log('📋 Результаты проверки:\n');
checks.forEach(check => {
    console.log(`${check.status} ${check.name}: ${check.details}`);
});

// Подсчет статистики
const passed = checks.filter(c => c.status === '✅').length;
const warnings = checks.filter(c => c.status === '⚠️').length;
const failed = checks.filter(c => c.status === '❌').length;

console.log('\n📊 Статистика:');
console.log(`✅ Пройдено: ${passed}`);
console.log(`⚠️ Предупреждения: ${warnings}`);
console.log(`❌ Ошибки: ${failed}`);

if (failed === 0) {
    console.log('\n🎉 Готово к деплою!');
    process.exit(0);
} else {
    console.log('\n🚨 Есть критические ошибки. Исправьте их перед деплоем.');
    process.exit(1);
}
