# Configuration

This document lists all environment variables used by the application, their defaults, and security notes. Values are loaded from `.env` (and `.env.local` when supported by Next.js) via `process.env`.

---

## Table of contents

1. [Environment variables reference](#environment-variables-reference)
2. [Per-environment overrides](#per-environment-overrides)
3. [Secrets management](#secrets-management)

---

## Environment variables reference

| Variable | Required | Default | Example | Description | Security notes |
|----------|----------|---------|---------|-------------|----------------|
| `DB_HOST` | Yes* | `localhost` | `localhost` or `db-mysql-xxx.db.ondigitalocean.com` | MySQL server host. | Use TLS in production (`DB_SSL=true`). |
| `DB_PORT` | No | `3306` | `3306` | MySQL server port. | — |
| `DB_USER` | Yes* | `root` | `doadmin` | MySQL username. | Never commit; use platform secrets. |
| `DB_PASSWORD` | Yes* | `''` | (secret) | MySQL password. | Never commit; use platform secrets. |
| `DB_NAME` | No | `isynergies` | `isynergies` | MySQL database name. | — |
| `DB_SSL` | No | (falsy) | `true` | Enable TLS for MySQL. | Set `true` for cloud MySQL (e.g. DigitalOcean, Aiven). |
| `DB_CONNECT_TIMEOUT` | No | `15000` | `15000` | Connection timeout in milliseconds. | Increase if DB is remote/slow. |
| `JWT_SECRET` | Yes (admin) | Dev placeholder** | Long random string | Secret for signing/verifying admin JWT. | **Production:** Must be set and must not be the default placeholder; app throws on startup otherwise. Never commit. |
| `NODE_ENV` | Set by runtime | — | `development`, `production` | Environment mode. | Affects cookie Secure, HSTS, error details in responses, test-api page. |
| `EMAIL_USER` | No | — | `your@gmail.com` | SMTP user / Gmail address for contact form. | If missing, contact form still saves to DB but does not send email. |
| `EMAIL_APP_PASSWORD` | No | — | App password | Gmail app password or SMTP password. | Alternative: `APP_PASSWORD`. Never commit. |
| `APP_PASSWORD` | No | — | (same as above) | Alternative to `EMAIL_APP_PASSWORD`. | Never commit. |
| `EMAIL_FROM` | No | — | `iSynergies Contact` | Custom "From" display name for emails. | — |
| `SMTP_HOST` | No | (Gmail) | `smtp.example.com` | Custom SMTP host. | If set, custom SMTP is used instead of Gmail. |
| `SMTP_PORT` | No | `587` | `587` | SMTP port. | — |
| `SMTP_SECURE` | No | (falsy) | `true` | Use TLS for SMTP. | — |
| `NEXT_PUBLIC_SITE_URL` | No | — | `https://yoursite.com` | Public site URL for redirects/links in emails. | Used in contact email template. |
| `BASE_URL` | No | — | `https://yoursite.com` | Fallback for site URL when building links. | Used in contact route if origin/host not available. |
| `BLOB_READ_WRITE_TOKEN` | No*** | — | `vercel_blob_rw_...` | Vercel Blob token for uploads. | ***Required for admin image/media uploads (Vercel Blob). From Vercel project → Storage → .env.local. Never commit. |
| `isyn_READ_WRITE_TOKEN` | No | — | (legacy) | Legacy name; if set, copied to `BLOB_READ_WRITE_TOKEN` in `app/lib/blob-token.ts`. | Prefer `BLOB_READ_WRITE_TOKEN`. |

\* Database is required for the app and admin; defaults allow local dev with a local MySQL instance.  
\** In development, a default placeholder is used if `JWT_SECRET` is unset; in production the app throws if unset or placeholder.  
\*** Without it, admin uploads that use Vercel Blob will fail; DB-based upload (upload, upload-chunk, upload-finalize) may still work.

---

## Per-environment overrides

### Development

- **DB:** Typically `DB_HOST=localhost`, `DB_SSL` unset or `false`.
- **JWT_SECRET:** Can be any string (or placeholder); not enforced.
- **Email:** Optional; contact form works without it (message stored in DB only).
- **BLOB_READ_WRITE_TOKEN:** Optional unless you need Blob uploads in dev.
- **NODE_ENV:** `development` when running `npm run dev` (or set explicitly). Enables dev-only error details in API responses and test-api page.

### Production (e.g. Vercel)

- **DB:** Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; usually `DB_SSL=true`. For managed MySQL (e.g. DigitalOcean), add the deployment’s IP (or 0.0.0.0/0 for Vercel) to Trusted Sources.
- **JWT_SECRET:** **Must** be set to a strong random value; app will throw on startup if missing or default.
- **Email:** Set `EMAIL_USER` and `EMAIL_APP_PASSWORD` (or `APP_PASSWORD`) to send contact form emails.
- **BLOB_READ_WRITE_TOKEN:** Set for admin image/media uploads via Vercel Blob.
- **NODE_ENV:** Set to `production` by Vercel. Enables Secure cookie, HSTS (in middleware), and hides stack traces in API responses.

### Staging

Not defined in the repo. If you add a staging environment, use production-like settings (strong JWT_SECRET, DB_SSL, etc.) with a separate DB and optional separate Blob project.

---

## Secrets management

- **Do not commit** `.env`, `.env.local`, or any file containing secrets. `.env` is in `.gitignore`.
- **Vercel:** Add all secrets in Project → Settings → Environment Variables (for Production/Preview as needed).
- **Local:** Copy a safe example into `.env` and fill in values; never commit that file.
- **Rotation:** If `JWT_SECRET` is compromised, change it and redeploy; all existing admin sessions will be invalidated. Rotate DB and email credentials through your provider and update env vars.
