# Troubleshooting

This document lists common issues by symptom, root causes, fixes, decision trees, and what to collect for escalation.

---

## Table of contents

1. [Common issues by symptom](#common-issues-by-symptom)
2. [Decision trees](#decision-trees)
3. [Escalation and logs to collect](#escalation-and-logs-to-collect)

---

## Common issues by symptom

| Symptom | Possible cause | Fix |
|---------|----------------|-----|
| **Invalid credentials** on admin login | Admin user does not exist in the DB the app is using, or wrong password. | Create admin in the **same** DB as `DB_*` (e.g. `npm run create-isyn-admin` for local, `npm run create-isyn-admin:do` for production DB). Username/password are case-sensitive. |
| **Too many login attempts** | Rate limit (10/15min per IP). | Wait for the window to reset or use another IP. Response includes `Retry-After`. |
| **Too many submissions** (contact) | Contact rate limit (5/min per IP). | Wait 1 minute or use another IP. |
| **connect ETIMEDOUT** or **ECONNREFUSED** (DB) | DB unreachable: wrong host/port, firewall, or DB not running. | Check `DB_HOST`, `DB_PORT`, `DB_SSL`. For cloud DB (e.g. DigitalOcean), add deployment IP (or 0.0.0.0/0) to Trusted Sources. Ensure MySQL is running locally. |
| **ER_ACCESS_DENIED_ERROR** | Wrong DB user or password. | Verify `DB_USER`, `DB_PASSWORD` in `.env` or platform env. |
| **ER_BAD_DB_ERROR** | Database does not exist. | Create DB: `CREATE DATABASE isynergies;` then run `npm run db:push` or `npm run db:setup`. |
| **JWT_SECRET must be set** (production) | Running with `NODE_ENV=production` and missing or default JWT_SECRET. | Set `JWT_SECRET` to a long random value in production env. |
| **Failed to fetch image** or **Image/Media not found** | No row in `images` or `media` for that ID, or Blob URL missing. | Check DB for the id; ensure upload completed and (if Blob) `url` is set. |
| **500 on admin API** | Server error: missing table, env, or bug. | Check server logs (Vercel Functions or dev terminal). Verify `JWT_SECRET`, `DB_*`; run migrations if table missing. |
| **401 on admin API** (after login) | Token not sent (cross-origin, no cookie) or token invalid/expired. | Use same origin for dashboard; ensure cookie `admin_token` is sent. Re-login if token expired (7d). |
| **Build fails** (Turbopack / Next.js) | Node version, Turbopack bug, or dependency issue. | Use Node 20; retry build. If Turbopack error persists, check Next.js issues or try disabling Turbopack if supported. |
| **Upload fails** (Blob) | Missing or invalid `BLOB_READ_WRITE_TOKEN`, or file type/size not allowed. | Set `BLOB_READ_WRITE_TOKEN` from Vercel Storage; check allowed MIME types and 20MB limit. |
| **Contact form does not send email** | Email env vars not set. | Set `EMAIL_USER` and `EMAIL_APP_PASSWORD` (or `APP_PASSWORD`). Form still saves to DB without them. |
| **Dashboard shows "Checking admin session…" forever** | /me request failing (network, 5xx, CORS). | Check Network tab for `/api/admin/auth/me`; fix server or CORS. Auth context retries on 5xx. |
| **CI fails (pnpm / typecheck)** | Repo has npm lockfile but CI uses pnpm; or typecheck script missing. | Align: use `pnpm install` and commit `pnpm-lock.yaml`, or switch CI to npm. Add `"typecheck": "tsc --noEmit"` to package.json if CI runs typecheck. |

---

## Decision trees

### If login fails

1. Is the DB reachable? (Check `DB_*`, Trusted Sources, MySQL running.)  
   - No → Fix DB connectivity.  
   - Yes → Continue.
2. Does the admin user exist in **this** DB? (Same `DB_NAME`, same host.)  
   - No → Create admin in this DB (`create-isyn-admin` or `create-isyn-admin:do`).  
   - Yes → Continue.
3. Is the password correct? (Case-sensitive; use reset via script or DB if needed.)  
   - No → Reset password (script or manual bcrypt hash).  
   - Yes → Check rate limit (429?) and JWT_SECRET (production must be set).

### If upload fails

1. Is Blob upload used?  
   - Yes → Is `BLOB_READ_WRITE_TOKEN` set? Is file type in allowlist? Is size ≤ 20MB?  
   - No (DB upload) → Is auth present? Is size ≤ 20MB? Check route error response.

### If 500 on admin route

1. Check server logs for the route (message, stack).  
2. Is it DB-related? (ER_*, connection.) → Fix DB env or connectivity.  
3. Is it JWT_SECRET? (Production.) → Set JWT_SECRET.  
4. Is it missing table? → Run migrations or schema-ensure.  
5. Otherwise → Treat as application bug; collect request path, method, and log snippet.

---

## Escalation and logs to collect

When escalating (e.g. to team or vendor), collect:

- **Request:** URL path, method, whether auth was sent (cookie/Bearer).  
- **Response:** Status code, response body (redact tokens if needed).  
- **Environment:** Development or production; `NODE_ENV`.  
- **Server logs:** Relevant lines from Vercel Functions or dev terminal (errors, stack).  
- **DB:** Whether `npm run db:studio` (or direct DB access) shows expected data for the operation.  
- **Repro steps:** Minimal steps to reproduce (e.g. "Login with user X on production after deploy Y").

No request ID exists in the app; use timestamp and path to correlate logs with requests.
