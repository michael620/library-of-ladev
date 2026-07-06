import type { AdminSaveVideoPayload } from '@/types';

interface AdminSaveResult {
  success: boolean;
  error?: string;
}

async function put(url: string, body: unknown): Promise<AdminSaveResult> {
  try {
    const res = await fetch(`/admin/api/videos/${encodeURIComponent(url)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }
    return data as AdminSaveResult;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function saveVideo(url: string, payload: AdminSaveVideoPayload): Promise<AdminSaveResult> {
  return put(url, payload);
}

export function deleteVideo(url: string): Promise<AdminSaveResult> {
  return put(url, { _op: 'delete' });
}
