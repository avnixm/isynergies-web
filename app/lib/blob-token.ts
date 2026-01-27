export function getBlobToken(): string | undefined {
  // Prefer the standard Vercel env var, but support the project's custom name.
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.isyn_READ_WRITE_TOKEN;
}

/**
 * Some Vercel Blob helpers (e.g. `handleUpload`) read ONLY `BLOB_READ_WRITE_TOKEN`.
 * Call this before using those helpers so `isyn_READ_WRITE_TOKEN` also works.
 */
export function ensureBlobTokenEnv(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.isyn_READ_WRITE_TOKEN) {
    process.env.BLOB_READ_WRITE_TOKEN = process.env.isyn_READ_WRITE_TOKEN;
  }
}

