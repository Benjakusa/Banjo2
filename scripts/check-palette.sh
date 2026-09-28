#!/usr/bin/env bash
#
# Palette guardrail for Banjo.
#
# The UI uses exactly four colours: black, white, orange, blue.
# src/index.css is the single source of truth and is exempt. Everything else
# in src/ must reference those colours through Tailwind utilities backed by
# the theme tokens, never through raw values.
#
# Fails on:
#   * Tailwind colour utilities outside the token allowlist
#   * any #hex / rgb() / hsl() literal
#   * gradients (utility, keyword, or CSS function)
#   * shadow utilities other than shadow-none
#
set -uo pipefail

cd "$(dirname "$0")/.." || exit 2

# Tokens that legitimately appear as Tailwind colour utilities.
ALLOWED="paper|ink|ink-60|ink-12|ink-06|on-orange|brand|link|focus|transparent|current"
# Every Tailwind colour family that must never appear.
FAMILIES="red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|grey|stone|zinc|neutral"

# Files under test: all source, minus the token file itself.
mapfile -t FILES < <(
  find src -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' -o -name '*.html' \) \
    ! -path 'src/index.css' | sort
)

fail=0
report() { printf '\n  %s\n' "$1"; fail=1; }

# ---------------------------------------------------------------- hex / rgb
# HTML numeric entities (&#8722;, &#9834;) look like hex; exclude them.
hits=$(grep -nE '(^|[^&])#[0-9a-fA-F]{3,8}\b' "${FILES[@]}" 2>/dev/null \
        | grep -vE '&#[0-9]+;' || true)
if [ -n "$hits" ]; then report "raw colour literals (#hex):"; echo "$hits" | sed 's/^/    /'; fi

hits=$(grep -nE '\b(rgba?|hsla?)\(' "${FILES[@]}" 2>/dev/null || true)
if [ -n "$hits" ]; then report "raw colour literals (rgb/hsl):"; echo "$hits" | sed 's/^/    /'; fi

# --------------------------------------------------------------- gradients
hits=$(grep -nE 'gradient' "${FILES[@]}" 2>/dev/null || true)
if [ -n "$hits" ]; then report "gradients are not allowed:"; echo "$hits" | sed 's/^/    /'; fi

hits=$(grep -nE '\b(from|via|to)-[a-z]' "${FILES[@]}" 2>/dev/null || true)
if [ -n "$hits" ]; then report "gradient stop utilities (from-/via-/to-):"; echo "$hits" | sed 's/^/    /'; fi

# -------------------------------------------------------- colour utilities
hits=$(grep -nE "\b(bg|text|border|ring|divide|outline|decoration|fill|stroke|placeholder|caret|accent)-($FAMILIES)(-[0-9]+)?(/[0-9]+)?\b" "${FILES[@]}" 2>/dev/null || true)
if [ -n "$hits" ]; then report "colour utilities outside the palette:"; echo "$hits" | sed 's/^/    /'; fi

# Any -<family>-<shade> style token at all, even in a compound utility.
hits=$(grep -nE "\b($FAMILIES)-[0-9]{2,3}\b" "${FILES[@]}" 2>/dev/null || true)
if [ -n "$hits" ]; then report "palette shade numbers found:"; echo "$hits" | sed 's/^/    /'; fi

# --------------------------------------------------------------- shadows
hits=$(grep -nE '\bshadow-(xs|sm|md|lg|xl|2xl|inner|drop|focus)\b' "${FILES[@]}" 2>/dev/null || true)
if [ -n "$hits" ]; then report "shadow utilities (only shadow-none is allowed):"; echo "$hits" | sed 's/^/    /'; fi

# -------------------------------------------------------- legacy branding
hits=$(grep -rniE 'wikipedia|youtube' "${FILES[@]}" 2>/dev/null || true)
if [ -n "$hits" ]; then report "legacy branding strings:"; echo "$hits" | sed 's/^/    /'; fi

# ------------------------------------------------- backend vendor mentions
# The backing service must never surface to a reader: no UI copy, labels,
# titles, console text, or category names may name the vendor. Only the SDK
# plumbing itself is exempt -- the lib module, its import, the config flag,
# the query builder, and the VITE_* env keys.
hits=$(
  grep -rniE 'supabase' "${FILES[@]}" 2>/dev/null \
    | grep -vE "lib/supabase|@supabase/supabase-js|isSupabaseConfigured|supabase\.(from|auth)[.(]|VITE_SUPABASE_|^\S+:[0-9]+:\s*import\b" \
    || true
)
if [ -n "$hits" ]; then report "backend vendor mentioned outside the SDK plumbing:"; echo "$hits" | sed 's/^/    /'; fi

if [ "$fail" -ne 0 ]; then
  printf '\ncheck:palette FAILED\n'
  exit 1
fi

printf 'check:palette OK  (%d files scanned, tokens: %s)\n' "${#FILES[@]}" "$ALLOWED"
