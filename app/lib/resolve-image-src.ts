



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
      trimmed.startsWith('/api/media/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/')
    )
      return trimmed;
    if (!Number.isNaN(Number(trimmed))) return `/api/images/${trimmed}`;
  }
  return null;
}

export function getLogoImageSrc(logoImage: string | null | undefined): string | null {
  if (logoImage === undefined || logoImage === null) return null;
  const s = typeof logoImage === 'string' ? logoImage.trim() : '';
  if (!s) return null;
  if (
    s.startsWith('/api/images/') ||
    s.startsWith('/api/media/') ||
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('/')
  )
    return s;
  if (!Number.isNaN(Number(s))) return `/api/images/${s}`;
  return null;
}
