# Contributing

This document covers code style, lint/format/test commands, branching, PR checklist, release process, and how to update docs.

---

## Table of contents

1. [Code style and lint](#code-style-and-lint)
2. [Commands](#commands)
3. [Branching and PR process](#branching-and-pr-process)
4. [Release process](#release-process)
5. [Documentation](#documentation)

---

## Code style and lint

- **ESLint:** Configuration in `eslint.config.mjs`. Uses `eslint-config-next` (core-web-vitals and TypeScript). Run: `npm run lint`.
- **Prettier:** Not in `package.json`. No shared Prettier config in repo. Consider adding Prettier and format-on-save for consistency.
- **TypeScript:** Strict typing; no `any` unless justified. Build runs type-checking.
- **Conventions:** Use `'use client'` only where needed (state, effects, browser APIs). Sanitize all CMS/user HTML with `sanitizeHtml()` before `dangerouslySetInnerHTML`. Admin API routes must call `requireAuth(request)` (or `requireUser(request)`) first.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint. |
| `npm run build` | Production build (includes type-checking). |
| `npm run dev` | Start dev server. |
| `npm run start` | Start production server. |

**Note:** `package.json` does not define a separate `typecheck` script. CI (`.github/workflows/ci.yml`) runs `pnpm typecheck`; if your repo uses npm, add `"typecheck": "tsc --noEmit"` to `package.json` and run it before PRs, or align CI to npm and use `npm run build` as the type-check step.

**CI uses pnpm** (version 8) and Node 20. Repo has `package-lock.json` (npm). To avoid CI failures, either commit a `pnpm-lock.yaml` and use pnpm locally, or change CI to use npm (`npm ci`, `npm run lint`, etc.).

---

## Branching and PR process

- **Branches:** CI runs on push and pull_request to **main** and **develop**. Use feature branches (e.g. `feature/...`, `fix/...`) and open PRs into `main` or `develop` as per team policy.
- **PR checklist:**
  - Lint passes: `npm run lint` (or `pnpm lint`).
  - Build passes: `npm run build` (or `pnpm build`).
  - Manual smoke: Public homepage loads; admin login and at least one admin section work.
  - No secrets or `.env` in the PR.
  - New admin API routes call `requireAuth()` (or `requireUser()`); new CMS-rendered HTML uses `sanitizeHtml()`.
- **Review:** Get review from a maintainer before merge. Resolve CI failures before merge.

---

## Release process

- **Not defined in repo.** No version tags or release workflow in the codebase. Suggested approach:
  - Use **semantic versioning** (e.g. 0.1.0 → 0.2.0 for features, 0.1.1 for fixes).
  - Tag releases (e.g. `git tag v0.2.0`) and document changes in [CHANGELOG.md](CHANGELOG.md).
  - Deploy from main (or release branch) after merge; run DB migrations if needed (see [DEPLOYMENT.md](DEPLOYMENT.md)).

---

## Documentation

- **Location:** All technical docs live under `docs/`. Index: [docs/README.md](README.md).
- **When to update:**
  - New or changed environment variables → [CONFIGURATION.md](CONFIGURATION.md).
  - New or changed API endpoints → [API_REFERENCE.md](API_REFERENCE.md).
  - Auth or permission changes → [AUTHORIZATION.md](AUTHORIZATION.md).
  - Schema or DB changes → [DATA_MODEL.md](DATA_MODEL.md).
  - New pages or major UI structure → [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md).
  - New backend patterns or endpoints → [BACKEND_GUIDE.md](BACKEND_GUIDE.md).
  - Deployment or env changes → [DEPLOYMENT.md](DEPLOYMENT.md).
  - Security-related changes → [SECURITY.md](SECURITY.md) and root [SECURITY-AUDIT.md](../../SECURITY-AUDIT.md) if applicable.
- **Style:** Use clear headings, tables, and relative links between docs. No placeholders (use "Unknown from codebase" only where something cannot be inferred, with a short note). Keep commands and paths accurate for this repo.
