/**
 * Система динамического тематизирования на основе аватара пользователя
 */

interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
}

interface DominantColors {
    dominant: string;
    secondary: string;
    accent: string;
}

/**
 * Извлекает доминирующие цвета из изображения аватара
 */
export function extractColorsFromAvatar(imageData: string): Promise<DominantColors> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(getDefaultColors());
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const colors = analyzeImageColors(imageData);

            resolve(colors);
        };

        img.onerror = () => resolve(getDefaultColors());
        img.src = imageData;
    });
}

/**
 * Анализирует цвета в изображении и возвращает доминирующие
 */
function analyzeImageColors(imageData: ImageData): DominantColors {
    const data = imageData.data;
    const colorCounts: { [key: string]: number } = {};
    const step = 4; // Анализируем каждый 4-й пиксель для производительности

    // Подсчитываем частоту цветов
    for (let i = 0; i < data.length; i += step * 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Игнорируем прозрачные и очень темные пиксели
        if (a < 128 || (r < 30 && g < 30 && b < 30)) continue;

        // Группируем похожие цвета
        const groupedColor = groupSimilarColors(r, g, b);
        const colorKey = `${groupedColor.r},${groupedColor.g},${groupedColor.b}`;

        colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
    }

    // Сортируем цвета по частоте
    const sortedColors = Object.entries(colorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([color]) => {
            const [r, g, b] = color.split(',').map(Number);
            return { r, g, b };
        });

    if (sortedColors.length === 0) {
        return getDefaultColors();
    }

    // Выбираем доминирующий, вторичный и акцентный цвета
    const dominant = rgbToHex(sortedColors[0]);
    const secondary = sortedColors.length > 1 ? rgbToHex(sortedColors[1]) : adjustBrightness(dominant, -20);
    const accent = findComplementaryColor(dominant);

    return { dominant, secondary, accent };
}

/**
 * Группирует похожие цвета для уменьшения шума
 */
function groupSimilarColors(r: number, g: number, b: number, threshold = 30) {
    return {
        r: Math.floor(r / threshold) * threshold,
        g: Math.floor(g / threshold) * threshold,
        b: Math.floor(b / threshold) * threshold
    };
}

/**
 * Находит комплементарный цвет
 */
function findComplementaryColor(hexColor: string): string {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return hexColor;

    // Поворачиваем на 180 градусов в цветовом круге
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const complementaryHue = (hsl.h + 180) % 360;

    return hslToHex(complementaryHue, Math.min(hsl.s, 70), Math.max(hsl.l, 40));
}

/**
 * Создает цветовую палитру на основе доминирующих цветов
 */
export function createDynamicPalette(colors: DominantColors): ColorPalette {
    const { dominant, secondary, accent } = colors;

    return {
        primary: dominant,
        secondary: secondary,
        accent: accent,
        background: adjustBrightness(dominant, -80),
        text: getContrastColor(dominant)
    };
}

/**
 * Применяет динамическую тему к CSS переменным
 */
export function applyDynamicTheme(palette: ColorPalette) {
    const root = document.documentElement;

    root.style.setProperty('--dynamic-primary', palette.primary);
    root.style.setProperty('--dynamic-secondary', palette.secondary);
    root.style.setProperty('--dynamic-accent', palette.accent);
    root.style.setProperty('--dynamic-background', palette.background);
    root.style.setProperty('--dynamic-text', palette.text);

    // Создаем градиенты
    const primaryGradient = `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`;
    const backgroundGradient = `linear-gradient(135deg, ${palette.background}, ${adjustBrightness(palette.background, 10)})`;

    root.style.setProperty('--dynamic-gradient-primary', primaryGradient);
    root.style.setProperty('--dynamic-gradient-background', backgroundGradient);
}

/**
 * Генерирует анимированный фон на основе цветовой палитры
 */
export function createAnimatedBackground(palette: ColorPalette): string {
    return `
    background:
      radial-gradient(circle at 20% 80%, ${palette.primary}15 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, ${palette.accent}15 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, ${palette.secondary}10 0%, transparent 50%),
      linear-gradient(135deg, ${palette.background} 0%, ${adjustBrightness(palette.background, 5)} 100%);
    animation: backgroundPulse 8s ease-in-out infinite;
  `;
}

// Утилиты для работы с цветами
function getDefaultColors(): DominantColors {
    return {
        dominant: '#06b6d4',
        secondary: '#3b82f6',
        accent: '#ec4899'
    };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHsl(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c: number) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function adjustBrightness(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const adjust = (color: number) => {
        const adjusted = color + (color * percent / 100);
        return Math.max(0, Math.min(255, Math.round(adjusted)));
    };

    return rgbToHex({
        r: adjust(rgb.r),
        g: adjust(rgb.g),
        b: adjust(rgb.b)
    });
}

function getContrastColor(hex: string): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#ffffff';

    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
}
