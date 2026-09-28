import React, { useEffect, useState } from 'react';
import { useBanjo } from '../../context/BanjoContext';
import { Wordmark } from '../common/Wordmark';
import { SELF_ASSIGNABLE_ROLES, roleLabel } from '../../lib/auth';
import { UserRole } from '../../types';
import { ArrowLeft, PersonBadge, Lock } from 'react-bootstrap-icons';

type Mode = 'signin' | 'signup';

const fieldClass =
  'w-full rounded-lg border border-ink-12 bg-paper px-3 py-2.5 text-sm text-ink ' +
  'outline-none transition-colors placeholder:text-ink-60 focus:border-focus';

export const SignInView: React.FC = () => {
  const { signIn, signUp, authError, clearAuthError, isOfflineAuth, navigateTo, authMode, setAuthMode } = useBanjo();

  const [mode, setMode] = useState<Mode>(authMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('contributor');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailError = touched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? 'Enter a valid email address.'
    : null;
  const passwordError = touched && password.length < 8
    ? 'Use at least 8 characters.'
    : null;
  const nameError = touched && mode === 'signup' && displayName.trim().length < 2
    ? 'Tell us what to call you.'
    : null;

  const canSubmit =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    password.length >= 8 &&
    (mode === 'signin' || displayName.trim().length >= 2) &&
    !busy;

  // If another view asked for "Create account", open on that form.
  useEffect(() => {
    setMode(authMode);
    setTouched(false);
  }, [authMode]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setAuthMode(next);
    setTouched(false);
    clearAuthError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    setBusy(true);
    const ok = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, displayName);
    setBusy(false);

    if (ok) navigateTo('profile');
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-ink-12 bg-paper p-6 sm:p-8">
      <button
        type="button"
        onClick={() => navigateTo('home')}
        className="mx-auto flex w-fit items-center gap-1.5 text-xs text-ink-60 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to the archive
      </button>

      <div className="text-center">
        <Wordmark size="md" alt="Banjo" />
        <h1 className="mt-4 font-serif text-2xl text-ink">
          {mode === 'signin' ? 'Sign in to contribute' : 'Create an account'}
        </h1>
        <p className="mt-1 text-sm text-ink-60">
          {mode === 'signin'
            ? 'Signing in is required before you can edit entries or submit recordings.'
            : 'An account lets you propose edits, upload recordings, and track your contributions.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="auth-name" className="mb-1.5 block text-xs font-medium text-ink">
              Display name
            </label>
            <div className="relative">
              <PersonBadge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-60" />
              <input
                id="auth-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Achieng Odhiambo"
                autoComplete="name"
                className={`${fieldClass} pl-9`}
              />
            </div>
            {nameError && <p className="mt-1 text-xs text-ink-60">{nameError}</p>}
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-ink">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.org"
            autoComplete="email"
            className={fieldClass}
          />
          {emailError && <p className="mt-1 text-xs text-ink-60">{emailError}</p>}
        </div>

        <div>
          <label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-ink">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-60" />
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className={`${fieldClass} pl-9`}
            />
          </div>
          {passwordError && <p className="mt-1 text-xs text-ink-60">{passwordError}</p>}
        </div>

        {mode === 'signup' && (
          <div>
            <label htmlFor="auth-role" className="mb-1.5 block text-xs font-medium text-ink">
              How will you use Banjo?
            </label>
            <select
              id="auth-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={fieldClass}
            >
              {SELF_ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-60">
              Archivist and moderation roles are assigned by an administrator, not chosen here.
            </p>
          </div>
        )}

        {authError && (
          <p role="alert" className="rounded-lg border border-ink-12 bg-ink-06 px-3 py-2 text-xs text-ink">
            {authError}
          </p>
        )}

        {isOfflineAuth && (
          <p className="rounded-lg border border-ink-12 bg-ink-06 px-3 py-2 text-xs text-ink-60">
            No archive backend is configured, so this session is stored in the browser only.
            It grants no real access and is cleared on sign out.
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-on-orange transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-60">
        {mode === 'signin' ? 'No account yet?' : 'Already registered?'}{' '}
        <button
          type="button"
          onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
          className="font-semibold text-ink underline underline-offset-2"
        >
          {mode === 'signin' ? 'Create one' : 'Sign in'}
        </button>
      </p>
    </div>
  );
};

export default SignInView;
