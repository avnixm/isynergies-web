export function getBlobToken(): string | undefined {
  
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.isyn_READ_WRITE_TOKEN;
}





export function ensureBlobTokenEnv(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.isyn_READ_WRITE_TOKEN) {
    process.env.BLOB_READ_WRITE_TOKEN = process.env.isyn_READ_WRITE_TOKEN;
  }
}

