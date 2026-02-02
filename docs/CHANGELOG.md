# Changelog

This file documents notable changes to the project. Format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versioning is not enforced in the repo; this template shows how to document releases.

---

## How to document releases

For each release:

1. **Date** and **version** (e.g. `0.2.0`).
2. **Sections:** Added, Changed, Fixed, Removed, Security (only if security-related).
3. **Entries:** Short, user- or developer-facing descriptions. Link to PRs or issues if desired.

**Example entry:**

```markdown
## [0.2.0] - 2025-02-02

### Added
- Rate limiting for admin login (10 attempts per 15 min per IP).
- HTML sanitization for all CMS content (XSS mitigation).

### Changed
- Contact form rate limited to 5 submissions per minute per IP.
- GET /api/users now returns 403 (endpoint disabled).

### Fixed
- Account enumeration on login (generic "Invalid credentials" message).

### Security
- JWT_SECRET required in production; app throws if missing or placeholder.
- Security headers added (middleware): X-Frame-Options, CSP, HSTS (production).
```

---

## [Unreleased]

- (Add planned changes here.)

---

## [0.1.0] - (date or "Initial release")

- Initial release: Next.js 16 app with public landing, admin CMS, MySQL/Drizzle, JWT auth, contact form, Vercel Blob uploads, and technical documentation set under `docs/`.
