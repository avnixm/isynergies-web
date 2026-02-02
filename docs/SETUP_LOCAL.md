# Local development setup

Step-by-step guide to get from a fresh clone to a running app locally. For environment variable details see [CONFIGURATION.md](CONFIGURATION.md).

---

## Table of contents

1. [Prerequisites](#prerequisites)
2. [Exact steps (clone to running)](#exact-steps-clone-to-running)
3. [Running tests](#running-tests)
4. [Common failures and fixes](#common-failures-and-fixes)

---

## Prerequisites

- **Node.js** 20 LTS (recommended); minimum 18+.
- **npm** (or pnpm; repo has `package-lock.json`).
- **MySQL** 8+ running locally or reachable (e.g. Docker, local install, or remote with network access).

---

## Exact steps (clone to running)

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd isynergies-web
npm install
```

If you use pnpm (CI uses pnpm): `pnpm install`. Ensure lockfile is present for reproducible installs.

### 2. Environment file

Create a `.env` file in the project root. Minimum for local dev:

```bash
# Database (required)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=isynergies

# Admin auth (required for /admin)
JWT_SECRET=any-random-string-for-dev

# Optional: contact form email (if missing, form still saves to DB)
# EMAIL_USER=your@gmail.com
# EMAIL_APP_PASSWORD=your_app_password

# Optional: Vercel Blob for admin uploads
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

See [CONFIGURATION.md](CONFIGURATION.md) for all variables, defaults, and security notes.

### 3. Database

Create the MySQL database (if it does not exist):

```sql
CREATE DATABASE isynergies CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then apply the schema. Either:

**Option A — Push schema (recommended for dev):**

```bash
npm run db:push
```

**Option B — Setup script (creates tables from schema):**

```bash
npm run db:setup
```

**Option C — Run migrations:**

```bash
npm run db:migrate
```

Use the same `DB_*` values as in `.env`. For a remote DB (e.g. DigitalOcean), set `DB_SSL=true` and ensure the machine’s IP is in Trusted Sources.

### 4. Create an admin user

Create at least one admin so you can log in:

**Local DB (uses `.env`):**

```bash
npm run create-isyn-admin
```

**Production/remote DB (e.g. DigitalOcean; often uses `.env.do`):**

```bash
npm run create-isyn-admin:do
```

Follow prompts (username, password, email). Passwords are hashed with bcrypt before insert. If the script fails, ensure `DB_*` in `.env` (or `.env.do`) point to the DB where you ran `db:push` / `db:setup`.

### 5. Run the app

```bash
npm run dev
```

- **Landing page:** [http://localhost:3000](http://localhost:3000)
- **Admin login:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Admin dashboard:** [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard) (after login)

### 6. Optional: Drizzle Studio

To inspect or edit data:

```bash
npm run db:studio
```

Opens Drizzle Studio (default port 4983 or similar); uses `DB_*` from `.env` via `drizzle.config.ts`.

---

## Running tests

**There is no automated test suite in the repository** (no Jest, Vitest, or test script in `package.json`). Quality is enforced by:

- **Lint:** `npm run lint` (ESLint).
- **Build:** `npm run build` (includes type-checking).

CI (`.github/workflows/ci.yml`) runs lint, typecheck, and build on push/PR to `main` and `develop`. To mimic locally:

```bash
npm run lint
npm run build
```

If CI uses pnpm and you use npm, ensure `npm run build` succeeds; add `"typecheck": "tsc --noEmit"` to `package.json` if you want an explicit typecheck step.

---

## Common failures and fixes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **Port 3000 already in use** | Another process on 3000. | Stop the other process or run on a different port: `npm run dev -- -p 3001`. |
| **MySQL connection refused** | Wrong host/port, or MySQL not running. | Check `DB_HOST`, `DB_PORT`; ensure MySQL is running; for remote DB check firewall and Trusted Sources. |
| **ER_ACCESS_DENIED_ERROR** | Wrong user/password or DB name. | Verify `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `.env`. |
| **ER_BAD_DB_ERROR** | Database does not exist. | Create DB: `CREATE DATABASE isynergies;` then run `npm run db:push` or `db:setup`. |
| **connect ETIMEDOUT** (remote MySQL) | Network or firewall blocking. | For Vercel/cloud: add deployment IP (or 0.0.0.0/0) to DB Trusted Sources; set `DB_SSL=true`; optionally increase `DB_CONNECT_TIMEOUT`. |
| **Invalid credentials** on admin login | Admin user not in the DB the app uses, or wrong password. | Ensure you created the admin in the same DB (same `DB_*`). Use `npm run create-isyn-admin` for local DB. Username/password are case-sensitive. |
| **JWT_SECRET must be set** (production) | Running with `NODE_ENV=production` and missing or default JWT_SECRET. | Set `JWT_SECRET` to a long random value in env. For local prod-like run, use a strong secret. |
| **Upload fails / Blob error** | Blob upload used but token missing. | Set `BLOB_READ_WRITE_TOKEN` from Vercel project → Storage, or use DB-only upload (upload route) which does not require Blob. |
| **CORS / API 401** | Request from different origin without credentials, or cookie not sent. | Admin API expects same-origin requests with cookie (or `Authorization: Bearer`). Ensure you are on the same origin when testing from the dashboard. |
| **CI fails (pnpm)** | Repo has `package-lock.json` (npm) but CI uses pnpm. | Run `pnpm install` and commit `pnpm-lock.yaml`, or change CI to use npm and `npm ci`. |
| **Build fails (Turbopack)** | Next.js 16 uses Turbopack by default; occasional internal errors. | Retry build; if it persists, check Next.js config for disabling Turbopack if supported, or report upstream. |

---

## Gotchas

- **Two databases:** If you run `db:push` against local MySQL but deploy to Vercel with production DB env vars, the production DB has the data. Create the admin in the **production** DB (e.g. `create-isyn-admin:do`) for production login.
- **Email:** Without `EMAIL_USER` and `EMAIL_APP_PASSWORD`, the contact form still inserts into `contact_messages` but does not send email (a warning is logged).
- **Rate limiting:** Login is limited to 10 attempts per IP per 15 minutes; contact form to 5 per IP per minute. If you hit the limit during testing, wait or use another IP / incognito.
