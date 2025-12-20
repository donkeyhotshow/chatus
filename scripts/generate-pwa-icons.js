// Скрипт для генерации PWA иконок
// Запуск: node scripts/generate-pwa-icons.js
const fs = require('fs');
const path = require('path');

// Создаем базовые иконки для PWA (заглушки)
const iconSizes = [32, 72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');
const publicDir = path.join(__dirname, '../public');

// Создаем директорию если не существует
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG шаблон для иконки
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <rect x="${size * 0.2}" y="${size * 0.2}" width="${size * 0.6}" height="${size * 0.6}" rx="${size * 0.1}" fill="white" opacity="0.9"/>
  <circle cx="${size * 0.35}" cy="${size * 0.4}" r="${size * 0.05}" fill="#06b6d4"/>
  <circle cx="${size * 0.65}" cy="${size * 0.4}" r="${size * 0.05}" fill="#06b6d4"/>
  <path d="M ${size * 0.35} ${size * 0.6} Q ${size * 0.5} ${size * 0.7} ${size * 0.65} ${size * 0.6}" stroke="#06b6d4" stroke-width="${size * 0.02}" fill="none"/>
</svg>`;

// Генерируем иконки в /public/icons/
iconSizes.forEach(size => {
  const svg = createIconSVG(size);

  // SVG в icons/
  fs.writeFileSync(
    path.join(iconsDir, `icon-${size}x${size}.svg`),
    svg.trim()
  );

  // PNG заглушка в icons/ (SVG с расширением .png для совместимости)
  fs.writeFileSync(
    path.join(iconsDir, `icon-${size}x${size}.png`),
    svg.trim()
  );

  console.log(`Generated icon-${size}x${size}.png`);
});

// Создаем иконки в корне /public/ для service worker
const rootIcons = [72, 192, 512];
rootIcons.forEach(size => {
  const svg = createIconSVG(size);
  fs.writeFileSync(
    path.join(publicDir, `icon-${size}.png`),
    svg.trim()
  );
});

// Badge иконка
const badgeSvg = createIconSVG(72);
fs.writeFileSync(path.join(publicDir, 'badge-72.png'), badgeSvg.trim());
fs.writeFileSync(path.join(iconsDir, 'badge-72x72.png'), badgeSvg.trim());

// Создаем apple-touch-icon
const appleTouchIcon = createIconSVG(180);
fs.writeFileSync(
  path.join(iconsDir, 'apple-touch-icon.svg'),
  appleTouchIcon.trim()
);
fs.writeFileSync(
  path.join(iconsDir, 'apple-touch-icon.png'),
  appleTouchIcon.trim()
);

// Создаем favicon
const favicon = createIconSVG(32);
fs.writeFileSync(
  path.join(publicDir, 'favicon.svg'),
  favicon.trim()
);

console.log('✅ PWA icons generated successfully!');
console.log('📝 Note: In production, convert SVG files to PNG format');
