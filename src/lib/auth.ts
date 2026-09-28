import { UserRole } from '../types';

/**
 * Role policy.
 *
 * A user may pick their own role at sign-up, but only from a low-privilege
 * set. Elevated roles are deliberately NOT self-assignable: they are granted
 * later by an administrator, in the admin dashboard, which writes to the
 * `user_roles` table (see migration 0009_identity_roles_permissions.sql).
 *
 * The server is the real authority here. Anything that merely hides a control
 * in the UI is cosmetic -- the RLS policies are what actually enforce it.
 */

/** Roles a person may choose for themselves when creating an account. */
export const SELF_ASSIGNABLE_ROLES: UserRole[] = [
  'listener',
  'contributor',
  'analyst',
];

/** Roles that unlock archiving/administration tooling. Never self-assignable. */
export const ELEVATED_ROLES: UserRole[] = [
  'super_admin',
  'platform_admin',
  'senior_archivist',
  'archivist',
  'moderator',
  'rights_manager',
  'support_agent',
];

export const DEFAULT_ROLE: UserRole = 'listener';

export const isElevated = (role: UserRole | undefined): boolean =>
  Boolean(role && ELEVATED_ROLES.includes(role));

/** Guards a role change so an elevated role can never arrive from the client. */
export const canSelfAssign = (role: UserRole): boolean =>
  SELF_ASSIGNABLE_ROLES.includes(role);

const LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrator',
  platform_admin: 'Platform Administrator',
  senior_archivist: 'Senior Archivist',
  archivist: 'Archivist',
  moderator: 'Moderator',
  rights_manager: 'Rights Manager',
  support_agent: 'Support Agent',
  analyst: 'Analyst',
  contributor: 'Contributor',
  listener: 'Listener',
};

export const roleLabel = (role: UserRole | undefined): string =>
  role ? LABELS[role] : 'Unknown';
