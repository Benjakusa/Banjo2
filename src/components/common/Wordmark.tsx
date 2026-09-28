import React from 'react';
import logoLight from '../../assets/logo light mode.png';
import logoDark from '../../assets/logo dark mode.png';

/**
 * The Banjo logo is the name, supplied as two wordmark files:
 *   logo light mode.png - dark ink + orange accent on a transparent canvas
 *   logo dark mode.png  - light ink + orange accent on a near-black canvas
 *
 * The right file is chosen from the active theme, which the app always sets
 * explicitly as data-theme="light" | "dark" on <html>, so the `dark:` variant
 * is a reliable signal rather than a guess.
 *
 * The two files are padded differently (the light file is 71% ink, the dark
 * file ~78%), so each variant gets its own height in order to present the
 * same optical wordmark size. `size` is therefore the *wordmark* size, and
 * the two numbers below are the image heights that produce it.
 */
type Size = 'sm' | 'md' | 'lg';

const HEIGHTS: Record<Size, { light: string; dark: string }> = {
  sm: { light: 'h-[24px]', dark: 'h-[21px]' },
  md: { light: 'h-[30px]', dark: 'h-[27px]' },
  lg: { light: 'h-[40px]', dark: 'h-[36px]' },
};

interface Props {
  size?: Size;
  /** pass "" when an accessible name is already provided by a parent */
  alt?: string;
  className?: string;
}

export const Wordmark: React.FC<Props> = ({
  size = 'md',
  alt = 'Banjo',
  className = '',
}) => (
  <span className={`inline-flex shrink-0 items-center ${className}`}>
    <img
      src={logoLight}
      alt={alt}
      draggable={false}
      className={`${HEIGHTS[size].light} w-auto dark:hidden`}
    />
    <img
      src={logoDark}
      alt={alt}
      draggable={false}
      className={`${HEIGHTS[size].dark} hidden w-auto dark:block`}
    />
  </span>
);

export default Wordmark;
