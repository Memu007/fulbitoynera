// Rate limiting in-memory simple para endpoints expuestos
// Limpia entradas expiradas cada 5 minutos para evitar fugas de memoria

export type RateLimitConfig = {
  windowMs: number
  maxRequests: number
}

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfter: number
}

type Entry = {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  if (now - lastCleanup >= CLEANUP_INTERVAL_MS) { cleanup(); lastCleanup = now }
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    const newEntry: Entry = { count: 1, resetAt: now + config.windowMs }
    store.set(key, newEntry)
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
      retryAfter: 0,
    }
  }

  entry.count++
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    retryAfter: 0,
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

export function rateLimitResponse(result: RateLimitResult, message: string) {
  return new Response(
    JSON.stringify({ error: message, retryAfter: result.retryAfter }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAt),
      },
    }
  )
}
