import React from 'react';

/**
 * The Banjo logo is the name. A bold sans wordmark, ink-coloured, no icon,
 * no badge, no tile, no note glyph. Used identically in the top bar, the
 * mobile top bar, the footer, onboarding, and any dialog header.
 */
export const Wordmark: React.FC<{ className?: string; as?: 'span' | 'div' | 'h1' }> = ({
  className = '',
  as: Tag = 'span',
}) => (
  <Tag
    className={`font-extrabold tracking-tight text-ink ${className}`}
    style={{ letterSpacing: '-0.03em' }}
  >
    Banjo
  </Tag>
);

export default Wordmark;
