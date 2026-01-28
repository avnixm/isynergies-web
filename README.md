# iSynergies Web

Next.js app for **iSynergies Inc.** — marketing site (Hero, Services, Projects, Shop, About Us, Team, Contact) and admin dashboard for content management.

---

## Prerequisites

- **Node.js** 18+ (recommend 20 LTS)
- **npm** (or yarn / pnpm)
- **MySQL** 8+ (local or remote, e.g. Aiven, PlanetScale)

---

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd isynergies-web
npm install
```

### 2. Environment variables

Copy the example below into a `.env` file in the project root. Fill in your values.

```bash
# --- Database (required for app + admin) ---
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=isynergies
# Set to "true" for cloud MySQL (e.g. Aiven) with SSL
DB_SSL=false

# --- Admin auth (required for /admin dashboard) ---
# Use a long, random string in production
JWT_SECRET=your-secret-key-change-this-in-production

# --- Optional: Contact form email ---
# If missing, contact form submits but emails are not sent (warning logged).
EMAIL_USER=your@gmail.com
EMAIL_APP_PASSWORD=your_app_password
# Alternative to EMAIL_APP_PASSWORD
# APP_PASSWORD=your_app_password

# Optional: custom "From" display name
# EMAIL_FROM=iSynergies Contact

# Optional: custom SMTP (defaults to Gmail if only EMAIL_USER + APP_PASSWORD)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURE=false

# Optional: site URL for redirects / links in emails
# NEXT_PUBLIC_SITE_URL=https://yoursite.com
# BASE_URL=https://yoursite.com

# --- Optional: Vercel Blob storage (images / media uploads) ---
# Required for admin image uploads, hero video, featured app, etc.
# Use BLOB_READ_WRITE_TOKEN from Vercel project → Storage → .env.local
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

### 3. Database

Create a MySQL database named `isynergies` (or your `DB_NAME`). Then run migrations:

```bash
npm run db:push
```

Or use the setup script (creates tables from schema):

```bash
npm run db:setup
```

For **production** DB (uses `DB_*` from `.env`):

```bash
npm run db:setup:prod
```

### 4. Create an admin user

Use your preferred method to insert an admin into `admin_users` (email, hashed password). The app uses **bcrypt** for passwords. You can use a small script or Drizzle Studio:

```bash
npm run db:studio
```

---

## Run the app

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Dev server at [http://localhost:3000](http://localhost:3000) |
| `npm run build`| Production build               |
| `npm run start`| Run production server          |

- **Landing page:** [http://localhost:3000](http://localhost:3000)  
- **Admin dashboard:** [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)  
- **Admin login:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## Environment variables reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes* | MySQL host (default: `localhost`) |
| `DB_PORT` | No | MySQL port (default: `3306`) |
| `DB_USER` | Yes* | MySQL user |
| `DB_PASSWORD` | Yes* | MySQL password |
| `DB_NAME` | No | Database name (default: `isynergies`) |
| `DB_SSL` | No | `"true"` for SSL (e.g. cloud MySQL) |
| `JWT_SECRET` | Yes (admin) | Secret for admin JWT; use a strong random value in production |
| `EMAIL_USER` | No | SMTP user / Gmail address for contact form |
| `EMAIL_APP_PASSWORD` | No | App password (Gmail) or SMTP password; alt: `APP_PASSWORD` |
| `EMAIL_FROM` | No | Custom "From" name for emails |
| `SMTP_HOST` | No | Custom SMTP host (else Gmail) |
| `SMTP_PORT` | No | SMTP port (default: `587`) |
| `SMTP_SECURE` | No | `"true"` for TLS |
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL for redirects/emails |
| `BASE_URL` | No | Fallback for site URL |
| `BLOB_READ_WRITE_TOKEN` | No** | Vercel Blob token for uploads |

\* Database is required for the app and admin.  
\** Needed for admin image/media uploads, hero video, featured app assets, etc. If missing, those features will not work.

---

## Other npm scripts

| Script | Description |
|--------|-------------|
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run migrate-images-to-media` | Migrate legacy images to media |

Additional `*:prod` scripts (e.g. `add-team-groups-migration:prod`, `clear-team-data:prod`) are for production DB operations. Use with care.

---

## Deploy (Vercel)

1. Connect the repo to [Vercel](https://vercel.com).
2. Add all required env vars in **Project → Settings → Environment Variables** (including `DB_*`, `JWT_SECRET`, and `BLOB_READ_WRITE_TOKEN` if you use Blob).
3. Deploy. The app uses the **Next.js** framework and is compatible with Vercel’s default build settings.

---

## Tech stack

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4**
- **Drizzle ORM** + **MySQL**
- **Vercel Blob** (optional, for uploads)
- **Jose** (JWT), **bcryptjs**, **nodemailer**
