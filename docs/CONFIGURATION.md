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
| `DB_CONNECTION_LIMIT` | No | `5` dev / `10` prod | `20` | Max concurrent MySQL connections in the pool. | Tune based on server capacity; too low causes \"Queue limit reached\" under burst load. |
| `DB_QUEUE_LIMIT` | No | `10` dev / `100` prod | `200` | Max waiting queries when all pool connections are busy. | Set high enough for chunked uploads and range requests; very low values can cause sporadic 500s. |
| `JWT_SECRET` | Yes (admin) | Dev placeholder** | Long random string | Secret for signing/verifying admin JWT. | **Production:** Must be set and must not be the default placeholder; app throws on startup otherwise. Never commit. |
| `NODE_ENV` | Set by runtime | — | `development`, `production` | Environment mode. | Affects cookie Secure, HSTS, error details in responses, test-api page. |
| **`SMTP_HOST`** | No* | — | `mail.yourdomain.com` | **cPanel / server SMTP hostname.** Contact form uses this; no app password needed. | *Set this for cPanel or server mailer. If unset, app falls back to Gmail (which requires app password). |
| `SMTP_PORT` | No | `587` | `587` or `465` | SMTP port. | 587 = STARTTLS; 465 = SSL. |
| `SMTP_SECURE` | No | (falsy) | `true` | Use TLS/SSL for SMTP. | Set `true` for port 465 or when server requires SSL. |
| `EMAIL_FROM` | No | — | `iSynergies Contact` | Custom "From" display name for emails. | — |
| `EMAIL_USER` | No | — | `noreply@yourdomain.com` | Only for Gmail, or if cPanel SMTP requires auth. | Not needed for typical cPanel SMTP. |
| `EMAIL_APP_PASSWORD` | No | — | (secret) | **Gmail only** — app password. Not used for cPanel SMTP. | Alternative: `APP_PASSWORD`. Never commit. |
| `APP_PASSWORD` | No | — | (same as above) | Alternative to `EMAIL_APP_PASSWORD` (Gmail only). | Not used for cPanel SMTP. Never commit. |
| `NEXT_PUBLIC_SITE_URL` | No | — | `https://yoursite.com` | Public site URL for redirects/links in emails. | Used in contact email template. |
| `BASE_URL` | No | — | `https://yoursite.com` | Fallback for site URL when building links. | Used in contact route if origin/host not available. |
| `BLOB_READ_WRITE_TOKEN` | No*** | — | `vercel_blob_rw_...` | Vercel Blob token for uploads. Read only from environment (e.g. `.env`). | ***Required for admin image/media uploads via Vercel Blob (especially large videos). From Vercel project → Storage. Never commit. |
| `SINGLE_VIDEO_UPLOAD` | No | — | `true` | When `true`, video uploads use a single HTTP request (no chunking). Recommended for cPanel/PM2; max video 20MB when Blob not used. | Set to `true` to avoid chunked upload reconstruction on same server. |

\* Database is required for the app and admin; defaults allow local dev with a local MySQL instance.  
\** In development, a default placeholder is used if `JWT_SECRET` is unset; in production the app throws if unset or placeholder.  
\*** Without it, admin uploads that use Vercel Blob will fail; DB-based upload (upload, upload-chunk, upload-finalize) may still work.

### cPanel / server SMTP (no app password)

Contact form email uses **cPanel or your server’s SMTP**. You do **not** need Gmail or app passwords.

1. In **`.env`**: set **`SMTP_HOST`** to your mail server hostname (e.g. `mail.yourdomain.com` — from cPanel → Email → Connect Devices or your host’s docs).
2. Set **`SMTP_PORT`** (usually `587`) and **`SMTP_SECURE`** (`false` for 587, `true` for 465) if needed.
3. In the app: **Site Settings** → set **Contact Forward Email** (or **Company Email**) so messages are forwarded to your inbox.

You can set **multiple recipients** in **Site Settings** by clicking **Add email** to add another recipient textbox.

No **`EMAIL_APP_PASSWORD`** or **`APP_PASSWORD`** — the app uses the server’s SMTP, not Gmail.

Example `.env` for cPanel:

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_FROM=iSynergies Contact
```

If your cPanel SMTP requires authentication, you can optionally set `EMAIL_USER` and `APP_PASSWORD`; most cPanel setups on the same server do not.

If **`SMTP_HOST`** is not set, the app falls back to Gmail and then requires `EMAIL_USER` and `EMAIL_APP_PASSWORD` (or `APP_PASSWORD`).

---

## Per-environment overrides

### Development

- **DB:** Typically `DB_HOST=localhost`, `DB_SSL` unset or `false`.
- **JWT_SECRET:** Can be any string (or placeholder); not enforced.
- **Email:** Optional; contact form works without it (message stored in DB only).
- **BLOB_READ_WRITE_TOKEN:** Optional unless you need Blob uploads in dev.
- **NODE_ENV:** `development` when running `npm run dev` (or set explicitly). Enables dev-only error details in API responses and test-api page.

### Production (e.g. Vercel)

- **DB:** Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; usually `DB_SSL=true`. For managed MySQL (e.g. DigitalOcean), add the deployment’s IP (or 0.0.0.0/0 for Vercel) to Trusted Sources. Tune `DB_CONNECTION_LIMIT` / `DB_QUEUE_LIMIT` so that bursty admin traffic (dashboard, uploads, video range requests) does not exhaust the pool.
- **JWT_SECRET:** **Must** be set to a strong random value; app will throw on startup if missing or default.
- **Email:** Set a forward address in Site Settings (Contact Forward Email or Company Email). For Gmail, set `EMAIL_USER` and `EMAIL_APP_PASSWORD`; for server SMTP (`SMTP_HOST`), auth is optional.
- **BLOB_READ_WRITE_TOKEN:** Set for admin image/media uploads via Vercel Blob. Without it, large video uploads fall back to DB-based storage and are constrained by HTTP body size and MySQL limits.

### Web server / proxy (cPanel, Nginx, etc.)

- Ensure the front web server allows request bodies at least as large as your chosen chunk size:
  - For Nginx, set `client_max_body_size` to at least `2m`–`4m` to comfortably handle 1MB raw chunks (≈1.33MB base64) plus multipart overhead.
  - For Apache/cPanel, adjust `LimitRequestBody` or the hosting panel's upload size settings accordingly.
- Keep timeouts (e.g. `proxy_read_timeout`, `RequestReadTimeout`) high enough that a full sequence of chunked uploads plus finalization can complete without being cut off under normal network conditions.
- **NODE_ENV:** Set to `production` by Vercel. Enables Secure cookie, HSTS (in middleware), and hides stack traces in API responses.

### Staging

Not defined in the repo. If you add a staging environment, use production-like settings (strong JWT_SECRET, DB_SSL, etc.) with a separate DB and optional separate Blob project.

---

## Secrets management

- **Do not commit** `.env`, `.env.local`, or any file containing secrets. `.env` is in `.gitignore`.
- **Vercel:** Add all secrets in Project → Settings → Environment Variables (for Production/Preview as needed).
- **Local:** Copy a safe example into `.env` and fill in values; never commit that file.
- **Rotation:** If `JWT_SECRET` is compromised, change it and redeploy; all existing admin sessions will be invalidated. Rotate DB and email credentials through your provider and update env vars.
