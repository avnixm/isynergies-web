# Deployment guide

This document covers deployment: environments, build, DB migrations, rollback, post-deploy checks, secrets, and operational runbook for deployment failures.

---

## Table of contents

1. [Environments and configuration](#environments-and-configuration)
2. [Build steps and artifacts](#build-steps-and-artifacts)
3. [DB migration strategy](#db-migration-strategy)
4. [Rollback and zero-downtime](#rollback-and-zero-downtime)
5. [Post-deploy smoke tests](#post-deploy-smoke-tests)
6. [Secrets management and access](#secrets-management-and-access)
7. [Deployment failure runbook](#deployment-failure-runbook)

---

## Environments and configuration

| Environment | Typical use | Config source |
|-------------|-------------|---------------|
| **Development** | Local (`npm run dev`) | `.env` (not committed) |
| **Production** | Live site (e.g. Vercel) | Platform env vars (Vercel Project → Settings → Environment Variables) |
| **Staging** | Not in repo | Optional; use production-like env with separate DB and Blob if needed |

**Differences:**

- **Development:** `NODE_ENV=development`; optional email/Blob; JWT_SECRET can be placeholder; test-api page enabled; 500 responses may include dev-only details.
- **Production:** `NODE_ENV=production`; JWT_SECRET must be set and non-placeholder (app throws otherwise); Secure cookie; HSTS in middleware; test-api page disabled; 500 responses hide stack/details.

See [CONFIGURATION.md](CONFIGURATION.md) for all variables and per-environment notes.

---

## Build steps and artifacts

- **Build command:** `npm run build` (runs `next build`).
- **Artifacts:** `.next/` directory (Next.js output). No separate backend artifact; API is part of the same build.
- **Deploy target:** **Vercel** is the primary target (no Docker/Kubernetes in repo). Connect the repo to Vercel; framework preset Next.js; build command and output use defaults unless overridden.
- **Node version:** Use Node 20 LTS (CI uses 20). Set in Vercel project settings or `.nvmrc` / `engines` if needed.

---

## DB migration strategy

- **When:** Run migrations (or schema push) **before** or **after** deploy, depending on compatibility. Prefer running migrations that are backward-compatible before deploy so the new code works with the new schema.
- **How:** Against the **production** DB using production env vars. Options:
  - **Push (dev-style):** `npm run db:push` with production `DB_*` in env (e.g. run locally with production .env or from a secure runner). Pushes current schema; no migration history.
  - **Migrate:** `npm run db:migrate` to run pending migrations in `drizzle/`. Safer for versioned changes.
- **Backup:** Before running migrations on production, back up the database. Migrations are forward-only; rollback requires restore from backup or manual reverse migration.
- **Schema ensure:** For one-off missing tables (e.g. after a partial deploy), an authenticated admin can call `POST /api/admin/schema-ensure` to create known missing tables. Do not rely on this for normal migration workflow.

---

## Rollback and zero-downtime

- **Application rollback:** On Vercel, use the dashboard to redeploy a previous deployment. No in-repo rollback script.
- **Zero-downtime:** Vercel does atomic deployments. DB migrations should be backward-compatible (e.g. add column as nullable, add table) so old and new code can run during the switch. Avoid dropping columns or tables in the same release as code that still reads them.
- **DB rollback:** No automated DB rollback. Restore from backup if a migration must be reverted; then redeploy the previous app version if needed.

---

## Post-deploy smoke tests

Checklist after deploy:

1. **Homepage:** Load `/`; verify sections render and no console errors.
2. **Admin login:** Open `/admin/login`; log in with a known admin; verify redirect to dashboard.
3. **Admin API:** With session, open a dashboard section that calls an admin API (e.g. board-members); verify data loads.
4. **Contact form:** Submit the contact form (or call `POST /api/contact` with valid body); expect 201.
5. **Image serve:** Open a page that displays an image (e.g. from `/api/images/<id>`); verify image or redirect works.
6. **Env checklist:** Confirm in platform UI: `JWT_SECRET` set (production), `DB_*` correct, `BLOB_READ_WRITE_TOKEN` if using Blob uploads.

---

## Secrets management and access

- **Storage:** Never commit `.env` or `.env.local`. Use platform secrets (Vercel → Project → Settings → Environment Variables). Scope to Production/Preview as needed.
- **Required in production:** `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; typically `DB_SSL=true` for managed MySQL. Optional but recommended: `EMAIL_*`, `BLOB_READ_WRITE_TOKEN`.
- **Access control:** Limit who can view/edit env vars in Vercel (team permissions). Use separate DB users with minimal privileges if the DB supports it.

---

## Deployment failure runbook

| Failure | What to check | Action |
|---------|----------------|--------|
| **Build fails** | Node version (use 20); `npm run build` locally; Turbopack errors (try without if option exists). | Fix errors; check Next.js and dependency versions; retry deploy. |
| **Build succeeds, deploy fails** | Platform logs (Vercel deployment logs). | Fix config or runtime error; redeploy. |
| **App starts but DB errors** | `DB_*` env vars; DB reachable from deployment (e.g. Vercel IP allowlist / Trusted Sources for DigitalOcean); `DB_SSL=true` for cloud DB. | Correct env; add deployment IP to DB Trusted Sources; set `DB_SSL=true`; optionally increase `DB_CONNECT_TIMEOUT`. |
| **Login fails (401) or /me fails** | JWT_SECRET set and not placeholder in production; admin user exists in the **same** DB as `DB_*`. | Set JWT_SECRET; create admin in production DB (e.g. `npm run create-isyn-admin:do` with production env). |
| **500 on admin routes** | Server logs (Vercel Functions or server logs); missing table or env. | Fix schema (migrate/push) or env; redeploy. |
| **Upload fails** | `BLOB_READ_WRITE_TOKEN` set for Blob uploads; allowed MIME types and size. | Set token in env; check upload route allowlist and 20MB limit. |
| **Contact form does not send email** | `EMAIL_USER`, `EMAIL_APP_PASSWORD` (or `APP_PASSWORD`) set. | Set email env vars; contact form still saves to DB without them. |

**Escalation:** Collect deployment URL, deployment log snippet, and failing request (path, method, response status). Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for symptom-based steps.
