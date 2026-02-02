# Security Audit Report — iSynergies Web

## 1. Security Map (File Paths + Responsibilities)

### Stack & Entry Points
| Area | Technology | Paths |
|------|------------|--------|
| Frontend | Next.js 16 (App Router), React 19 | `app/`, `app/page.tsx`, `app/layout.tsx` |
| Backend / API | Next.js Route Handlers | `app/api/**/route.ts` |
| DB | Drizzle ORM, MySQL2 | `app/db/index.ts`, `app/db/schema.ts` |
| Auth | JWT (jose), bcrypt | `app/lib/auth.ts`, `app/lib/auth-middleware.ts` |
| Env | `process.env.*` | `app/lib/auth.ts`, `app/db/index.ts`, `app/api/contact/route.ts`, etc. |
| Middleware | Next.js Edge | `middleware.ts` (security headers only); auth enforced per-route via `requireAuth()` |

### Security-Critical Areas
| Responsibility | File Path(s) |
|----------------|--------------|
| Auth: login | `app/api/admin/auth/login/route.ts` |
| Auth: logout | `app/api/admin/auth/logout/route.ts` |
| Auth: /me | `app/api/admin/auth/me/route.ts` |
| Auth: token create/verify | `app/lib/auth.ts` |
| Auth: request guard | `app/lib/auth-middleware.ts` |
| Auth: client state | `app/lib/auth-context.tsx`, `app/admin/login/page.tsx` (localStorage + cookie) |
| Authorization | Each admin API route calls `requireAuth()`; single admin role assumed |
| Admin UI routes | `app/admin/dashboard/**`, `app/admin/login/page.tsx` |
| Admin API routes | `app/api/admin/**` (all use `requireAuth` except public GET where intended) |
| Public API | `app/api/contact/route.ts`, `app/api/images/[id]/route.ts`, `app/api/media/[id]/route.ts`, `app/api/users/route.ts` |
| File upload (DB) | `app/api/admin/upload/route.ts`, `upload-chunk`, `upload-finalize` |
| File upload (Vercel Blob) | `app/api/admin/upload-blob/route.ts`, `app/lib/blob-token.ts` |
| HTML rendering (public) | All `dangerouslySetInnerHTML` usages now wrapped with `sanitizeHtml()` — see `app/lib/sanitize.ts` and components below |
| Email | `app/api/contact/route.ts` (nodemailer; contact form → DB + optional email) |
| Rate limiting | `app/lib/rate-limit.ts`; used in login and contact routes |
| Security headers | `middleware.ts` |

---

## 2. Findings Table

| Severity | Issue | Evidence / Path | Fix Summary |
|----------|--------|------------------|-------------|
| **Critical** | Unauthenticated `/api/users` exposed all admin users; POST allowed creating users with empty passwords | `app/api/users/route.ts` | GET requires admin auth; POST disabled (405). |
| **Critical** | Weak/default JWT_SECRET in production | `app/lib/auth.ts` | Enforce non-empty, non-placeholder JWT_SECRET in production. |
| **High** | Admin token also in localStorage (XSS token theft risk) | Client auth flow | Documented; mitigated by httpOnly cookie + sanitization; consider removing localStorage copy in future. |
| **High** | Stored XSS via `dangerouslySetInnerHTML` on CMS content | Services, BoardOfDirectors, Team, Projects, AboutUs, WhatWeDo, Shop, CategoryStrip | Added `sanitizeHtml()` (DOMPurify allowlist) in `app/lib/sanitize.ts`; all CMS HTML rendered through it. |
| **High** | Public `/test-api` page allowed listing/creating users | `app/test-api/page.tsx` | Page disabled in production. |
| **Medium** | Account enumeration on login | `app/api/admin/auth/login/route.ts` | Single generic "Invalid credentials" for both user-not-found and wrong password. |
| **Medium** | No rate limiting on admin login | Login route | In-memory rate limit added: 10 attempts per IP per 15 minutes (`app/lib/rate-limit.ts` + login route). |
| **Medium** | No rate limiting on contact form | Contact route | In-memory rate limit: 5 submissions per IP per minute. |
| **Medium** | SVG upload allowed (script-in-SVG risk) | `app/api/admin/upload-blob/route.ts` | `image/svg+xml` removed from allowed types. |
| **Medium** | Missing security headers | N/A | `middleware.ts` added: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP, HSTS (production). |
| **Low** | Admin API used by public component (BoardOfDirectors) | `app/components/BoardOfDirectors.tsx` | Architectural note; consider dedicated public API. |
| **Low** | LIKE wildcard in find-image-by-url filename | `app/api/admin/find-image-by-url/route.ts` | Recommend validating/sanitizing filename. |
| **Low** | No explicit upload file size limit | Upload routes | Explicit 20 MB max in `app/api/admin/upload/route.ts`; 413 if exceeded. |
| **Low** | Dev-only error details in 500 responses | Various API routes | Already gated by `NODE_ENV === 'development'`. |

---

## 3. Patch Summary (What Changed + Files)

### New Files
- **`middleware.ts`** — Sets security headers on all matching responses: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy, HSTS (production). Does not perform auth.
- **`app/lib/rate-limit.ts`** — In-memory rate limiter (per process). Used by login and contact routes. For multi-instance production, consider Redis (e.g. Upstash) or platform rate limiting.
- **`app/lib/sanitize.ts`** — `sanitizeHtml()` using isomorphic-dompurify with a safe tag/attribute allowlist. Used for all CMS content rendered via `dangerouslySetInnerHTML`.

### Modified Files
- **`app/api/admin/auth/login/route.ts`** — Rate limit before processing (10 attempts per IP per 15 min); 429 with Retry-After when exceeded.
- **`app/api/contact/route.ts`** — Rate limit before processing (5 per IP per minute); 429 with Retry-After when exceeded.
- **`app/components/Services.tsx`** — All `dangerouslySetInnerHTML` values wrapped with `sanitizeHtml()`.
- **`app/components/CategoryStrip.tsx`** — Same.
- **`app/components/Shop.tsx`** — Same.
- **`app/components/BoardOfDirectors.tsx`** — Same.
- **`app/components/Team.tsx`** — Same.
- **`app/components/Projects.tsx`** — Same.
- **`app/components/AboutUs.tsx`** — Same.
- **`app/components/WhatWeDo.tsx`** — Same.

### Dependency Added
- **`isomorphic-dompurify`** — Used by `app/lib/sanitize.ts` for HTML sanitization (server + client).

### Previously Applied (from earlier audit phase)
- **`app/api/users/route.ts`** — GET requires admin auth; POST returns 405.
- **`app/lib/auth.ts`** — Production check for JWT_SECRET (no empty or default placeholder).
- **`app/api/admin/auth/login/route.ts`** — Generic "Invalid credentials" message.
- **`app/api/admin/upload-blob/route.ts`** — SVG removed from allowed MIME types.
- **`app/api/admin/upload/route.ts`** — Explicit 20 MB max file size; 413 if exceeded.
- **`app/test-api/page.tsx`** — Disabled in production.

---

## 4. Verification Steps

### 4.1 Security Headers
1. Start app: `npm run build && npm run start` (or `npm run dev`).
2. Open DevTools → Network; load any page.
3. Select the document request and check Response Headers for:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy` present.
   - In production: `Strict-Transport-Security` present.

### 4.2 Rate Limiting — Login
1. From one IP, send 11+ POST requests to `/api/admin/auth/login` with invalid credentials (e.g. `{"username":"x","password":"y"}`).
2. Expect 429 after the limit (10 per 15 min) with body like `{ "error": "Too many login attempts. Try again later." }` and `Retry-After` header.
3. After waiting (or from another IP), a valid login should still return 200.

### 4.3 Rate Limiting — Contact
1. Submit the contact form (or POST to `/api/contact`) 6+ times within a minute from the same IP.
2. Expect 429 after the limit (5 per minute) with message about too many submissions and `Retry-After: 60`.

### 4.4 XSS Sanitization
1. In admin CMS, add content with HTML/script, e.g. team member name: `<script>alert(1)</script>`, or `<img src=x onerror=alert(1)>`.
2. View the public page that displays that content.
3. Scripts must not execute; only safe tags (e.g. `<p>`, `<strong>`, `<a>`) should be preserved; attributes like `onerror` must be stripped.

### 4.5 Auth & Users API
1. **GET /api/users** without auth → 401.
2. **GET /api/users** with valid admin cookie/header → 200 with user list.
3. **POST /api/users** with body → 405 Method Not Allowed.

### 4.6 JWT_SECRET (Production)
1. Run with `NODE_ENV=production` and no `JWT_SECRET` (or placeholder value).
2. App should fail fast on startup with a clear error about JWT_SECRET.

### 4.7 Test API Page
1. In production build, open `/test-api`.
2. Page should not allow listing or creating users (e.g. disabled or redirect).

### 4.8 Upload
1. Upload a file &gt; 20 MB to the admin upload endpoint → expect 413.
2. Attempt to upload an SVG to the blob upload endpoint → expect rejection (e.g. 400) if SVG is explicitly disallowed.

### 4.9 Regression Checklist (Auth / Admin)
- [ ] Admin login with valid credentials works.
- [ ] Admin logout clears session; subsequent admin API calls return 401.
- [ ] Unauthenticated access to admin dashboard redirects or shows login.
- [ ] Unauthenticated POST to admin APIs returns 401.
- [ ] Contact form still submits successfully under normal use (within rate limit).
- [ ] Public pages that render CMS content still display formatted text correctly (no broken layout from sanitization).

### 4.10 Suggested Automated Tests
- **Unit:** `sanitizeHtml()` strips `<script>`, `onerror`, etc., and keeps safe tags.
- **Integration:** Login route returns 429 after N failed attempts from same IP; contact returns 429 after M submissions.
- **E2E:** Login → access protected admin page → logout → confirm protected page no longer accessible.

### 4.11 Suggested Tools
- **Linting:** ESLint with security-related rules (e.g. no-eval, no-danger).
- **SAST:** Run `npm audit` and address critical/high; consider Snyk or similar for dependency and code checks.
- **Headers:** Use securityheaders.com or similar to validate CSP and other headers in production.

---

*End of Security Audit Report*
