#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Анализ производительности проекта...\n');

// Функциянения команд с обработкой ошибок
function runCommand(command, description) {
    console.log(`📊 ${description}...`);
    try {
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ ${description} завершен`);
        return output;
    } catch (error) {
        console.log(`⚠️ ${description} завершен с предупреждениями`);
        return error.stdout || '';
    }
}

// Анализ размера bundle
function analyzeBundleSize() {
    console.log('\n📦 Анализ размера bundle...');

    try {
        // Создаем production build
        runCommand('npm run build', 'Production build');

        // Проверяем размер .next директории
        const nextDir = path.join(process.cwd(), '.next');
        if (fs.existsSync(nextDir)) {
            const stats = fs.statSync(nextDir);
            console.log(`📁 Размер .next директории: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        }

        // Анализируем статические файлы
        const staticDir = path.join(nextDir, 'static');
        if (fs.existsSync(staticDir)) {
            const files = fs.readdirSync(staticDir, { recursive: true });
            console.log(`📄 Количество статических файлов: ${files.length}`);
        }

    } catch (error) {
        console.log('⚠️ Не удалось проанализировать bundle size');
    }
}

// Анализ зависимостей
function analyzeDependencies() {
    console.log('\n📚 Анализ зависимостей...');

    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const deps = Object.keys(packageJson.dependencies || {});
        const devDeps = Object.keys(packageJson.devDependencies || {});

        console.log(`📦 Production зависимостей: ${deps.length}`);
        console.log(`🔧 Dev зависимостей: ${devDeps.length}`);

        // Проверяем на устаревшие зависимости
        console.log('\n🔍 Проверка устаревших зависимостей...');
        try {
            const outdated = execSync('npm outdated --json', { encoding: 'utf8', stdio: 'pipe' });
            const outdatedPackages = JSON.parse(outdated);
            const count = Object.keys(outdatedPackages).length;

            if (count > 0) {
                console.log(`⚠️ Найдено ${count} устаревших пакетов`);
                Object.keys(outdatedPackages).slice(0, 5).forEach(pkg => {
                    const info = outdatedPackages[pkg];
                    console.log(`  - ${pkg}: ${info.current} → ${info.latest}`);
                });
            } else {
                console.log('✅ Все зависимости актуальны');
            }
        } catch (error) {
            console.log('✅ Все зависимости актуальны или проверка недоступна');
        }

    } catch (error) {
        console.log('⚠️ Не удалось проанализировать зависимости');
    }
}

// Анализ кода
function analyzeCode() {
    console.log('\n🔍 Анализ качества кода...');

    try {
        // Подсчет строк кода
        const srcFiles = execSync('find src -name "*.ts" -o -name "*.tsx" | wc -l', { encoding: 'utf8' }).trim();
        const testFiles = execSync('find tests -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l || echo 0', { encoding: 'utf8' }).trim();

        console.log(`📄 TypeScript файлов в src: ${srcFiles}`);
        console.log(`🧪 Тестовых файлов: ${testFiles}`);

        // Анализ покрытия тестами (приблизительный)
        const testCoverage = testFiles > 0 ? Math.min((parseInt(testFiles) / parseInt(srcFiles)) * 100, 100) : 0;
        console.log(`📊 Приблизительное покрытие тестами: ${testCoverage.toFixed(1)}%`);

    } catch (error) {
        console.log('⚠️ Не удалось проанализировать код');
    }
}

// Проверка производительности сборки
function checkBuildPerformance() {
    console.log('\n⏱️ Проверка производительности сборки...');

    try {
        const startTime = Date.now();
        runCommand('npm run type-check', 'Type checking');
        const typeCheckTime = Date.now() - startTime;

        console.log(`⚡ Время проверки типов: ${(typeCheckTime / 1000).toFixed(2)}s`);

        if (typeCheckTime > 30000) {
            console.log('⚠️ Проверка типов занимает много времени (>30s)');
            console.log('💡 Рекомендации:');
            console.log('  - Исключить больше файлов из tsconfig.json');
            console.log('  - Использовать incremental compilation');
            console.log('  - Оптимизировать импорты');
        } else {
            console.log('✅ Производительность проверки типов в норме');
        }

    } catch (error) {
        console.log('⚠️ Не удалось проверить производительность сборки');
    }
}

// Рекомендации по оптимизации
function provideRecommendations() {
    console.log('\n💡 Рекомендации по оптимизации:');

    const recommendations = [
        '🔧 Регулярно обновляйте зависимости',
        '📦 Используйте dynamic imports для тяжелых компонентов',
        '🎯 Настройте bundle analyzer для мониторинга размера',
        '🧪 Поддерживайте покрытие тестами >80%',
        '⚡ Используйте React.memo для оптимизации рендеринга',
        '📊 Мониторьте Core Web Vitals в production',
        '🔍 Регулярно проводите аудит безопасности (npm audit)',
        '📝 Документируйте сложные компоненты и хуки'
    ];

    recommendations.forEach(rec => console.log(`  ${rec}`));
}

// Основная функция
async function main() {
    try {
        analyzeDependencies();
        analyzeCode();
        checkBuildPerformance();
        // analyzeBundleSize(); // Закомментировано, так как может быть медленным
        provideRecommendations();

        console.log('\n🎉 Анализ производительности завершен!');

    } catch (error) {
        console.error('❌ Ошибка при анализе:', error.message);
        process.exit(1);
    }
}

main();
