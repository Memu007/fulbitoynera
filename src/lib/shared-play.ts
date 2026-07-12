export const MAX_SHARED_PLAY_BYTES = 2_000_000
export const SHARED_PLAY_TTL_MS = 90 * 24 * 60 * 60 * 1000

export function validateSharedPlayData(value: unknown): string | null {
  if (typeof value !== 'string' || !value || Buffer.byteLength(value, 'utf8') > MAX_SHARED_PLAY_BYTES) return null
  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    if (![5, 8, 11].includes(Number(parsed.g))) return null
    if (!Number.isFinite(Number(parsed.d)) || Number(parsed.d) < 0 || Number(parsed.d) > 600000) return null
    if (!parsed.t || typeof parsed.t !== 'object' || Array.isArray(parsed.t)) return null
    return value
  } catch { return null }
}
