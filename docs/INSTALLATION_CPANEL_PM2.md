# Installation on cPanel / WHM with PM2

This guide covers deploying the iSynergies Next.js app on a **cPanel/WHM server** using **PM2** to run the Node.js app. The production server environment differs from localhost and Vercel (no serverless, single Node process, your own MySQL and env vars).

---

## Table of contents

1. [Environment differences (localhost vs Vercel vs cPanel)](#environment-differences)
2. [Prerequisites](#prerequisites)
3. [Server setup (Node, PM2)](#server-setup)
4. [Application setup](#application-setup)
5. [Environment variables](#environment-variables)
6. [Build and run with PM2](#build-and-run-with-pm2)
7. [Reverse proxy (Nginx/Apache)](#reverse-proxy)
8. [Database and admin user](#database-and-admin-user)
9. [Post-install checks](#post-install-checks)
10. [Troubleshooting](#troubleshooting)

---

## Environment differences

| Aspect | Localhost | Vercel | cPanel/WHM + PM2 |
|--------|-----------|--------|-------------------|
| **Runtime** | Single `next dev` | Serverless functions | Single Node process (`next start`) |
| **Config** | `.env` file | Project env vars in dashboard | `.env` or PM2 `env` in app folder |
| **Database** | Often `localhost` MySQL | Remote DB (e.g. DigitalOcean) | Same server or remote MySQL |
| **Uploads** | Optional Vercel Blob | Vercel Blob | Vercel Blob token *or* DB-only uploads |
| **URL** | `http://localhost:3000` | `https://your-app.vercel.app` | `https://yourdomain.com` (via proxy) |
| **Port** | 3000 | N/A | e.g. 3000; proxy forwards 80/443 to it |

**Code notes:** The app uses `process.env` for all config (no hardcoded localhost in API logic). Set `NODE_ENV=production`, `BASE_URL` or `NEXT_PUBLIC_SITE_URL` to your public URL, and ensure `JWT_SECRET` is set on the server.

---

## Prerequisites

- **cPanel/WHM** with SSH access (or terminal access).
- **Node.js 20 LTS** (required; app and Next.js 16 target Node 20).
- **npm** (or pnpm; this doc uses `npm`).
- **MySQL** (same server or remote) with a database and user for the app.
- **PM2** installed globally: `npm install -g pm2`.

Optional: **Nginx** or **Apache** as reverse proxy in front of the Node app (recommended for HTTPS and port 80/443).

---

## Server setup

### 1. Node.js 20

If Node is not 20, use **nvm** or your distro’s method:

```bash
# Example with nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc   # or reopen terminal
nvm install 20
nvm use 20
node -v   # v20.x.x
```

### 2. PM2

```bash
npm install -g pm2
pm2 -v
```

---

## Application setup

### 1. Clone and install

```bash
cd /home/youruser   # or your preferred path (e.g. cPanel’s recommended app dir)
git clone https://github.com/avnixm/isynergies-web.git
cd isynergies-web
npm install
```

Use the same branch/tag you want in production (e.g. `git checkout main`).

### 2. Environment file

Create `.env` in the project root (same folder as `package.json`). Do **not** commit this file.

```bash
cp .env.example .env   # if you have one; otherwise create .env manually
nano .env
```

See [Environment variables](#environment-variables) below for required and optional keys.

---

## Environment variables

Set these in `.env` on the server. Required for production:

| Variable | Required | Example | Notes |
|----------|----------|---------|--------|
| `NODE_ENV` | Yes | `production` | Enables secure cookies, HSTS, hides stack traces. |
| `JWT_SECRET` | Yes | (long random string) | **Must** be set in production; app will throw if missing. |
| `DB_HOST` | Yes | `localhost` or `your-mysql-host` | MySQL host (often `localhost` on same server). |
| `DB_PORT` | No | `3306` | MySQL port. |
| `DB_USER` | Yes | `isyn_user` | MySQL user. |
| `DB_PASSWORD` | Yes | (secret) | MySQL password. |
| `DB_NAME` | No | `isynergies` | Database name. |
| `DB_SSL` | No | `true` / `false` | Use `true` if MySQL is remote and supports TLS. |

**Recommended for production:**

| Variable | Example | Notes |
|----------|---------|--------|
| `BASE_URL` or `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` | Used for links in emails and redirects. |
| `EMAIL_USER` | `your@gmail.com` | SMTP user for contact form. |
| `EMAIL_APP_PASSWORD` or `APP_PASSWORD` | (app password) | For Gmail or SMTP auth. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | — | If not using Gmail, set your SMTP server. |

**Optional (admin uploads):**

| Variable | Notes |
|----------|--------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token if you use Blob storage for media. You can use a Vercel Blob token even when the app runs on cPanel; uploads will go to Vercel Blob. Without it, video uploads go to the database (single-request or chunked; see `SINGLE_VIDEO_UPLOAD`). |
| `SINGLE_VIDEO_UPLOAD` | Set to `true` to disable chunked video uploads (recommended for cPanel/PM2). When `true`, videos are sent in one HTTP request; max size is **20MB** when Blob is not configured. Avoids reconstruction issues on the same server. Omit or set to `false` to allow chunked uploads for larger files. |

**Example minimal production `.env`:**

```env
NODE_ENV=production
JWT_SECRET=your-long-random-secret-at-least-32-chars
DB_HOST=localhost
DB_PORT=3306
DB_USER=isyn_user
DB_PASSWORD=your_db_password
DB_NAME=isynergies
BASE_URL=https://yourdomain.com
```

---

## Build and run with PM2

### 1. Build

From the project root:

```bash
npm run build
```

This creates the `.next` folder. Run this after every code or env change that requires a rebuild.

### 2. Port

Next.js listens on `PORT` if set, otherwise 3000. To use a specific port (e.g. for proxy):

```bash
export PORT=3000
# or in .env: PORT=3000
```

### 3. PM2 ecosystem file (recommended)

Create `ecosystem.config.cjs` in the project root:

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'isynergies-web',
      cwd: __dirname,
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '.env',
      error_file: '~/.pm2/logs/isynergies-web-error.log',
      out_file: '~/.pm2/logs/isynergies-web-out.log',
    },
  ],
};
```

If PM2 does not load `.env` automatically, set env in the app (e.g. `env_file` or `env` in the config), or source `.env` before starting (see Troubleshooting).

### 4. Start with PM2

```bash
cd /path/to/isynergies-web
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # follow the command it prints to enable start on boot
```

Useful commands:

```bash
pm2 status
pm2 logs isynergies-web
pm2 restart isynergies-web
pm2 stop isynergies-web
```

### 5. After code updates

```bash
cd /path/to/isynergies-web
git pull
npm install
npm run build
pm2 restart isynergies-web
```

---

## Reverse proxy

To serve the app on port 80/443 and add HTTPS, put Nginx (or Apache) in front of the Node app.

### Nginx (example)

App listening on `127.0.0.1:3000`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Reload Nginx after editing config. On cPanel, you may use the Nginx/Proxy configuration interface if available.

### Apache (example, with mod_proxy)

```apache
ProxyPreserveHost On
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
```

Ensure `BASE_URL` or `NEXT_PUBLIC_SITE_URL` is `https://yourdomain.com` so the app generates correct links.

---

## Database and admin user

### 1. Create database and user (MySQL)

Create a database and a user with full access to it (e.g. via phpMyAdmin or MySQL CLI), then set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `.env`.

### 2. Run migrations

From the project root with production `.env` in place:

```bash
npm run db:migrate
# or, if you use schema push: npm run db:push
```

### 3. Create admin user

Create the first admin user in the production database:

```bash
# With Node/tsx (if tsx is installed)
npm run create-isyn-admin

# Or use the DO script with production env vars set
node scripts/create-isyn-admin-do.js
```

Follow the prompts (username, password). Then log in at `https://yourdomain.com/admin/login`.

---

## Post-install checks

1. **Homepage:** Open `https://yourdomain.com` — no console errors, sections load.
2. **Admin login:** Open `https://yourdomain.com/admin/login`, log in with the admin you created.
3. **Dashboard:** After login, open a section that uses the API (e.g. Board Members); data should load.
4. **Contact form:** Submit the contact form; expect success (and email if configured).
5. **Logs:** `pm2 logs isynergies-web` — no repeated DB or JWT errors.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| **App won’t start** | `pm2 logs` for errors; ensure `JWT_SECRET` and all `DB_*` are set. Run `npm run build` and then `pm2 restart`. |
| **502 Bad Gateway** | Proxy can’t reach Node. Confirm app is listening: `pm2 status`, and that proxy points to the same port (e.g. 3000). |
| **DB connection errors** | `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` correct; MySQL allows connections from this host; if remote, `DB_SSL=true` and firewall/allowlist. |
| **Login returns 401** | `JWT_SECRET` set and same on every run; admin user exists in the DB you’re using (run create-isyn-admin again if needed). |
| **Env vars not loaded** | PM2 may not load `.env`. In `ecosystem.config.cjs` set `env_file: '.env'` or export vars before `pm2 start`: `set -a && source .env && set +a && pm2 start ecosystem.config.cjs`. |
| **Uploads fail** | If using Vercel Blob, set `BLOB_READ_WRITE_TOKEN`. If not using Blob, ensure DB-based upload routes and DB are working. With `SINGLE_VIDEO_UPLOAD=true`, video files must be under 20MB. |
| **Dashboard reloads or logs out when returning to tab (Chromium)** | The app uses cookie + optional Bearer for auth. Ensure the reverse proxy (Nginx/Apache) forwards the `Cookie` header and does not strip it. Use `proxy_set_header Cookie $http_cookie` (Nginx) or equivalent so the auth cookie reaches the Node app. Serve the site over HTTPS and set `NODE_ENV=production` so the `Secure` cookie is valid. |

For more deployment and config details, see [DEPLOYMENT.md](DEPLOYMENT.md) and [CONFIGURATION.md](CONFIGURATION.md).
