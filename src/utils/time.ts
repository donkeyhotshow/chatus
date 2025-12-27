/**
 * Format game time from seconds to MM:SS format
 * Handles edge cases like invalid timestamps
 */
export const formatGameTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';

  // If number is too large (likely a Unix timestamp bug), return 0:00
  if (seconds > 36000) { // > 10 hours
    console.warn('[formatGameTime] Invalid game time detected:', seconds);
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format duration in milliseconds to human readable format
 */
export const formatDuration = (ms: number): string => {
  if (!ms || isNaN(ms) || ms < 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Get relative time string (e.g., "2 минуты назад")
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 0) return 'только что';

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'только что';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${pluralize(minutes, 'минуту', 'минуты', 'минут')} назад`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${pluralize(hours, 'час', 'часа', 'часов')} назад`;
  }

  const days = Math.floor(hours / 24);
  return `${days} ${pluralize(days, 'день', 'дня', 'дней')} назад`;
};

/**
 * Russian pluralization helper
 */
function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
