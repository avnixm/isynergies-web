# iSynergies Web — Documentation Index

**Start here.** This index points to all technical documentation for the iSynergies Web project. Use it to onboard, run locally, deploy, debug, and extend the system.

---

## Table of contents

1. [Project inventory](#project-inventory)
2. [System requirements](#system-requirements)
3. [Documentation map](#documentation-map)
4. [Glossary](#glossary)

---

## Project inventory

All paths are relative to the repository root. This inventory is derived from the current codebase.

### Frontend entrypoints

| Purpose | Path |
|--------|------|
| Root layout (fonts, global styles) | `app/layout.tsx` |
| Public landing page (single-page sections) | `app/page.tsx` |
| Admin login page | `app/admin/login/page.tsx` |
| Admin dashboard layout (auth, sidebar) | `app/admin/dashboard/layout.tsx` |
| Admin dashboard pages | `app/admin/dashboard/*/page.tsx` (about-us, board-members, featured-app, hero, messages, projects, services, shop, site-settings, team, what-we-do) |
| Test API page (dev only; disabled in production) | `app/test-api/page.tsx` |

### Backend entrypoints

| Purpose | Path |
|--------|------|
| API routes (Next.js Route Handlers) | `app/api/**/route.ts` |
| No separate backend server; all API is inside the Next.js app. | — |

### Route definitions

**Public routes (no auth):**

- `GET /api/images/[id]` — `app/api/images/[id]/route.ts` — Serve image or media by ID (DB or redirect to Blob).
- `GET /api/media/[id]` — `app/api/media/[id]/route.ts` — Serve media metadata/redirect (admin media table).
- `POST /api/contact` — `app/api/contact/route.ts` — Contact form; rate limited (5/min per IP).
- `GET /api/users` — `app/api/users/route.ts` — **Disabled** (403).
- `POST /api/users` — `app/api/users/route.ts` — **Disabled** (405).

**Admin API routes (auth required via `requireAuth()` or `requireUser()`):**

- Auth: `app/api/admin/auth/login/route.ts`, `logout/route.ts`, `me/route.ts`
- Content CRUD: `app/api/admin/about-us/`, `board-members/`, `board-settings/`, `services/`, `services-list/`, `services-section/`, `statistics/`, `ticker/`, `hero-section/`, `hero-ticker/`, `hero-images/`, `projects/`, `team/`, `team-groups/`, `shop/`, `shop/categories/`, `authorized-dealers/`, `featured-app/`, `featured-app/carousel/`, `featured-app/features/`, `what-we-do/`, `what-we-do/images/`, `site-settings/`
- Contact messages: `app/api/admin/contact-messages/`
- Uploads: `app/api/admin/upload/`, `upload-chunk/`, `upload-finalize/`, `upload-blob/`, `create-image-from-blob/`, `delete-blob/`, `cleanup-blobs/`
- Blobs / media: `app/api/admin/blobs/`, `find-image-by-url/`, `find-media-by-url/`, `find-media-unified/`
- Admin images/media: `app/api/admin/images/[id]/route.ts`, `app/api/admin/media/`, `app/api/admin/media/[id]/route.ts`
- Utilities: `app/api/admin/schema-ensure/`, `app/api/admin/team-migrate/`

**Public GETs used by landing page (no auth):** Several admin content endpoints are called from the public site (e.g. board-members, board-settings) for display; they do not require auth. See [API_REFERENCE.md](API_REFERENCE.md).

### Key modules / services

| Module | Path | Responsibility |
|--------|------|----------------|
| Auth (token create/verify, password) | `app/lib/auth.ts` | JWT sign/verify, bcrypt hash/verify, getTokenFromRequest |
| Auth middleware | `app/lib/auth-middleware.ts` | requireAuth, requireUser (returns 401 or payload) |
| Auth context (client) | `app/lib/auth-context.tsx` | AuthProvider, /me polling, session-expired modal |
| Rate limiting | `app/lib/rate-limit.ts` | In-memory; login 10/15min, contact 5/min |
| HTML sanitization | `app/lib/sanitize.ts` | sanitizeHtml (DOMPurify) for CMS content |
| Blob token | `app/lib/blob-token.ts` | Vercel Blob token for uploads |
| DB connection | `app/db/index.ts` | Drizzle pool, withRetry, closeDatabaseConnections |
| DB schema | `app/db/schema.ts` | All table definitions |
| API error helper | `app/lib/api-error.ts` | Normalized error responses |
| Image src resolution | `app/lib/resolve-image-src.ts` | Logo/image URLs for email etc. |
| Draft persistence | `app/lib/use-draft-persistence.ts` | Admin form draft restore (localStorage) |

### DB models and migrations

| Item | Path |
|------|------|
| Schema (tables) | `app/db/schema.ts` |
| Migrations | `drizzle/0000_curious_ultimatum.sql`, `drizzle/0001_team_groups.sql` |
| Migration journal | `drizzle/meta/_journal.json` |
| Drizzle config | `drizzle.config.ts` |

### Auth and middleware

| Item | Path |
|------|------|
| Security headers (no auth) | `middleware.ts` |
| Auth guard (per-route) | `app/lib/auth-middleware.ts` |
| Token handling | `app/lib/auth.ts` |
| Client auth state | `app/lib/auth-context.tsx` |

### File upload storage

| Mechanism | Path | Storage |
|-----------|------|---------|
| Vercel Blob upload | `app/api/admin/upload-blob/route.ts` | Vercel Blob (optional BLOB_READ_WRITE_TOKEN) |
| DB upload (single) | `app/api/admin/upload/route.ts` | `images` table (base64) |
| Chunked upload | `app/api/admin/upload-chunk/route.ts`, `upload-finalize/route.ts` | `images` + `image_chunks` |
| Public image/media serve | `app/api/images/[id]/route.ts`, `app/api/media/[id]/route.ts` | Read from DB or redirect to Blob URL |

### Third-party integrations

| Integration | Use |
|-------------|-----|
| Vercel Blob | Admin image/media uploads; optional. |
| Nodemailer | Contact form email (SMTP / Gmail). |
| Jose | JWT sign/verify for admin auth. |
| bcryptjs | Password hashing for admin users. |
| isomorphic-dompurify | HTML sanitization for CMS content (XSS). |

### Tests structure

**No automated test suite is present in the repository.** There is no Jest, Vitest, or other test runner in `package.json`. Testing is manual. See [CONTRIBUTING.md](CONTRIBUTING.md) for suggested additions.

### Deployment manifests

| Item | Path |
|------|------|
| CI (lint, typecheck, build) | `.github/workflows/ci.yml` |
| Next.js config | `next.config.ts` |
| No Docker/Kubernetes files in repo. Primary deployment target: **Vercel**. | — |

---

## System requirements

- **OS:** Any; CI runs Ubuntu.
- **Runtime:** Node.js **20** LTS (recommended; CI uses 20). Minimum Node 18+ for local dev.
- **Package manager:** Repo has `package-lock.json` (npm). CI uses **pnpm** 8; align CI to npm or add `pnpm-lock.yaml` for consistency.
- **Database:** MySQL **8+** (local or remote, e.g. DigitalOcean, Aiven).
- **Ports:** 3000 (Next.js app), 3306 (MySQL, if local).

---

## Documentation map

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System and container diagrams, request flow, design decisions, performance notes. |
| [SETUP_LOCAL.md](SETUP_LOCAL.md) | Step-by-step local dev setup, troubleshooting. |
| [CONFIGURATION.md](CONFIGURATION.md) | All environment variables, defaults, security notes. |
| [DATA_MODEL.md](DATA_MODEL.md) | Database schema, entities, relationships, migrations. |
| [API_REFERENCE.md](API_REFERENCE.md) | All API endpoints, auth, request/response, rate limits. |
| [AUTHORIZATION.md](AUTHORIZATION.md) | Auth flows, token/session, guards, failure handling. |
| [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) | Routing, components, state, API client, adding pages. |
| [BACKEND_GUIDE.md](BACKEND_GUIDE.md) | Route layout, validation, DB, uploads, adding endpoints. |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Environments, build, migrations, rollback, runbook. |
| [OBSERVABILITY.md](OBSERVABILITY.md) | Logging, metrics, debugging workflow (gaps noted). |
| [SECURITY.md](SECURITY.md) | Threat model, hardening, sanitization, incident steps. |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues, decision trees, escalation. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Code style, lint, branching, PR, release, docs. |
| [CHANGELOG.md](CHANGELOG.md) | How to document releases; template. |

**Note:** The root [README.md](../README.md) references `docs/RESPONSIVE-LAYOUT-PLAN.md`. That file was not present in the repo when this documentation set was created. If you add it later, link it in this table.

---

## Glossary

| Term | Meaning |
|------|--------|
| **App Router** | Next.js 13+ file-based routing under `app/` (layouts, pages, route handlers). |
| **CMS** | Content Management System; here, the admin dashboard for editing site content. |
| **Drizzle** | TypeScript ORM used for MySQL in this project. |
| **JWT** | JSON Web Token; used for admin session (cookie `admin_token` or Bearer header). |
| **ORM** | Object-Relational Mapping; Drizzle maps tables to TypeScript. |
| **Route Handler** | Next.js API route: `app/api/.../route.ts` exporting GET/POST/PUT/DELETE. |
| **requireAuth** | Server-side guard in `app/lib/auth-middleware.ts`; returns 401 or user payload. |
| **Vercel Blob** | Vercel’s blob storage; used for uploaded images/media when configured. |
