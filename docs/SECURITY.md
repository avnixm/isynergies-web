# Security

This document describes the security model: threat model and mitigations, dependency management, secure coding practices, content sanitization, file upload security, auth hardening, and incident response.

---

## Table of contents

1. [Threat model and mitigations](#threat-model-and-mitigations)
2. [Dependency management](#dependency-management)
3. [Secure coding practices](#secure-coding-practices)
4. [Content sanitization (XSS)](#content-sanitization-xss)
5. [File upload security](#file-upload-security)
6. [Auth hardening](#auth-hardening)
7. [Incident response](#incident-response)

---

## Threat model and mitigations

| Risk | Mitigation |
|------|-------------|
| **Unauthenticated access to admin** | Every admin API route calls `requireAuth()` or `requireUser()`. Login rate limited (10/15min per IP). `/api/users` disabled (403/405). |
| **Brute-force login** | In-memory rate limit on login; 429 with Retry-After. Generic "Invalid credentials" (no enumeration). |
| **Stored XSS** | All CMS content rendered with `dangerouslySetInnerHTML` is passed through `sanitizeHtml()` (DOMPurify allowlist) in `app/lib/sanitize.ts`. |
| **Token theft (XSS)** | httpOnly cookie for API auth; token also in localStorage (documented risk). CSP and sanitization reduce XSS surface. |
| **CSRF** | SameSite=Strict cookie; no GET mutations for sensitive actions. |
| **User enumeration** | Users endpoint disabled; login returns same message for invalid user or wrong password. |
| **File upload abuse** | Allowed MIME types in upload-blob; SVG disallowed; 20MB max in upload route; Blob or DB storage (not executed). |
| **Weak JWT** | Production requires non-empty, non-placeholder JWT_SECRET (app throws on startup otherwise). |
| **Sensitive data in responses** | 500 responses include stack/details only when `NODE_ENV === 'development'`. |

---

## Dependency management

- **Lockfile:** `package-lock.json` (npm) is present. Use `npm ci` for reproducible installs. CI uses pnpm; consider aligning lockfile and CI.
- **Audit:** Run `npm audit` (or `pnpm audit`) and address critical/high vulnerabilities. No automated audit in CI in repo; add if desired.
- **Updates:** Keep Next.js, React, Drizzle, jose, bcryptjs, and isomorphic-dompurify updated for security fixes. Review release notes before upgrading.
- **Known mitigations:** isomorphic-dompurify used for XSS; jose for JWT (algorithm fixed); bcrypt for passwords. No known dangerous patterns in current deps.

---

## Secure coding practices

- **Auth:** Every new admin route must call `requireAuth(request)` (or `requireUser(request)`) first. No global auth middleware; per-route enforcement.
- **Input:** No raw SQL with user input; Drizzle uses parameterized queries. Validate required fields and types in routes; return 400 on validation failure.
- **Output:** Do not log passwords or tokens. Do not attach stack traces or internal details to production 500 responses (already gated by NODE_ENV).
- **Headers:** Security headers set in `middleware.ts` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP, HSTS in production).
- **Secrets:** Never commit `.env`; use platform env vars in production. JWT_SECRET must be strong and unique in production.

---

## Content sanitization (XSS)

- **Rule:** Any HTML from CMS or user content that is rendered with `dangerouslySetInnerHTML` must be passed through **`sanitizeHtml()`** from `app/lib/sanitize.ts`.
- **Implementation:** DOMPurify (isomorphic-dompurify) with an allowlist: tags such as p, br, strong, em, a, ul, ol, li, span, div, h1–h6, blockquote, hr; attributes href, target, rel, class. Scripts and event handlers are stripped.
- **Where applied:** Services, BoardOfDirectors, Team, Projects, AboutUs, WhatWeDo, Shop, CategoryStrip (all CMS fields rendered on the public site).
- **Gotcha:** Adding new CMS-rendered fields requires wrapping with `sanitizeHtml()` before `dangerouslySetInnerHTML`.

---

## File upload security

- **Allowed types (upload-blob):** image/png, image/jpeg, image/jpg, image/gif, image/webp; video/mp4, video/webm, video/quicktime, video/x-msvideo. **SVG is disallowed** (script-in-SVG risk).
- **Size:** 20 MB max enforced in `app/api/admin/upload/route.ts`; 413 when exceeded.
- **Storage:** Files stored in Vercel Blob (signed URLs) or in DB (base64); not under web root as filesystem paths. Public access via `/api/images/[id]` or redirect to Blob.
- **Auth:** All upload endpoints require admin auth.
- **No execution:** Uploaded content is not executed; images/videos are served with correct Content-Type. No server-side image processing that could be exploited (e.g. ImageMagick); Blob serves as-is.

---

## Auth hardening

- **JWT:** HS256; 7-day expiry; secret from env (required in production, no placeholder). Token in httpOnly cookie (primary) and optional Bearer header.
- **Cookie:** Secure in production, SameSite=Strict, httpOnly, path=/. Logout clears cookie.
- **Rate limiting:** Login 10/15min per IP; contact 5/min per IP. In-memory (per-instance in serverless); for global limits use Redis or platform rate limiting.
- **Password:** bcrypt (cost 10) for admin users; created via script (`create-isyn-admin`) or manually; no password in API responses or logs.

---

## Incident response

### Token compromise (admin JWT)

1. **Rotate secret:** Change `JWT_SECRET` in production env to a new strong random value.
2. **Redeploy** so all new requests use the new secret; existing tokens become invalid.
3. **Notify** admins to log in again. No server-side session store; rotation invalidates all tokens immediately.

### Suspected data leak

1. **Contain:** Revoke or rotate affected credentials (DB, email, Blob token if exposed).
2. **Assess:** Determine scope (logs, DB dump, env exposure). Check 500 responses and logs for sensitive data.
3. **Rotate:** JWT_SECRET, DB password, email app password, Blob token as needed. Update env and redeploy.
4. **Notify:** Per policy (users, regulators if applicable). Document in [CHANGELOG.md](CHANGELOG.md) under Security if public.

### Unauthorized access to admin

1. **Confirm:** Check logs and auth failures; verify requireAuth is on all admin routes.
2. **Rotate:** JWT_SECRET and admin passwords; ensure admin users exist only in the intended DB.
3. **Harden:** Review rate limit and consider additional controls (e.g. IP allowlist, MFA) if required.

For full findings and verification steps, see the repository’s **SECURITY-AUDIT.md** (root).
