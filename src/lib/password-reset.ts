import { createHash, randomBytes } from 'node:crypto'
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000
export function hashResetToken(token: string) { return createHash('sha256').update(token).digest('hex') }
export function createResetToken() { const token = randomBytes(32).toString('hex'); return { token, tokenHash: hashResetToken(token) } }
export function isResetToken(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value) }
