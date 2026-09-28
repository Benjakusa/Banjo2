/**
 * Cover art generation.
 *
 * A contributor may upload a thumbnail, but a song should never end up with
 * a blank cover, so the app derives one from the title instead. The artwork is
 * drawn on a canvas using the live palette tokens, so it stays inside the
 * black / white / orange system and follows the active theme.
 */

/** Reads a palette token off <html>, falling back to a named colour. */
const token = (name: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw || fallback;
};

/**
 * Up to two initials from a title. Handles punctuation and the ampersands
 * and apostrophes that show up constantly in West African and Francophone
 * record titles.
 */
export const initialsFromTitle = (title: string): string => {
  const words = (title || '')
    .replace(/[''`]/g, '')
    .split(/[^A-Za-zÀ-ɏ]+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return '♪';
  if (words.length === 1) {
    const w = words[0];
    return w.length > 1 ? w.slice(0, 2).toUpperCase() : w.toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

const SIZE = 512;

/**
 * Renders a deterministic cover for a title. Same title always produces the
 * same artwork, so re-submitting a song does not churn its image.
 */
export const generateThumbnail = (title: string): string => {
  if (typeof document === 'undefined') return '';

  const ink = token('--ink', 'black');
  const paper = token('--paper', 'white');
  const orange = token('--orange', 'orange');

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Field.
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Accent: a solid orange disc bleeding off the top-right corner. The disc
  // position is nudged by the title so different songs do not look identical.
  const seed = [...(title || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
  const cx = SIZE * (0.62 + ((seed % 7) / 100));
  const cy = SIZE * (0.3 + ((seed % 5) / 100));
  ctx.fillStyle = orange;
  ctx.beginPath();
  ctx.arc(cx, cy, SIZE * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // Baseline rule.
  ctx.fillStyle = orange;
  ctx.fillRect(SIZE * 0.12, SIZE * 0.72, SIZE * 0.76, SIZE * 0.012);

  // Initials.
  const initials = initialsFromTitle(title);
  ctx.fillStyle = paper;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(SIZE * 0.34)}px ${token('--font-sans', 'system-ui')}`;
  ctx.fillText(initials, SIZE / 2, SIZE * 0.42);

  return canvas.toDataURL('image/jpeg', 0.82);
};

/**
 * Validates a user-supplied thumbnail. Returns an error message, or null when
 * the file is acceptable.
 */
export const validateThumbnail = (file: File): string | null => {
  if (!file.type.startsWith('image/')) return 'Thumbnail must be an image file.';
  if (file.size > 5 * 1024 * 1024) return 'Thumbnail must be under 5 MB.';
  return null;
};
