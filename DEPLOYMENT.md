# Deploy Banjo to Vercel

## Vercel project

1. Push this repository to GitHub, GitLab, or Bitbucket and import it from the Vercel dashboard.
2. Use the Vite framework preset, `npm run build` as the build command, and `dist` as the output directory. Vercel can usually detect these automatically.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project's Environment Variables for Production and Preview, then redeploy. Without them, the app runs in browser-only offline mode and does not persist submissions to the shared archive.

The Vite `VITE_*` values are included in the browser bundle. The Supabase anon/publishable key is expected to be public; never use a Supabase `service_role` key in this app. Keep Row Level Security enabled and apply the database/storage policies described in [`supabase/README.md`](supabase/README.md).

`vercel.json` provides the SPA fallback so direct requests to app paths load the client application.

## Supabase and Google sign-in

1. Apply the app's Supabase SQL setup described in [`supabase/README.md`](supabase/README.md). Apply `supabase/media-storage.sql` to enable audio uploads. New audio uploads are public immediately after the contributor's rights declaration; older pending-review audio remains in a separate private bucket.
2. In Supabase Authentication → URL Configuration, set the Site URL to the deployed production origin, such as `https://your-domain.example`.
3. Add the production origin to the allowed Redirect URLs. Add your Vercel preview pattern only if you intend to test sign-in from preview deployments; restrict it to your Vercel team/account slug.
4. In Supabase Authentication → Providers, enable Google and configure the Google OAuth client. In Google Cloud, use the callback URL shown by Supabase as the authorized redirect URI. The Google client secret belongs in Supabase, not in Vercel or the frontend.

After attaching a custom domain, update the Supabase Site URL and allowed Redirect URLs to include that domain. Redeploy after changing Vercel environment variables.

## Local production check

```sh
npm run lint
npm run build
```
