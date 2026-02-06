# Deployment guide

This document covers **how to deploy** the app: where to run it, build steps, database migrations, rollback, and what to do when something fails.

---

## Where do I deploy?

Choose one of these:

| You want to… | Read this |
|--------------|-----------|
| **Deploy on your own server (Apache)** | [PRODUCTION_SETUP_APACHE_PM2.md](PRODUCTION_SETUP_APACHE_PM2.md) — Step-by-step: SSH, Node, PM2, MySQL, Apache reverse proxy, SSL. |
| **Deploy on your own server (Nginx)** | [PRODUCTION_SETUP_NGINX_PM2.md](PRODUCTION_SETUP_NGINX_PM2.md) — Same idea with Nginx instead of Apache. |
| **Deploy on cPanel/WHM with PM2** | [INSTALLATION_CPANEL_PM2.md](INSTALLATION_CPANEL_PM2.md) — For cPanel/WHM hosting. |
| **Deploy on Vercel** | Use this doc + Vercel dashboard. Connect the repo, set env vars, deploy. |

Use **either Apache or Nginx** on a server — not both. The rest of this page applies to any deployment (env vars, migrations, rollback, runbook).

---

## Table of contents

1. [Environments and configuration](#environments-and-configuration) — Dev vs production env vars
2. [Build steps and artifacts](#build-steps-and-artifacts) — How to build and what you get
3. [DB migration strategy](#db-migration-strategy) — When and how to run migrations
4. [Rollback and zero-downtime](#rollback-and-zero-downtime) — How to undo a bad deploy
5. [Post-deploy smoke tests](#post-deploy-smoke-tests) — Quick checks after going live
6. [Secrets management and access](#secrets-management-and-access) — Where to put secrets safely
7. [Deployment failure runbook](#deployment-failure-runbook) — What to do when something fails

---

## Environments and configuration

**What it is:** The app can run in *development* (your machine) or *production* (live site). Each needs the right env vars.

| Environment | Where it runs | Where config lives |
|-------------|----------------|---------------------|
| **Development** | Your computer (`npm run dev`) | `.env` (do not commit) |
| **Production** | Live site (Vercel, your server, etc.) | Platform env vars or server `.env` |
| **Staging** | Optional separate site | Same idea, different DB/URL |

**Important:** In production you must set `NODE_ENV=production` and a real `JWT_SECRET`. See [CONFIGURATION.md](CONFIGURATION.md) for the full list.

---

## Build steps and artifacts

**What you do:** Run `npm run build` (this runs `next build`).

**What you get:** A `.next/` folder with the built app. The API is part of the same build — there is no separate backend to deploy.

**Node version:** Use Node 20 LTS. On Vercel, set it in project settings; on your own server, install Node 20.

---

## DB migration strategy

**When:** Run migrations (or `db:push`) when the app or schema changes. Prefer backward-compatible changes (e.g. add column as nullable) so old and new code both work during deploy.

**How:**

- **Option A — Push:** `npm run db:push` with production DB env vars. Updates the DB to match the current schema. No migration history.
- **Option B — Migrate:** `npm run db:migrate` to run pending migrations in `drizzle/`. Better when you want versioned, repeatable changes.

**Always:** Back up the production database before running migrations. There is no automatic rollback — you restore from backup if needed.

**Emergency:** If a table is missing after a bad deploy, an admin can call `POST /api/admin/schema-ensure` to create known tables. Use only for one-off fixes, not as the normal workflow.

---

## Rollback and zero-downtime

**App rollback:** On Vercel, redeploy a previous deployment from the dashboard. On your own server, redeploy an older build and restart PM2.

**DB rollback:** There is no automatic DB rollback. Restore the database from a backup if you must undo a migration, then redeploy the app version that matches that schema.

**Tip:** Keep migrations backward-compatible (add columns/tables, avoid dropping things in the same release as code that still uses them) so deploys stay safe.

---

## Post-deploy smoke tests

**After every deploy, quickly check:**

1. **Homepage** — Open `/`; sections should load, no errors in the browser console.
2. **Admin login** — Open `/admin/login`, log in; you should reach the dashboard.
3. **Admin data** — Open a dashboard section (e.g. Board Members); data should load.
4. **Contact form** — Submit the form once; it should succeed (or at least not 500).
5. **Images** — A page that shows images (e.g. from `/api/images/...`) should show them.
6. **Env** — In your platform (Vercel, server, etc.): `JWT_SECRET` set, `DB_*` correct, `BLOB_READ_WRITE_TOKEN` if you use Blob uploads.

---

## Secrets management and access

**Rule:** Never commit `.env` or `.env.local`. Put secrets in your platform’s env vars (e.g. Vercel → Project → Settings → Environment Variables) or in a server `.env` that is not in git.

**Production must have:** `JWT_SECRET`, and DB vars (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). For cloud MySQL, usually `DB_SSL=true`. Optional but useful: `EMAIL_*` for contact form, `BLOB_READ_WRITE_TOKEN` for uploads.

**Access:** Restrict who can see or change env vars. Use a DB user with only the rights the app needs.

---

## Deployment failure runbook

**Something broke — use this table to find the cause and fix.**

| What’s wrong | Check this | Do this |
|--------------|------------|---------|
| **Build fails** | Node version (use 20); run `npm run build` locally. | Fix the reported error; retry deploy. |
| **Deploy fails after build** | Platform logs (e.g. Vercel deployment logs). | Fix the config or runtime error; redeploy. |
| **DB errors (can’t connect)** | `DB_*` env vars; DB allows connections from your app (e.g. Vercel IP allowlist, DigitalOcean Trusted Sources). | Set env correctly; add app IP to DB allowlist; use `DB_SSL=true` for cloud MySQL. |
| **Login fails (401) or /me fails** | `JWT_SECRET` set in production; admin user exists in the same DB. | Set `JWT_SECRET`; create admin in production DB (see scripts or CONFIGURATION). |
| **500 on admin routes** | Server logs; missing DB table or wrong env. | Run migrations or schema-ensure; fix env; redeploy. |
| **Upload fails** | `BLOB_READ_WRITE_TOKEN` if using Blob; file type and size limits. | Set token; check upload route and 20MB limit. |
| **Contact form doesn’t send email** | `EMAIL_USER`, `EMAIL_APP_PASSWORD` (or `APP_PASSWORD`). | Set email env vars. Form still saves to DB without them. |

**Need more help?** Note: deployment URL, a bit of the log, and the failing request (URL, method, status). Then see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
