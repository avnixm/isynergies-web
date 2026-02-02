# Observability

This document describes logging, metrics, tracing, alerting, and the debugging workflow. The codebase has limited built-in observability; gaps and recommendations are noted.

---

## Table of contents

1. [Logging](#logging)
2. [Request IDs / correlation IDs](#request-ids--correlation-ids)
3. [Metrics](#metrics)
4. [Alerting](#alerting)
5. [Debugging workflow](#debugging-workflow)

---

## Logging

- **Format:** Unstructured. Routes use `console.log` and `console.error` (e.g. `console.error('Login error:', error)`).
- **Where logs go:** In development, stdout/stderr of the Next.js process. On Vercel, Function logs and Build logs in the Vercel dashboard.
- **Log levels:** No explicit level (e.g. debug/info/warn/error); only `console.log` vs `console.error`. No log level configuration in repo.
- **What is logged:** API errors (with optional dev-only details); DB retry warnings; auth-context events in development; upload/chunk reassembly info; image serve errors.
- **Sensitive data:** Passwords and tokens are not logged. Stack traces and error details are only attached to 500 responses when `NODE_ENV === 'development'`.

**Recommendation:** For production, consider a structured logger (e.g. JSON with level, message, requestId) and a log aggregation service. Not implemented in codebase.

---

## Request IDs / correlation IDs

- **Not present.** There is no middleware or utility that assigns a request ID or correlation ID to each request. Tracing a single request across logs is not supported out of the box.
- **Recommendation:** Add middleware or a wrapper that generates a request ID (e.g. UUID), sets it on a response header (e.g. `X-Request-ID`), and makes it available to route handlers for logging. Mark as "Unknown from codebase; suggest confirming with team."

---

## Metrics

- **None in repo.** No metrics library (e.g. Prometheus client) or custom metrics. No dashboards defined.
- **Vercel:** Vercel Analytics (if enabled) provides traffic/performance data at the platform level.
- **Recommendation:** Emit metrics for critical paths (e.g. login success/failure, contact form submit, 5xx count) and integrate with your monitoring stack. Not implemented.

---

## Alerting

- **None in repo.** No alerting rules or on-call runbooks. No defined thresholds.
- **Recommendation:** Configure alerts (e.g. 5xx rate, login failure spike, DB connection failures) in your hosting/monitoring platform. Document thresholds and response steps in an ops runbook.

---

## Debugging workflow

1. **Reproduce:** Reproduce the issue (browser, curl, or test script). Note URL, method, and any auth (cookie/Bearer).
2. **Browser/Network:** Check DevTools → Network for the failing request (status, response body). Check Console for client errors.
3. **Server logs:** In development, check the terminal where `npm run dev` is running. On Vercel, open Project → Deployments → [deployment] → Functions or Logs.
4. **Traces:** No distributed tracing in repo. Use logs and request timing in the platform (e.g. Vercel Function duration).
5. **DB:** Use `npm run db:studio` (with appropriate `.env`) to inspect data. Verify the DB the app is using (env vars) and that tables/rows exist as expected.
6. **Auth:** Verify cookie `admin_token` is present (Application → Cookies) or use `Authorization: Bearer <token>`. Confirm JWT_SECRET has not changed and token is not expired.

**Summary:** Reproduce → Network/Console → server logs → DB → auth. No request ID to correlate; use timestamps and path/method to match log lines.
