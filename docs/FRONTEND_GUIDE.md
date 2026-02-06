# Frontend guide

This document covers the frontend architecture: routing, components, state, API client, forms, styling, and how to add a new page safely.

---

## Table of contents

1. [Routing structure](#routing-structure)
2. [Component architecture and conventions](#component-architecture-and-conventions)
3. [State management](#state-management)
4. [API client and error handling](#api-client-and-error-handling)
5. [Forms and validation](#forms-and-validation)
6. [File upload UI](#file-upload-ui)
7. [Admin media deletion behavior](#admin-media-deletion-behavior)
8. [Styling and theming](#styling-and-theming)
9. [Adding a new page](#adding-a-new-page)

---

## Routing structure

Next.js **App Router** (file-based under `app/`).

| Route | Path | Purpose |
|-------|------|---------|
| Public landing | `/` | `app/page.tsx` — single page with sections (Hero, About Us, Services, Projects, Shop, Team, Contact). |
| Admin login | `/admin/login` | `app/admin/login/page.tsx` — login form. |
| Admin dashboard | `/admin/dashboard` | `app/admin/dashboard/layout.tsx` + `page.tsx` — dashboard home. |
| Admin sections | `/admin/dashboard/<section>` | e.g. `about-us`, `board-members`, `hero`, `projects`, `services`, `shop`, `team`, `messages`, `site-settings`, `featured-app`, `what-we-do`. Each has `app/admin/dashboard/<section>/page.tsx`. |
| Test API | `/test-api` | `app/test-api/page.tsx` — dev only; disabled in production. |

**Key pages:** `app/page.tsx` composes section components; `app/admin/dashboard/layout.tsx` wraps with AuthProvider, Sidebar, Header, and session-expired modal.

---

## Component architecture and conventions

| Layer | Path | Role |
|-------|------|------|
| **Public sections** | `app/components/` | Hero, AboutUs, WhatWeDo, BoardOfDirectors, Services, Projects, FeaturedApp, Team, Shop, Contact, Footer, FontLoader, SkipLink. |
| **Shared UI** | `app/components/ui/` | badge, button, card, confirm-dialog, dialog, dropdown-menu, image-upload, input, label, loading, media-preview, select, tabs, textarea, toast; plus draft-restore-prompt, session-expired-modal, unsaved-changes-modal, html-tips. |
| **Admin layout** | `app/admin/dashboard/_components/` | Header, Sidebar, StickyFooter. |

**Conventions:**

- Use **`'use client'`** for components that use React state, effects, or browser APIs (e.g. fetch, localStorage).
- **CMS content** rendered with `dangerouslySetInnerHTML` must first be passed through **`sanitizeHtml()`** from `app/lib/sanitize.ts` to prevent XSS.
- Section components typically fetch their data in `useEffect` from public or admin GET endpoints and store in local state; no global data store.

---

## State management

- **No Redux/ Zustand.** State is local to pages/components.
- **Auth:** `AuthProvider` from `app/lib/auth-context.tsx` wraps the dashboard; provides `status`, `user`, `logout`, `checkAuth`, `showSessionExpiredModal`, etc. Token is read from localStorage (and cookie is sent for API calls).
- **UI state:** `ToastProvider` and `ConfirmDialogProvider` wrap dashboard for toasts and confirm dialogs.
- **Draft persistence:** Admin forms that use add/edit dialogs can use `use-draft-persistence.ts` to auto-save drafts to localStorage and show a restore prompt; used on team, board-members, projects, shop, about-us, what-we-do, hero, featured-app, services, messages.

---

## API client and error handling

- **fetch** with same-origin requests; cookies are sent by default. For admin API, no need to set Authorization if cookie is present; some code may set `Authorization: Bearer` from localStorage for consistency.
- **Error handling:** API errors return JSON with `error` string. Client shows toasts or inline messages. On 401/403 from /me or protected calls, auth context sets session-expired modal and/or redirects to login after user confirmation.
- **Resilience:** Auth context retries /me on 5xx and network errors with backoff; does not treat those as immediate logout to avoid kicking users on transient failures.

---

## Forms and validation

- **Client-side:** Required fields and basic format checks (e.g. phone 11 digits, 09 prefix in Contact) before submit.
- **Server-side:** All mutations validate in the route; 400 with `{ error: '...' }` on failure. Client should display the returned message.
- **Draft restore:** Where draft persistence is used, opening a dialog may show "Unsaved draft found" and offer to restore; user can dismiss or restore.

---

## File upload UI

- **ImageUpload / media components** in `app/components/ui/` (e.g. `image-upload.tsx`, `media-preview.tsx`) are used in admin forms.
- Upload flow: either **Vercel Blob** (upload-blob route) or **chunked DB upload** (upload-chunk + upload-finalize). Choice is determined by the admin page and API it calls.
- **Behavior:** User selects file; client sends to the appropriate endpoint (with auth cookie); progress/success/error shown in UI.

---

## Admin media deletion behavior

- **Single source of truth:** Media and large uploads are represented primarily by rows in the `media` table, which often point to `/api/images/:imageId`.
- **Trash icons in admin UIs:**
  - Components like `ImageUpload` and `VideoUpload` always try to delete via `DELETE /api/admin/media/:id` first when the stored value is a numeric ID.
  - If no `media` row exists, they fall back to `DELETE /api/admin/images/:id`.
  - When the value is a URL (`/api/images/:id` or `/api/media/:id`), they call the corresponding admin delete route directly.
- **Backend cleanup:**
  - `DELETE /api/admin/media/:id` removes the `media` row and, when it points at `/api/images/:imageId`, also deletes the corresponding `images` + `image_chunks` rows.
  - `DELETE /api/admin/images/:id` also removes any `media` rows whose `url` is `/api/images/:id`, then deletes the `images` + `image_chunks` rows.
  - Featured App carousel deletion also attempts to clean up any underlying `media`/`images` entries when a carousel item is deleted.
- **What this means for admins:**
  - Deleting via any trash icon that comes from `ImageUpload` or `VideoUpload` automatically cleans up the associated database records where it is safe to do so.
  - You no longer need to ask for manual database cleanup when an uploaded image or video is removed from an admin form.

---

## Styling and theming

- **Tailwind CSS 4**; global styles in `app/globals.css`.
- **Font:** Encode Sans Expanded loaded in `app/layout.tsx` (next/font/google); CSS variable `--font-encode-sans-expanded` and `className` applied to body.
- **No formal theme object** in codebase; colors and spacing are Tailwind classes. Admin dashboard uses a consistent set of borders and backgrounds (e.g. `border-border`, `bg-white`).

---

## Adding a new page

### Public page (new section on landing)

1. Create a new component in `app/components/` (e.g. `NewSection.tsx`). Use `'use client'` if it has state or effects. Fetch data in `useEffect` from the appropriate API (public or admin GET). Sanitize any HTML with `sanitizeHtml()` before `dangerouslySetInnerHTML`.
2. Import and render the component in `app/page.tsx` in the desired order.
3. Add a nav link in the Hero (or relevant) component if the section should be in the menu (`navLinks` in `app/page.tsx`).

### Admin dashboard page

1. Create `app/admin/dashboard/<section>/page.tsx`. Use `'use client'` and wrap content with the dashboard layout (already provided by parent layout).
2. Use `useAuth()` from `app/lib/auth-context.tsx` if you need user/status. Fetch data from `/api/admin/<resource>` with credentials (cookie sent automatically).
3. Add a sidebar link in `app/admin/dashboard/_components/sidebar.tsx` (or equivalent) so the section appears in the admin nav.
4. Optional: Add draft persistence for form dialogs using `use-draft-persistence.ts` and `DraftRestorePrompt` (see existing admin pages for pattern).
5. Ensure any user-supplied HTML rendered in the UI is passed through `sanitizeHtml()`.

### Gotchas

- **Auth:** Dashboard layout redirects to `/admin/login` when `status === 'unauthenticated'`. Do not assume user is always present until status is `authenticated`.
- **CORS:** Same-origin; no CORS config needed for same-domain API calls. If you add a different API origin, configure CORS on the server and credentials if needed.
- **Sanitization:** Any CMS or user content rendered with `dangerouslySetInnerHTML` must use `sanitizeHtml()` to prevent XSS.
