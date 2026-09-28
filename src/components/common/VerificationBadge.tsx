import React from 'react';
import {
  QuestionCircle,
  People,
  CheckCircle,
  Lock,
  ShieldCheck,
} from 'react-bootstrap-icons';
import { VerificationStatus } from '../../types';

/**
 * Verification is carried by an icon, not by a colour and not by a raw enum
 * string. Each status has one unambiguous glyph, and every glyph keeps an
 * accessible name (aria-label + title) so the meaning is never lost when the
 * visible text is dropped.
 */
type Spec = {
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
};

export const VERIFICATION_META: Record<VerificationStatus, Spec> = {
  unverified: { Icon: QuestionCircle, label: 'Unverified' },
  community_sourced: { Icon: People, label: 'Community-submitted' },
  reviewed: { Icon: CheckCircle, label: 'Reviewed' },
  rights_holder_verified: { Icon: Lock, label: 'Rights holder verified' },
  source_verified: { Icon: ShieldCheck, label: 'Source verified' },
};

interface Props {
  status: VerificationStatus;
  /** icon size class, e.g. "h-3.5 w-3.5" */
  className?: string;
  /** render the text label next to the icon (off by default) */
  showLabel?: boolean;
}

export const VerificationBadge: React.FC<Props> = ({
  status,
  className = 'h-3.5 w-3.5',
  showLabel = false,
}) => {
  const spec = VERIFICATION_META[status] ?? VERIFICATION_META.unverified;
  const { Icon, label } = spec;

  return (
    <span
      className="inline-flex items-center gap-1 align-middle"
      title={label}
      aria-label={label}
    >
      <Icon className={`${className} shrink-0 text-brand`} aria-hidden={true} />
      {showLabel && <span className="text-ink-60">{label}</span>}
    </span>
  );
};

export default VerificationBadge;
