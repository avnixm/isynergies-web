# Auth & Reload Check – Findings and Fix

## Your comments (summary)

1. **"Nag auto reload rin yata yung website on certain interval"** – Baka may interval na nagre-reload.
2. **"Habang nag e-encode ako, nag che-check ng admin session then after nun narereload yung system, nawawala yung ine-encode"** – Session check tapos parang nagre-reload, nawawala input.

---

## 1. Auto-reload on interval – CHECKED

**Result: Walang nahanap na code na nagre-reload ng buong page on a timer.**

- **`setInterval` usage:**
  - **Header** – `setInterval(fetchUnreadCount, 30000)` – fetch lang ng message count, **hindi** reload.
  - **Messages page** – `setInterval(() => fetchMessages(), 5000)` – fetch lang ng messages list, **hindi** reload.
  - **FeaturedApp** – `setInterval(updateArrowVisibility, 50)` – UI visibility lang during scroll, **hindi** reload.
- **Walang** `window.location.reload()`, `router.refresh()`, o `location.href` na naka-timer.
- **Walang** middleware na nagfo-force ng reload.
- **Next.js** – Walang `revalidatePath`/`revalidateTag` na nag-trigger ng full reload sa admin.

Kung may nararamdaman pa na “parang may interval na reload”, pwedeng:
- **Dev mode** – Hot reload kapag may na-save na file (expected).
- **Browser/tab** – Sleep/background tab behavior.
- **Network** – Page refresh dahil sa connection drop (hindi sa interval sa code).

---

## 2. “Nagche-check ng admin session tapos narereload” – FIXED

**Cause:** Kapag nag-tab focus (e.g. bumalik sa admin tab), tinatawag ang `checkAuth()`.  
Dati, **lahat** ng `checkAuth()` (maliban sa retry) ay nagse-set ng `status = 'checking'`.  
Kapag `status === 'checking'`, ang **layout** ay nagpapakita ng full-screen **“Checking admin session…”** at **tinatago** ang buong content (kasama ang form).  
Epekto: parang “nagre-reload” at nawawala ang ine-encode.

**Fix (in `app/lib/auth-context.tsx`):**

- Full-screen “Checking admin session” **ayaw na** gawin kapag **naka-authenticated na** (e.g. tab focus / background check).
- Full-screen checking **ginagawa lang** kapag **initial load** pa (hindi pa alam kung authenticated).

**Code change:**

```ts
// Before: every checkAuth() (including on focus) showed full-screen checking
if (!isRetry) {
  setStatus('checking');
}

// After: only show full-screen checking when we're not yet authenticated
if (!isRetry && !wasAuthenticatedRef.current) {
  setStatus('checking');
}
```

**Result:**

- **Initial load** – May “Checking admin session…” pa rin (expected).
- **Habang naka-log in at nag-e-encode** – Kapag nag-tab focus o tumawag ng `checkAuth()` sa background, **hindi na** lalabas ang full-screen checking, **hindi na** mawawala ang form o lalabas na parang “reload”; session check na lang sa background.

---

## 3. Existing protections (na na-implement na dati)

- **Resilient auth** – 5xx / network error: retry, **hindi** redirect; 401/403 lang naglo-logout.
- **Session expired** – Modal na lang, **walang** hard reload.
- **Draft persistence** – Auto-save ng form sa localStorage; pwedeng i-restore kung na-close o na-refresh.
- **Unsaved changes modal** – Warning bago i-close ang form nang walang save.

---

## 4. Summary

| Concern                         | Status | Action |
|--------------------------------|--------|--------|
| Auto-reload on interval         | Checked | Walang interval-based reload sa code; safe. |
| Session check → “reload” feel  | Fixed  | Background check na lang kapag naka-auth na; no full-screen checking. |
| Nawawala ine-encode             | Fixed  | Same fix + existing draft + unsaved-changes modal. |

Kung may specific scenario pa (e.g. exact interval, specific page, or “after X minutes”), pwedeng i-describe para i-double-check kung may ibang trigger (e.g. dev HMR, browser, or network).
