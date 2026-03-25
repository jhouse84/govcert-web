/**
 * Secure document download utility.
 * Uses the ID-based download endpoint with auth token.
 * Files download with their original filename.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://govcert-production.up.railway.app';

export async function downloadDocument(documentId: string, originalName?: string): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/api/documents/download/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Download failed' }));
    throw new Error(err.error || `Download failed: ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = originalName || 'document';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get a temporary download URL (for preview in new tab).
 */
export function getDocumentPreviewUrl(documentId: string): string {
  const token = localStorage.getItem('token');
  return `${API_URL}/api/documents/download/${documentId}?token=${token}`;
}
