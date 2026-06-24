/**
 * UTILITY FUNCTIONS
 *
 * Pure, side-effect-free helpers used across the codebase.
 * Grouped by category for easy discovery.
 */

// ─────────────────────────────────────────────
// FORMATTING
// ─────────────────────────────────────────────

/**
 * Format price in Indian Rupee format
 * 1000 → "₹1,000"
 * 10000 → "₹10,000"
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}

/**
 * Format percentage
 * 25 → "25% OFF"
 */
export function formatDiscount(percent: number): string {
  return `${Math.round(percent)}% OFF`;
}

/**
 * Format rating
 * 4.8 → "4.8 ★"
 */
export function formatRating(rating: number): string {
  return `${rating.toFixed(1)} ★`;
}

/**
 * Format review count
 * 1234 → "1.2K reviews"
 * 123456 → "123.5K reviews"
 */
export function formatReviewCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K reviews`;
  }
  return `${count} reviews`;
}

// ─────────────────────────────────────────────
// TIME
// ─────────────────────────────────────────────

/**
 * Format countdown duration
 * 7384000ms → { hours: '02', minutes: '03', seconds: '04' }
 */
export function formatCountdown(remainingMs: number): {
  hours: string;
  minutes: string;
  seconds: string;
} {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  };
}

// ─────────────────────────────────────────────
// COLOR UTILITIES
// ─────────────────────────────────────────────

/**
 * Add alpha/opacity to a hex color
 * addAlpha('#FF6B6B', 0.15) → '#FF6B6B26'
 */
export function addAlpha(hex: string, alpha: number): string {
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alphaHex}`;
}

/**
 * Determine if a color is "dark" for contrast text decisions
 */
export function isDarkColor(hex: string): boolean {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

// ─────────────────────────────────────────────
// ARRAY UTILITIES
// ─────────────────────────────────────────────

/**
 * Chunk array into sub-arrays of given size
 * chunk([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Stable sort for sections (preserves relative order of equal elements)
 */
export function stableSort<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
  return array
    .map((item, index) => ({ item, index }))
    .sort((a, b) => compareFn(a.item, b.item) || a.index - b.index)
    .map(({ item }) => item);
}

// ─────────────────────────────────────────────
// LOGGING
// ─────────────────────────────────────────────

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};

/**
 * Structured logger. In production, ship to Datadog/Sentry.
 */
export const logger = {
  debug: (tag: string, message: string, data?: unknown): void =>
    log('debug', tag, message, data),
  info: (tag: string, message: string, data?: unknown): void =>
    log('info', tag, message, data),
  warn: (tag: string, message: string, data?: unknown): void =>
    log('warn', tag, message, data),
  error: (tag: string, message: string, data?: unknown): void =>
    log('error', tag, message, data),
};

function log(level: LogLevel, tag: string, message: string, data?: unknown): void {
  if (!__DEV__ && level === 'debug') return; // Skip debug in production

  const prefix = `${LOG_COLORS[level]}[${tag}]\x1b[0m`;
  if (data !== undefined) {
    writeLog(level, `${prefix} ${message}`, data);
  } else {
    writeLog(level, `${prefix} ${message}`);
  }
}

function writeLog(level: LogLevel, message: string, data?: unknown): void {
  switch (level) {
    case 'debug':
      console.debug(message, data);
      break;
    case 'info':
      console.info(message, data);
      break;
    case 'warn':
      console.warn(message, data);
      break;
    case 'error':
      console.error(message, data);
      break;
  }
}
