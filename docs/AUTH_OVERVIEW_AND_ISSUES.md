# Admin auth: flow and issues (overview)

## 1. Auth flow (end-to-end)

### Server-side (token and API)

| Piece | Location | Role |
|-------|----------|------|
| **Login** | `POST /api/admin/auth/login` | Accepts username/password, checks DB, returns JWT. Rate-limited (10 attempts / 15 min). |
| **Token** | `app/lib/auth.ts` | `createToken({ userId, username })` → JWT (7d expiry, HS256). `verifyToken(token)` → payload or null. `getTokenFromRequest(request)` reads `Authorization: Bearer <token>` or cookie `admin_token`. |
| **Session check** | `GET /api/admin/auth/me` | Reads token from request, verifies JWT, loads user from DB. Returns `{ user }` or 401/404/500. |
| **Protected APIs** | e.g. `app/api/admin/team/route.ts` | Use `requireAuth(request)` from `app/lib/auth-middleware.ts`; 401 if no/invalid token. |

Token is stored **client-side in `localStorage`** under `admin_token`. Login page sets it after success; dashboard and AuthProvider send it as `Authorization: Bearer <token>` on fetch.

### Client-side: two possible guards

The repo has **two** client-side auth mechanisms. Only one is currently used by the dashboard layout.

#### A. Dashboard layout (currently in use)

- **File:** `app/admin/dashboard/layout.tsx`
- **Behavior:** On mount, runs `checkAuth()` once: GET `/api/admin/auth/me` with token. If no token or `!response.ok` → clear token, show “Session expired” modal, then redirect to `/admin/login?returnTo=<pathname>`. If OK → set user, set `loading` false, render sidebar + header + children.
- **No** focus or visibility listeners; no periodic recheck. Session-expired modal uses the layout’s own state; login page reads `returnTo` and redirects back after login.

#### B. Auth context (available, not used by layout)

- **File:** `app/lib/auth-context.tsx`
- **Exports:** `AuthProvider`, `useAuth()`.
- **Behavior:** Provides `status` (`checking` | `authenticated` | `unauthenticated` | `session_expired` | `error`), `user`, `checkAuth`, `logout`, `showSessionExpiredModal`, etc. On mount runs `checkAuth()`. Also subscribes to **window `focus`** and **document `visibilitychange`**: when the tab is focused or becomes visible, runs a “silent” recheck (no full-screen “Checking…”). Uses in-memory cache (`app/admin/dashboard/_lib/cache.ts`: `getCachedUser` / `setCachedUser`, 5 min TTL) to show user instantly while revalidating. Debounces checks (min 5s between runs). On 5xx/network errors, retries with backoff (1s, 3s, 10s); on 401/403 shows session-expired modal and clears token.
- **Usage:** Docs (e.g. FRONTEND_GUIDE, AUTHORIZATION) describe wrapping the dashboard with `AuthProvider` and using `useAuth()`. The **current** `layout.tsx` does **not** import or use `AuthProvider`; it uses its own `checkAuth` and loading state. If you switch the dashboard to wrap with `AuthProvider` and render by `status`, the behavior below applies.

---

## 2. Problems that were triggered (and fixes)

### Problem 1: “Reload” when focusing the admin tab (especially Chromium)

- **Symptom:** Switching back to the admin tab (or after ~1–1.5 min in Chromium) made the whole admin UI “reload”: full-screen “Checking admin session” then content again, or content unmounting/remounting. Console showed `[Auth] Tab focused - checking auth` then `[Auth] Auth success`.
- **Cause:** When using **AuthProvider**, a `focus` (and later `visibilitychange`) listener calls `checkAuth()`. That used to set `status` to `'checking'` whenever `!wasAuthenticatedRef.current`. After a remount (e.g. Chromium restoring the tab after throttling), the ref resets to `false`, so the recheck set `status` to `'checking'`. Any layout that shows a full-screen loader when `status === 'checking'` then unmounts the rest of the UI → “reload” feeling. Chromium’s background-tab throttling (~1 min) made this appear as a “reload every 1–1.5 min” when returning to the tab.
- **Fixes (in `app/lib/auth-context.tsx`):**
  1. Only set `status` to `'checking'` when there is **no cached user** (true initial load): condition changed to also require `cached == null` (using existing `getCachedUser()`). So revalidation after focus/remount (when cache exists) never shows the full-screen checking state.
  2. **Silent recheck:** Added a second parameter `silentRecheck` to `checkAuth()`. When `true` (focus/visibility path), we **never** set `status` to `'checking'`, so even with no cache we don’t show the loader on tab focus/visibility.
  3. Focus and visibility handlers now call `checkAuth(false, true)`. Added `visibilitychange` so we recheck when the tab becomes visible (not only on `focus`).
  4. “Tab focused - checking auth” is logged only when a check **actually runs** (inside `checkAuth` when about to request); when the second event is debounced, we only see “Debounced - too soon since last check”, avoiding duplicate “Tab focused” logs.

### Problem 2: Double “Tab focused” log and debounce message

- **Symptom:** Console showed “Tab focused - checking auth” twice, then “Debounced - too soon since last check” with `timeSinceLastCheck: 3024`.
- **Cause:** Both `window` `focus` and `document` `visibilitychange` are listened to. When you return to the tab, both events fire (often a few seconds apart). First run does the real check; second run hits the 5s debounce and skips the request. The “Tab focused” log was emitted in the handler **before** calling `checkAuth()`, so it appeared twice even when the second call was debounced.
- **Fix:** Moved the “Tab focused - checking auth” log inside `checkAuth()`, only when we’re about to perform the request (and `silentRecheck` is true). So we log it only when a check actually runs; when we debounce we only see “Debounced - too soon since last check”.

### Problem 3: Session expiry wiping form state (earlier plan)

- **Symptom:** While editing (e.g. team member form), a session check could redirect to login or remount the layout, wiping unsaved input.
- **Mitigations (from earlier work):** Session-expired modal (no hard reload); optional `returnTo` so after login the user is sent back; team member form has draft persistence (localStorage, debounced) and “Restore draft?” plus dirty-form guard and `beforeunload`. Dashboard layout does a single `checkAuth()` on mount and does not use a periodic full recheck that would remount the tree.

---

## 3. Flow summary (diagram)

```
Login page
  → POST /api/admin/auth/login (username, password)
  → 200 { token, user } → localStorage.setItem('admin_token', token)
  → router.push(returnTo || '/admin/dashboard')

Dashboard (layout or AuthProvider)
  → On mount: GET /api/admin/auth/me (Authorization: Bearer <token>)
  → 200 { user } → show UI; 401/404/5xx → clear token, show session-expired modal → redirect to login

If using AuthProvider:
  → On window focus / document visibilitychange (tab visible):
      checkAuth(false, true) → silent recheck (no "Checking..." UI), debounced 5s
  → Cache (getCachedUser/setCachedUser) used for instant display while revalidating
```

---

## 4. Files reference

| Purpose | File(s) |
|--------|---------|
| Token create/verify, get from request | `app/lib/auth.ts` |
| API guard | `app/lib/auth-middleware.ts` |
| Login API | `app/api/admin/auth/login/route.ts` |
| Session check API | `app/api/admin/auth/me/route.ts` |
| Client layout guard (used) | `app/admin/dashboard/layout.tsx` |
| Auth context (focus/visibility, silent recheck) | `app/lib/auth-context.tsx` |
| In-memory auth cache | `app/admin/dashboard/_lib/cache.ts` |
| Login page (token, returnTo) | `app/admin/login/page.tsx` |
