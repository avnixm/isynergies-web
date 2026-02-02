# API reference

This document describes all HTTP API endpoints: method, path, auth, request/response, errors, and rate limits. Auth details are in [AUTHORIZATION.md](AUTHORIZATION.md).

---

## Table of contents

1. [Conventions](#conventions)
2. [Public endpoints](#public-endpoints)
3. [Admin auth endpoints](#admin-auth-endpoints)
4. [Admin CRUD and utility endpoints](#admin-crud-and-utility-endpoints)
5. [Error responses](#error-responses)

---

## Conventions

- **Base URL:** Same origin as the app (e.g. `http://localhost:3000` or production domain).
- **Auth (admin):** Send either `Cookie: admin_token=<jwt>` (same-origin) or `Authorization: Bearer <jwt>`.
- **Content type:** JSON request bodies use `Content-Type: application/json`.
- **Rate limits:** Login: 10 requests per IP per 15 minutes. Contact: 5 requests per IP per minute. Other endpoints: no rate limit in app (in-memory limiter is per-instance).
- **Pagination/sorting:** Not standardized; most list endpoints return full array. Order is typically by `displayOrder` or `createdAt` where applicable.
- **Idempotency:** Not explicitly implemented; POST create is not idempotent.

---

## Public endpoints

### GET /api/images/[id]

Serves an image or media by ID. Looks up `images` then `media`; if record has a Blob URL, redirects (302/307). Otherwise streams from DB (base64 decoded). Supports `Range` for video.

| Item | Details |
|------|---------|
| Auth | None |
| Params | `id` — numeric image or media ID |
| Response | 200: binary (image/video), or 302/307 redirect to Blob URL. 404: not found. 500: server error. |
| File | `app/api/images/[id]/route.ts` |

---

### GET /api/media/[id]

Serves media metadata or redirect. Used for admin-uploaded media (e.g. video) by ID.

| Item | Details |
|------|---------|
| Auth | None |
| Params | `id` — numeric media ID |
| Response | Depends on implementation (redirect or JSON). 404/500 on error. |
| File | `app/api/media/[id]/route.ts` |

---

### POST /api/contact

Contact form submission. Saves to `contact_messages` and optionally sends email (if EMAIL_* configured).

| Item | Details |
|------|---------|
| Auth | None |
| Rate limit | 5 per IP per minute. 429 with `Retry-After: 60` when exceeded. |
| Body | `name`, `email`, `contactNo`, `message` (required). Optional: `projectId`, `projectTitle`, `wantsDemo`, `demoMonth`, `demoDay`, `demoYear`, `demoTime` (required when `wantsDemo` is true). |
| Validation | Phone: exactly 11 digits, must start with `09`. |
| Response | 201: `{ success: true, message: 'Message sent successfully!' }`. 400: validation error. 429: rate limit. 500: server error. |
| File | `app/api/contact/route.ts` |

**Example request body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "contactNo": "09171234567",
  "message": "Hello, I would like more information."
}
```

---

### GET /api/users

Disabled. Returns 403.

| Item | Details |
|------|---------|
| Auth | N/A |
| Response | 403: `{ error: 'This endpoint is disabled for security.' }` |
| File | `app/api/users/route.ts` |

---

### POST /api/users

Disabled. Returns 405.

| Item | Details |
|------|---------|
| Auth | N/A |
| Response | 405: `{ error: 'Method not allowed. Use admin user creation script with hashed passwords.' }` |
| File | `app/api/users/route.ts` |

---

## Admin auth endpoints

### POST /api/admin/auth/login

Authenticates an admin and sets session cookie.

| Item | Details |
|------|---------|
| Auth | None (login) |
| Rate limit | 10 attempts per IP per 15 minutes. 429 with `Retry-After` when exceeded. |
| Body | `username` (string), `password` (string). |
| Response | 200: `{ success: true, token, user: { id, username, email } }` and `Set-Cookie: admin_token=<jwt>`. 400: missing fields. 401: `{ error: 'Invalid credentials' }`. 429: rate limit. 500: server error. |
| File | `app/api/admin/auth/login/route.ts` |

**Cookie:** `admin_token`; httpOnly, Secure in production, SameSite=Strict, maxAge 7 days.

---

### POST /api/admin/auth/logout

Clears the admin session cookie.

| Item | Details |
|------|---------|
| Auth | None (clears cookie regardless) |
| Response | 200; `Set-Cookie` clears `admin_token`. |
| File | `app/api/admin/auth/logout/route.ts` |

---

### GET /api/admin/auth/me

Returns the current authenticated admin user.

| Item | Details |
|------|---------|
| Auth | Required (Cookie or Bearer) |
| Response | 200: `{ user: { id, username, email } }`. 401: not authenticated or invalid token. 404: user not in DB. 500: server error. |
| File | `app/api/admin/auth/me/route.ts` |

---

## Admin CRUD and utility endpoints

All admin routes below require auth via `requireAuth(request)` (or `requireUser(request)` where noted). Missing or invalid token returns **401** `{ error: 'Authentication required' }` or `{ error: 'Invalid or expired token' }`.

**Pattern:** Most resources follow:

- **GET** `/api/admin/<resource>` — List all (or single row for singleton).
- **POST** `/api/admin/<resource>` — Create.
- **GET** `/api/admin/<resource>/[id]` — Get one by id.
- **PUT** or **PATCH** `/api/admin/<resource>/[id]` — Update.
- **DELETE** `/api/admin/<resource>/[id]` — Delete.

Request/response shapes are defined in each route file. Below is an index by resource and file path.

| Resource | Path prefix | File (route.ts under app/api/admin/) | Notes |
|----------|-------------|--------------------------------------|-------|
| About Us | about-us | about-us/route.ts | Singleton content. |
| About Us gallery images | about-us/gallery-images | about-us/gallery-images/route.ts, gallery-images/[id]/route.ts | CRUD for gallery. |
| Board members | board-members | board-members/route.ts, board-members/[id]/route.ts | GET list is public (used by landing). |
| Board settings | board-settings | board-settings/route.ts | Singleton. |
| Services | services | services/route.ts, services/[id]/route.ts | — |
| Services list | services-list | services-list/route.ts, services-list/[id]/route.ts | Bullet list items. |
| Services section | services-section | services-section/route.ts | Singleton. |
| Statistics | statistics | statistics/route.ts, statistics/[id]/route.ts | — |
| Ticker (services) | ticker | ticker/route.ts, ticker/[id]/route.ts | — |
| Hero section | hero-section | hero-section/route.ts | Singleton. |
| Hero ticker | hero-ticker | hero-ticker/route.ts, hero-ticker/[id]/route.ts | — |
| Hero images | hero-images | hero-images/route.ts, hero-images/[id]/route.ts | — |
| Projects | projects | projects/route.ts, projects/[id]/route.ts | — |
| Team | team | team/route.ts, team/[id]/route.ts | — |
| Team groups | team-groups | team-groups/route.ts, team-groups/[id]/route.ts, team-groups/[id]/members/route.ts, team-groups/featured/route.ts | — |
| Shop | shop | shop/route.ts | Singleton content. |
| Shop categories | shop/categories | shop/categories/route.ts, shop/categories/[id]/route.ts | — |
| Authorized dealers | authorized-dealers | authorized-dealers/route.ts, authorized-dealers/[id]/route.ts | — |
| Featured app | featured-app | featured-app/route.ts | Singleton. |
| Featured app carousel | featured-app/carousel | featured-app/carousel/route.ts, featured-app/carousel/[id]/route.ts | — |
| Featured app features | featured-app/features | featured-app/features/route.ts, featured-app/features/[id]/route.ts | — |
| What We Do | what-we-do | what-we-do/route.ts | Singleton. |
| What We Do images | what-we-do/images | what-we-do/images/route.ts, what-we-do/images/[id]/route.ts | — |
| Contact messages | contact-messages | contact-messages/route.ts, contact-messages/[id]/route.ts | List/update messages. |
| Site settings | site-settings | site-settings/route.ts | Singleton. |
| Blobs | blobs | blobs/route.ts | List/utility for Vercel Blob. |
| Upload (DB) | upload | upload/route.ts | Single file to DB (max 20MB). |
| Upload chunk | upload-chunk | upload-chunk/route.ts | Chunked upload (chunk). |
| Upload finalize | upload-finalize | upload-finalize/route.ts | Finalize chunked upload. |
| Upload Blob | upload-blob | upload-blob/route.ts | Vercel Blob client upload (handleUpload). |
| Create image from blob | create-image-from-blob | create-image-from-blob/route.ts | Create DB image from Blob URL. |
| Delete blob | delete-blob | delete-blob/route.ts | Delete Blob object. |
| Cleanup blobs | cleanup-blobs | cleanup-blobs/route.ts | Utility cleanup. |
| Find image by URL | find-image-by-url | find-image-by-url/route.ts | Query param `url` or `filename`. |
| Find media by URL | find-media-by-url | find-media-by-url/route.ts | Query param. |
| Find media unified | find-media-unified | find-media-unified/route.ts | Unified lookup. |
| Admin images [id] | images/[id] | images/[id]/route.ts | GET/PUT/DELETE image by id. |
| Admin media | media | media/route.ts | List/create (requireUser). |
| Admin media [id] | media/[id] | media/[id]/route.ts | GET/DELETE (requireUser). |
| Schema ensure | schema-ensure | schema-ensure/route.ts | POST: create missing tables. |
| Team migrate | team-migrate | team-migrate/route.ts | Migration utility. |

**requireUser vs requireAuth:** `requireUser` is used for `media` and `videos` routes (returns `userId` for ownership); behavior is the same as requireAuth (any valid admin). No role-based permissions.

For exact request body schemas and response shapes, see the corresponding `app/api/admin/<path>/route.ts` file.

---

## Error responses

| Status | Meaning | Body shape |
|--------|---------|------------|
| 400 | Bad request (validation, missing fields) | `{ error: string }` |
| 401 | Unauthenticated or invalid/expired token | `{ error: 'Authentication required' }` or `{ error: 'Invalid or expired token' }` |
| 403 | Forbidden (e.g. users endpoint disabled) | `{ error: string }` |
| 404 | Not found | `{ error: string }` |
| 405 | Method not allowed | `{ error: string }` |
| 413 | Payload too large (e.g. upload over 20MB) | `{ error: string }` |
| 429 | Rate limit exceeded | `{ error: string }`, header `Retry-After` |
| 500 | Server error | `{ error: string }`; in development may include `details`, `code` |

All JSON error responses use an `error` string message. Pagination and filtering conventions are not defined; list endpoints return full arrays ordered by display order or id.
