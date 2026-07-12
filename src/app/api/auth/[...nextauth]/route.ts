import NextAuth from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const LOGIN_LIMIT = { windowMs: 60_000, maxRequests: 10 }

const nextAuthHandler = NextAuth(authOptions)

async function handler(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  // Rate limiting para el callback de credentials (inicio de sesión)
  if (req.method === 'POST' && req.nextUrl.pathname === '/api/auth/callback/credentials') {
    const ip = getClientIp(req)
    const limit = checkRateLimit(`login:${ip}`, LOGIN_LIMIT)
    if (!limit.allowed) {
      return rateLimitResponse(limit, 'Demasiados intentos de inicio de sesión. Probá más tarde.')
    }
  }
  return nextAuthHandler(req, context)
}

export { handler as GET, handler as POST }
