export const MAX_PLAY_NAME = 80
export const MAX_PLAY_DURATION_MS = 10 * 60 * 1000
export const MAX_PLAY_DATA_BYTES = 2_000_000
const GAME_TYPES = new Set(['F5', 'F8', 'F11'])

export interface PlayInput { nombre?: string; gameType?: string; duration?: number; data?: string }
export function validatePlayInput(input: unknown, partial = false): { ok: true; value: PlayInput } | { ok: false; error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'Cuerpo inválido' }
  const body = input as Record<string, unknown>
  const value: PlayInput = {}
  if (!partial || body.nombre !== undefined) {
    if (typeof body.nombre !== 'string' || !body.nombre.trim()) return { ok: false, error: 'Nombre requerido' }
    value.nombre = body.nombre.trim().slice(0, MAX_PLAY_NAME)
  }
  if (!partial || body.gameType !== undefined) {
    if (typeof body.gameType !== 'string' || !GAME_TYPES.has(body.gameType)) return { ok: false, error: 'Modalidad inválida' }
    value.gameType = body.gameType
  }
  if (!partial || body.duration !== undefined) {
    const duration = Number(body.duration)
    if (!Number.isFinite(duration) || duration < 0 || duration > MAX_PLAY_DURATION_MS) return { ok: false, error: 'Duración inválida' }
    value.duration = Math.round(duration)
  }
  if (!partial || body.data !== undefined) {
    if (typeof body.data !== 'string' || !body.data) return { ok: false, error: 'Datos de jugada requeridos' }
    if (Buffer.byteLength(body.data, 'utf8') > MAX_PLAY_DATA_BYTES) return { ok: false, error: 'La jugada supera el tamaño máximo permitido' }
    try { const parsed = JSON.parse(body.data); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error() }
    catch { return { ok: false, error: 'Datos de jugada inválidos' } }
    value.data = body.data
  }
  return { ok: true, value }
}
