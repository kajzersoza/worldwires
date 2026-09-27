/**
 * Helper to convert Google Drive share URLs or local images to direct displayable URLs
 */
export function getDisplayableImageUrl(url?: string): string {
  if (!url) return '';
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
    }
  }
  return url;
}
