/**
 * Blob token is read only from the environment (e.g. .env: BLOB_READ_WRITE_TOKEN).
 */
export function getBlobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

export function ensureBlobTokenEnv(): void {
  // No-op: token is only read from BLOB_READ_WRITE_TOKEN in .env
}

