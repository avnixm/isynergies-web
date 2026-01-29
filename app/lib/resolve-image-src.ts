



export function resolveImageSrc(
  image: string | number | null | undefined
): string | null {
  if (image === undefined || image === null) return null;
  if (typeof image === 'number') return `/api/images/${image}`;
  if (typeof image === 'string') {
    const trimmed = image.trim();
    if (!trimmed) return null;
    if (
      trimmed.startsWith('/api/images/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')
    )
      return trimmed;
    if (!Number.isNaN(Number(trimmed))) return `/api/images/${trimmed}`;
  }
  return null;
}
