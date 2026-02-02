# Data model

This document describes the database schema: entities, fields, relationships, lifecycle, and how to change the schema safely.

---

## Table of contents

1. [Overview](#overview)
2. [Entities](#entities)
3. [Relationships (logical)](#relationships-logical)
4. [Migrations](#migrations)
5. [Data integrity and validation](#data-integrity-and-validation)

---

## Overview

- **ORM:** Drizzle ORM.
- **Database:** MySQL 8+.
- **Schema definition:** `app/db/schema.ts`.
- **Connection:** `app/db/index.ts` (pool, `withRetry`).
- **Foreign keys:** Not defined in the schema; relationships are logical (application-enforced). Referential integrity (e.g. `team_members.groupId` → `team_groups.id`) is maintained in application code.

---

## Entities

Each table is defined in `app/db/schema.ts`. Types below are logical (varchar → string, int → number, etc.).

### admin_users

**Purpose:** Admin CMS users (login).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| username | varchar(100) | NOT NULL, UNIQUE | Login name. |
| password | varchar(255) | NOT NULL | bcrypt hash. |
| email | varchar(255) | NOT NULL, UNIQUE | — |
| created_at | timestamp | default now | — |
| updated_at | timestamp | default now, on update now | — |

**Lifecycle:** Created via script `npm run create-isyn-admin` (or manually). Never deleted by app by default.

---

### site_settings

**Purpose:** Global site config (company info, logo, contact email).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| company_name | varchar(255) | NOT NULL | — |
| company_address | text | NOT NULL | — |
| company_phone | varchar(50) | NOT NULL | — |
| company_email | varchar(255) | NOT NULL | — |
| contact_forward_email | varchar(255) | nullable | Where contact form emails are sent. |
| company_facebook, company_twitter, company_instagram | varchar(255) | nullable | — |
| logo_image | varchar(255) | nullable | Image ID or URL. |
| updated_at | timestamp | default now, on update now | — |

**Lifecycle:** Single row (or first row) used; updated via admin Site Settings.

---

### about_us

**Purpose:** About Us section content (paragraphs, mission, vision).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int | PK, autoincrement | — |
| title | varchar(255) | NOT NULL | — |
| paragraph1 … paragraph5 | text | NOT NULL | — |
| mission_title, mission_text | varchar/text | NOT NULL | — |
| vision_title, vision_text | varchar/text | NOT NULL | — |
| gallery_image | varchar(255) | nullable | — |
| updated_at | timestamp | default now, on update now | — |

**Lifecycle:** Single/first row; updated via admin About Us.

---

### about_us_gallery_images

**Purpose:** Gallery images for About Us.

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| image | varchar(255) | NOT NULL | Image ID or URL. |
| alt | varchar(255) | NOT NULL, default 'About Us gallery image' | — |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### board_members

**Purpose:** Board of directors (name, position, image).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| first_name, last_name, position | varchar(100) | NOT NULL | — |
| image | varchar(255) | NOT NULL | Image ID or URL. |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### board_settings

**Purpose:** Board section footer text.

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| footer_text | text | NOT NULL | — |
| updated_at | timestamp | default now, on update now | — |

---

### services

**Purpose:** Services list (title, description, icon).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| title, description | varchar(255) / text | NOT NULL | — |
| icon | varchar(255) | NOT NULL | Image ID or URL. |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### ticker_items

**Purpose:** Ticker bar items (services section).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| text | varchar(255) | NOT NULL | — |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### services_list

**Purpose:** Bullet list items under services section.

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| label | varchar(255) | NOT NULL | — |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### services_section

**Purpose:** Services section header (title, description).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int | PK, autoincrement | — |
| title, description | varchar(255) / text | NOT NULL | — |
| updated_at | timestamp | default now, on update now | — |

---

### statistics

**Purpose:** “By the numbers” stats (label, value).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| label | varchar(100) | NOT NULL | — |
| value | varchar(50) | NOT NULL | Display value (e.g. "50+"). |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### projects

**Purpose:** Projects (title, year, subtitle, description, category, thumbnails/screenshots).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| title, year, subtitle | varchar | NOT NULL | year length 4. |
| description | text | NOT NULL | — |
| category | varchar(50) | NOT NULL | — |
| thumbnail, screenshot1 … screenshot4 | varchar(255) | nullable | Image IDs or URLs. |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### team_groups

**Purpose:** Team groups (e.g. departments); display_order is UNIQUE.

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| name | varchar(255) | NOT NULL | — |
| display_order | int | NOT NULL, UNIQUE | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### team_members

**Purpose:** Team members (name, position, image, optional group).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| name, position | varchar(255) | NOT NULL | — |
| image | varchar(255) | nullable | Image ID or URL. |
| display_order | int | NOT NULL, default 0 | — |
| group_id | int | nullable | Logical FK → team_groups.id. |
| group_order | int | nullable | Order within group. |
| is_featured | boolean | NOT NULL, default false | — |
| created_at, updated_at | timestamp | default now / on update now | — |

**Relationship:** `group_id` references `team_groups.id` in application logic; no DB FK.

---

### shop_categories

**Purpose:** Shop categories (name, text, image).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| name, text | varchar(255) | NOT NULL | — |
| image | varchar(255) | NOT NULL | Image ID or URL. |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### shop_content

**Purpose:** Shop section content (title, description, icons, URL).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int | PK, autoincrement | — |
| title, description | varchar(255) / text | NOT NULL | — |
| sales_icon, authorized_dealer_image | varchar(255) | nullable | Image IDs or URLs. |
| shop_url | varchar(500) | nullable | — |
| updated_at | timestamp | default now, on update now | — |

---

### authorized_dealers

**Purpose:** Authorized dealers (name, image).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| name | varchar(255) | NOT NULL | — |
| image | varchar(255) | NOT NULL | Image ID or URL. |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### hero_section

**Purpose:** Hero section config (logos, background, video, hero images toggle).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| we_make_it_logo, is_logo, full_logo | varchar(255) | nullable | — |
| background_image, background_video | varchar(255) | nullable | — |
| hero_images_background_image | varchar(255) | nullable | — |
| use_hero_images | boolean | default false | — |
| updated_at | timestamp | default now, on update now | — |

---

### hero_ticker_items

**Purpose:** Hero ticker items.

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| text | varchar(500) | NOT NULL | — |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### hero_images

**Purpose:** Hero image carousel.

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| image | varchar(255) | NOT NULL | Image ID or URL. |
| alt | varchar(255) | NOT NULL, default 'Hero image' | — |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### contact_messages

**Purpose:** Contact form submissions.

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| name, email, contact_no, message | varchar/text | NOT NULL | — |
| project_id | int | nullable | — |
| project_title | varchar(255) | nullable | — |
| wants_demo | boolean | default false | — |
| demo_month, demo_day, demo_year, demo_time | varchar | nullable | — |
| status | varchar(50) | NOT NULL, default 'new' | — |
| admin_notes | text | nullable | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### images

**Purpose:** Uploaded images (and some videos) stored in DB (base64 or chunked).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| filename | varchar(255) | NOT NULL | — |
| mime_type | varchar(100) | NOT NULL | — |
| size | int | NOT NULL | Bytes. |
| data | longtext | NOT NULL | Base64 or empty when chunked. |
| url | varchar(500) | nullable | Vercel Blob URL if migrated. |
| is_chunked | int | default 0 | 1 if stored in image_chunks. |
| chunk_count | int | default 0 | — |
| created_at | timestamp | default now | — |

---

### image_chunks

**Purpose:** Chunks for large images/videos (chunked upload).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| image_id | int | NOT NULL | Logical FK → images.id. |
| chunk_index | int | NOT NULL | 0-based. |
| data | longtext | NOT NULL | Base64 chunk. |
| created_at | timestamp | default now | — |

**Relationship:** `image_id` references `images.id`; reassembly in `app/api/images/[id]/route.ts`.

---

### what_we_do

**Purpose:** What We Do section (main text, tagline).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int | PK, autoincrement | — |
| main_text, tagline | text | NOT NULL | — |
| updated_at | timestamp | default now, on update now | — |

---

### what_we_do_images

**Purpose:** What We Do images.

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| image | varchar(255) | NOT NULL | Image ID or URL. |
| alt | varchar(255) | NOT NULL, default 'What we do image' | — |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### featured_app

**Purpose:** Featured app section (single row: header, download/visit text, store images, gradient, etc.).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| header_image, item_type | varchar | nullable | item_type default 'app'. |
| download_text, app_store_image, google_play_image, app_gallery_image | varchar(255) | nullable | — |
| visit_text, website_url | varchar(255/500) | nullable | — |
| logo_image, gradient_from, gradient_to, gradient_direction | varchar | nullable | — |
| app_logo, powered_by_image | varchar(255) | nullable | — |
| banner_height | varchar(20) | default 'h-60' | — |
| updated_at | timestamp | default now, on update now | — |

---

### featured_app_carousel_images

**Purpose:** Carousel images for featured app.

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| image | varchar(255) | NOT NULL | Image ID or URL. |
| alt | varchar(255) | NOT NULL, default 'Featured app carousel image' | — |
| media_type | varchar(20) | default 'image' | — |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### featured_app_features

**Purpose:** Feature items under featured app (icon, label).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| featured_app_id | int | NOT NULL | Logical FK → featured_app.id. |
| icon_image | varchar(255) | NOT NULL | Image ID or URL. |
| label | varchar(100) | NOT NULL | — |
| display_order | int | NOT NULL, default 0 | — |
| created_at, updated_at | timestamp | default now / on update now | — |

**Relationship:** `featured_app_id` references `featured_app.id` in application logic.

---

### videos

**Purpose:** Video metadata (user uploads; blob URL).

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| user_id | int | NOT NULL | Admin user ID. |
| title | varchar(255) | NOT NULL | — |
| blob_url | varchar(500) | NOT NULL | Vercel Blob URL. |
| content_type | varchar(100) | NOT NULL | — |
| size_bytes | int | NOT NULL | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

### media

**Purpose:** Media (images/videos) metadata; Blob URL.

| Field | Type | Constraints | Notes |
|-------|------|--------------|-------|
| id | int | PK, autoincrement | — |
| user_id | int | NOT NULL | Admin user ID. |
| url | text | NOT NULL | Vercel Blob URL. |
| type | varchar(20) | NOT NULL | e.g. 'image', 'video'. |
| content_type | varchar(100) | NOT NULL | MIME type. |
| size_bytes | int | NOT NULL | — |
| title | varchar(255) | nullable | — |
| created_at, updated_at | timestamp | default now / on update now | — |

---

## Relationships (logical)

- **team_members.group_id** → **team_groups.id** (optional; no FK).
- **image_chunks.image_id** → **images.id** (no FK).
- **featured_app_features.featured_app_id** → **featured_app.id** (no FK).
- **videos.user_id** / **media.user_id** → **admin_users.id** (no FK).

All FKs are enforced in application code (API routes), not at the database level.

---

## Migrations

- **Generated migrations:** `drizzle/` (e.g. `0000_curious_ultimatum.sql`, `0001_team_groups.sql`).
- **Journal:** `drizzle/meta/_journal.json`.
- **Config:** `drizzle.config.ts` (reads `DB_*` from env).

**Commands:**

- `npm run db:generate` — Generate a new migration from schema changes (drizzle-kit generate).
- `npm run db:migrate` — Run pending migrations (drizzle-kit migrate).
- `npm run db:push` — Push schema to DB without migration files (drizzle-kit push); good for dev.
- `npm run db:studio` — Open Drizzle Studio.

**Adding a new migration safely:**

1. Edit `app/db/schema.ts` (add/change tables or columns).
2. Run `npm run db:generate`; review the new SQL in `drizzle/`.
3. Run `npm run db:migrate` against the target DB (or use `db:push` in dev).
4. For production: back up DB first; run migrations during or after deploy as per [DEPLOYMENT.md](DEPLOYMENT.md).

**Note:** `POST /api/admin/schema-ensure` (with auth) can create missing tables (e.g. `about_us_gallery_images`, `featured_app_carousel_images`) without running full migrations. Use for one-off fixes; prefer migrations for versioned schema changes.

---

## Data integrity and validation

- **Client:** Forms validate required fields and formats (e.g. contact phone 11 digits, 09 prefix) before submit.
- **Server:** API routes validate required fields and types (e.g. in `app/api/contact/route.ts`, `app/api/admin/*/route.ts`); return 400 with a message on failure.
- **Database:** NOT NULL and defaults are defined in the schema; no CHECK constraints or triggers in the current schema. Application code is responsible for not inserting invalid references (e.g. valid `group_id` when updating team members).
