# Backend guide

This document covers the server-side structure: route layout, validation, DB access, uploads, and how to add a new endpoint safely.

---

## Table of contents

1. [Routing and controller layout](#routing-and-controller-layout)
2. [Service layer and validation](#service-layer-and-validation)
3. [DB access and transactions](#db-access-and-transactions)
4. [Background jobs](#background-jobs)
5. [File upload handling](#file-upload-handling)
6. [Adding a new endpoint](#adding-a-new-endpoint)

---

## Routing and controller layout

- **Next.js Route Handlers:** Each API route is a file `app/api/.../route.ts` that exports HTTP method handlers: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- **URL mapping:** Folder structure under `app/api/` maps to path segments. Examples:
  - `app/api/contact/route.ts` → `/api/contact`
  - `app/api/admin/board-members/route.ts` → `/api/admin/board-members`
  - `app/api/admin/board-members/[id]/route.ts` → `/api/admin/board-members/:id`
- **No separate controllers:** Logic lives in the route file. Shared logic is in `app/lib/` (auth, rate-limit, db, sanitize, etc.).

**Admin route pattern:** First line of each handler:

```ts
const authResult = await requireAuth(request);
if (authResult instanceof NextResponse) return authResult;
```

Then parse body, validate, call DB, return `NextResponse.json(...)`.

---

## Service layer and validation

- **No dedicated service layer.** Business logic is in the route handler or inline. Reusable helpers are in `app/lib/` (e.g. auth, blob-token, resolve-image-src).
- **Validation:** Done inside each route. No central Zod/Joi schema; required fields and types are checked manually (e.g. `if (!name || !email) return NextResponse.json({ error: '...' }, { status: 400 })`). Contact route validates phone format (11 digits, 09 prefix); upload routes validate MIME type and size.
- **Where validation lives:** Contact: `app/api/contact/route.ts`. Admin CRUD: in each `app/api/admin/<resource>/route.ts` (body shape and required fields).

---

## DB access and transactions

- **DB instance:** `import { db } from '@/app/db'` (Drizzle). Schema: `import { tableName } from '@/app/db/schema'`.
- **Pattern:** `db.select()`, `db.insert()`, `db.update()`, `db.delete()` with Drizzle query builders. All queries are parameterized (no raw SQL with user input).
- **Retry:** `withRetry()` in `app/db/index.ts` for connection errors (retries on ER_CON_COUNT_ERROR, ECONNRESET, etc.). Use it for critical reads/writes if you want automatic retry.
- **Transactions:** No explicit transaction pattern in the codebase. For multi-step writes that must be atomic, use Drizzle transactions (e.g. `db.transaction(async (tx) => { ... })`) and document in the route.

---

## Background jobs

- **None.** There are no queues, workers, or cron jobs in the repository. Email sending in the contact route is synchronous. For heavy or deferred work, you would need to add a job system (e.g. queue + worker or serverless cron).

---

## File upload handling

| Mechanism | Route(s) | Flow |
|-----------|----------|------|
| **Vercel Blob** | `app/api/admin/upload-blob/route.ts` | Client uses `@vercel/blob/client` `handleUpload`. Route uses `handleUpload` from `@vercel/blob/client` with `onBeforeGenerateToken` (auth, MIME allowlist) and `onUploadCompleted` (optional DB record). Token from `app/lib/blob-token.ts` (BLOB_READ_WRITE_TOKEN). |
| **DB single** | `app/api/admin/upload/route.ts` | Multipart or base64; max 20MB. Stores in `images` table (base64 in `data`). Auth required. |
| **DB chunked** | `app/api/admin/upload-chunk/route.ts`, `upload-finalize/route.ts` | Chunks uploaded via upload-chunk; upload-finalize assembles and creates/updates `images` and `image_chunks`. Auth required. |

**Allowed types (upload-blob):** image/png, image/jpeg, image/jpg, image/gif, image/webp, video/mp4, video/webm, video/quicktime, video/x-msvideo. SVG is explicitly disallowed (script risk). **Size:** 20MB limit enforced in upload route.

---

## Adding a new endpoint

### Public GET (e.g. new content endpoint)

1. Create folder and file: `app/api/<path>/route.ts` (or `[id]/route.ts` for by-id).
2. Export `export async function GET(request: Request, { params }: { params: Promise<{ id?: string }> }) { ... }`.
3. Parse `params` if dynamic; query DB (or other source); return `NextResponse.json(data)` or appropriate response. No auth.

### Admin endpoint (auth required)

1. Create folder and file: `app/api/admin/<resource>/route.ts` (and optionally `[id]/route.ts`).
2. At the start of each handler:
   ```ts
   import { requireAuth } from '@/app/lib/auth-middleware';
   const authResult = await requireAuth(request);
   if (authResult instanceof NextResponse) return authResult;
   ```
3. Parse body with `await request.json()` (for POST/PUT/PATCH); validate required fields and types; return 400 on validation failure.
4. Use `db` from `@/app/db` and tables from `@/app/db/schema` for reads/writes. Return 200/201 with JSON or 404/500 as appropriate.
5. If the resource has an `[id]` segment, use `params` from the second argument: `const { id } = await params;`.

### RequireUser (when userId is needed)

For routes that need the current user id (e.g. media ownership):

```ts
import { requireUser } from '@/app/lib/auth-middleware';
const { userId, username } = await requireUser(request); // throws if 401
```

### Errors and security

- Return **400** for validation errors with a clear `error` message.
- Return **401** only via `requireAuth`/`requireUser` (do not leak whether resource exists).
- Do **not** log passwords or tokens. In development, 500 responses may include `details`; ensure production does not expose stack traces or secrets (already gated by `NODE_ENV` in existing routes).
- **File uploads:** Validate MIME type and size; store outside web root or use Blob; do not execute user content. See [SECURITY.md](SECURITY.md).

### Example skeleton (admin POST create)

```ts
// app/api/admin/my-resource/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { myTable } from '@/app/db/schema';

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { name, value } = body;
    if (!name || value == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const [row] = await db.insert(myTable).values({ name, value }).$returningId();
    return NextResponse.json({ success: true, id: row.id }, { status: 201 });
  } catch (error) {
    console.error('Create error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
```

After adding a route, document it in [API_REFERENCE.md](API_REFERENCE.md).
