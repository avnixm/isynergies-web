# Security Audit Report — iSynergies Web (Public + Admin CMS)

**Date:** 2026-02-02  
**Scope:** Full codebase (public site, admin dashboard, API routes, auth, uploads, email, DB)

---

## 1) SECURITY MAP (File Paths + Responsibilities)

### Stack & Entry Points
| Area | Technology | Location |
|------|------------|----------|
| Frontend | Next.js 16 (App Router), React 19 | `app/`, `app/page.tsx`, `app/layout.tsx` |
| Backend / API | Next.js Route Handlers | `app/api/**/route.ts` |
| DB | Drizzle ORM, MySQL2 | `app/db/index.ts`, `app/db/schema.ts` |
| Auth | JWT (jose), bcrypt | `app/lib/auth.ts`, `app/lib/auth-middleware.ts` |
| Env | `process.env.*` | Used in `app/lib/auth.ts`, `app/db/index.ts`, `app/api/contact/route.ts`, etc. |
| Middleware | **None** | No `middleware.ts`; auth enforced per-route via `requireAuth()` |

### Security-Critical Areas

| Responsibility | File Path(s) |
|----------------|--------------|
| **Auth: login** | `app/api/admin/auth/login/route.ts` |
| **Auth: logout** | `app/api/admin/auth/logout/route.ts` |
| **Auth: /me** | `app/api/admin/auth/me/route.ts` |
| **Auth: token create/verify** | `app/lib/auth.ts` |
| **Auth: request guard** | `app/lib/auth-middleware.ts` |
| **Auth: client state** | `app/lib/auth-context.tsx`, `app/admin/login/page.tsx` (localStorage) |
| **Authorization** | Each admin API route calls `requireAuth(request)`; no role-based checks (single admin) |
| **Admin routes (UI)** | `app/admin/dashboard/**`, `app/admin/login/page.tsx`; protected client-side via `AuthProvider` |
| **Admin API routes** | `app/api/admin/**` — all use `requireAuth` except see findings |
| **Public API routes** | `app/api/contact/route.ts`, `app/api/images/[id]/route.ts`, `app/api/media/[id]/route.ts`, `app/api/users/route.ts` |
| **File upload (DB)** | `app/api/admin/upload/route.ts`, `app/api/admin/upload-chunk/route.ts`, `app/api/admin/upload-finalize/route.ts` |
| **File upload (Vercel Blob)** | `app/api/admin/upload-blob/route.ts`, `app/lib/blob-token.ts` |
| **HTML rendering (public)** | `app/components/Services.tsx`, `BoardOfDirectors.tsx`, `Team.tsx`, `Projects.tsx`, `AboutUs.tsx`, `WhatWeDo.tsx`, `Shop.tsx`, `CategoryStrip.tsx` — all use `dangerouslySetInnerHTML` for CMS content |
| **Email** | `app/api/contact/route.ts` (nodemailer; contact form → DB + optional email) |
| **External integrations** | Vercel Blob (`@vercel/blob`); no payments/SSO |
| **Logging / errors** | Various `console.error`; 500 responses sometimes include `process.env.NODE_ENV === 'development'` details |
| **DB access** | Drizzle ORM (parameterized); raw `connection.execute()` in `app/api/admin/schema-ensure/route.ts`, `app/api/admin/team-migrate/route.ts`, `app/lib/ensure-services-tables.ts` (table names from code, not user input) |
| **Find-by-URL (admin)** | `app/api/admin/find-image-by-url/route.ts`, `find-media-by-url/route.ts`, `find-media-unified/route.ts` — use `url`/filename from query in DB LIKE; no server-side fetch (no SSRF) |

---

## 2) FINDINGS TABLE

| Severity | Issue | Evidence (file path) | Fix summary |
|----------|--------|----------------------|-------------|
| **Critical** | Unauthenticated `/api/users`: GET returns all admin users; POST creates admin user with empty password | `app/api/users/route.ts` (no `requireAuth`; GET/POST expose and mutate `adminUsers`) | Require auth for GET; remove or strictly protect POST; remove or protect `/test-api` page |
| **Critical** | JWT signed with default secret if `JWT_SECRET` unset | `app/lib/auth.ts`: `process.env.JWT_SECRET \|\| 'your-secret-key-change-this-in-production'` | In production, refuse to start or refuse to issue/verify tokens if `JWT_SECRET` is missing or default |
| **High** | Admin token stored in localStorage (XSS can steal); server also sets httpOnly cookie | `app/admin/login/page.tsx` line 39: `localStorage.setItem('admin_token', data.token)`; all admin API calls use `localStorage.getItem('admin_token')` | Prefer cookie-only auth for admin; or document risk and harden XSS mitigations (CSP, sanitization) |
| **High** | CMS content rendered with `dangerouslySetInnerHTML` without sanitization → stored XSS | `app/components/Services.tsx`, `BoardOfDirectors.tsx`, `Team.tsx`, `Projects.tsx`, `AboutUs.tsx`, `WhatWeDo.tsx`, `Shop.tsx`, `CategoryStrip.tsx` | Sanitize HTML (allowlist) before render, or restrict to trusted admin and add CSP |
| **High** | Public `/test-api` page allows listing and creating users (no auth) | `app/test-api/page.tsx` calls `GET/POST /api/users` | Remove in production or protect route and page |
| **Medium** | Login response different for “user not found” vs “password mismatch” → account enumeration | `app/api/admin/auth/login/route.ts` (dev vs prod messages differ; prod still “Invalid credentials”) | Use single generic message for both cases in all environments |
| **Medium** | No rate limiting on admin login → brute force | `app/api/admin/auth/login/route.ts` | Add rate limiting (e.g. by IP or username) |
| **Medium** | No rate limiting on contact form → spam/DoS | `app/api/contact/route.ts` | Add rate limiting by IP (and optionally by email) |
| **Medium** | SVG upload allowed (`image/svg+xml`); SVG can contain scripts → XSS if rendered as image/source | `app/api/admin/upload-blob/route.ts`: `'image/svg+xml'` in allowedTypes | Disallow SVG or sanitize SVG (strip scripts/handlers) before serving |
| **Medium** | Security headers missing (CSP, X-Frame-Options, etc.) | No `middleware.ts` or headers in `next.config.ts` / layout | Add middleware or headers for CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| **Low** | Admin API used by public component without auth (board-members, board-settings) | `app/components/BoardOfDirectors.tsx` fetches `/api/admin/board-members`, `/api/admin/board-settings` | Prefer dedicated public read-only API or explicit allowlist for unauthenticated read |
| **Low** | `sql\`... LIKE ${'%' + filename}\`` — filename from URL; parameterized but LIKE wildcards | `app/api/admin/find-image-by-url/route.ts` (and find-media-*) | Validate/sanitize filename length and characters; escape `%`/`_` if needed |
| **Low** | Upload route has no explicit max body size (rely on runtime) | `app/api/admin/upload/route.ts` | Enforce max file size in code (e.g. 10–20 MB) and return 413 |
| **Low** | 500 errors sometimes include stack/details in development | Multiple API routes | Already gated by `NODE_ENV === 'development'`; ensure production never sends stack |

---

## 3) PATCH SUMMARY (What Was Changed)

See section 4 below for implementation details. Summary of changes:

1. **`app/api/users/route.ts`**  
   - GET: Require admin auth; return 401 if no valid token.  
   - POST: Disabled (return 405) to prevent unauthenticated user creation; create-user flow should use admin-only flow with hashed password.

2. **`app/lib/auth.ts`**  
   - Require `JWT_SECRET` in production: if missing or equal to default placeholder, throw at module load so tokens are never signed/verified with a weak secret.

3. **`app/api/admin/auth/login/route.ts`**  
   - Use a single generic message for both “user not found” and “password mismatch” in all environments (no account enumeration).

4. **`app/test-api/page.tsx`**  
   - Show a “disabled in production” message when `NODE_ENV === 'production'` and do not call `/api/users`; or remove the page (recommended for production).

5. **Security headers**  
   - Add `middleware.ts` to set X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy; optionally add a strict Content-Security-Policy (may require tuning for your scripts/styles).

6. **Contact form rate limiting**  
   - Add a simple in-memory (or Redis) rate limit by IP for `POST /api/contact` (e.g. 5 req/min per IP).

7. **Login rate limiting**  
   - Add a simple in-memory rate limit by IP for `POST /api/admin/auth/login` (e.g. 5 failures per 15 min per IP).

8. **Upload file size**  
   - In `app/api/admin/upload/route.ts`, reject with 413 if `file.size` exceeds a configured max (e.g. 20 MB).

9. **SVG upload**  
   - Remove `image/svg+xml` from allowed types in `app/api/admin/upload-blob/route.ts` until SVG sanitization is in place; or add server-side SVG sanitization and keep it.

---

## 4) VERIFICATION STEPS (How to Validate Each Fix)

- **Users API protected**  
  - Without auth: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users` → expect 401.  
  - With valid admin token: `curl -s -H "Authorization: Bearer <token>" http://localhost:3000/api/users` → expect 200 and list (or 403 if you later add role checks).  
  - POST without auth: expect 401 or 405.

- **JWT_SECRET required in production**  
  - Run with `NODE_ENV=production` and no `JWT_SECRET`: app should fail to start or first login/me should fail with clear error.  
  - Run with `JWT_SECRET` set: login and /me should work.

- **Login enumeration**  
  - Attempt login with non-existent user and with valid user + wrong password: response body message should be identical (e.g. “Invalid credentials”).

- **/test-api**  
  - In production build, visit `/test-api`: should show disabled message or 404; no user list/create from that page.

- **Security headers**  
  - `curl -I http://localhost:3000/` (and a few API routes): check for X-Frame-Options, X-Content-Type-Options, Referrer-Policy (and CSP if added).

- **Contact rate limit**  
  - Send more than N requests per minute from same IP: expect 429 after threshold.

- **Login rate limit**  
  - Send many failed login requests from same IP: expect 429 or lockout after threshold.

- **Upload size**  
  - Upload a file larger than max: expect 413.

- **SVG**  
  - If SVG is disallowed: upload SVG via admin upload-blob; expect 400. If SVG is allowed with sanitization: upload SVG with `<script>` and verify it is stripped when served.

---

## 5) RECOMMENDATIONS (Product / Ops)

- **Auth:** Prefer cookie-only admin auth (httpOnly, Secure, SameSite) and stop storing token in localStorage to reduce XSS impact.
- **CSP:** Add a strict Content-Security-Policy and adjust for your domains and inline scripts; this mitigates XSS and limits impact of unsanitized HTML.
- **HTML:** Sanitize all CMS-sourced HTML (e.g. DOMPurify or a server-side allowlist) before passing to `dangerouslySetInnerHTML`.
- **Rate limiting:** Move to a shared store (e.g. Redis) for production so limits apply across instances.
- **Secrets:** Ensure `JWT_SECRET`, `BLOB_READ_WRITE_TOKEN`, DB and email credentials are never committed; use a secrets manager in production.
- **Dependencies:** Run `npm audit` and fix high/critical; keep Next.js and jose/bcrypt up to date.
