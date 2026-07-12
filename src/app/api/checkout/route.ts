import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import type { AppPlan } from '@/lib/plans';

const CHECKOUT_LIMIT = { windowMs: 60_000, maxRequests: 10 };

// Endpoint para crear una Stripe Checkout Session.
// Funciona en dos modos:
// 1. DEMO (sin STRIPE_SECRET_KEY): activa el plan directamente en la DB.
// 2. PRODUCCIÓN (con STRIPE_SECRET_KEY): crea una Checkout Session real y el webhook la activa.

const PLAN_CONFIG: Record<string, {
  name: string;
  amount: number; // en centavos
  currency: string;
  interval: 'month' | 'year';
  trial: boolean;
  appPlan: AppPlan;
}> = {
  'pro-yearly': {
    name: 'Pizarra Pro Anual',
    amount: 249900, // ARS 2.499
    currency: 'ars',
    interval: 'year',
    trial: true,
    appPlan:'pro',
  },
  'pro-monthly': {
    name: 'Pizarra Pro Mensual',
    amount: 49900, // ARS 499
    currency: 'ars',
    interval: 'month',
    trial: false,
    appPlan:'pro',
  },
  'club': {
    name: 'Pizarra Pro Club — licencia institucional',
    amount: 19900, // USD 199 — B2B en USD
    currency: 'usd',
    interval: 'year',
    trial: false,
    appPlan:'club',
  },
};

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`checkout:${ip}`, CHECKOUT_LIMIT);
    if (!limit.allowed) {
      return rateLimitResponse(limit, 'Demasiados intentos de checkout. Probá más tarde.');
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!plan || !PLAN_CONFIG[plan]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const config = PLAN_CONFIG[plan];
    const appPlan=config.appPlan;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // MODO DEMO: sin credenciales de Stripe. Activamos el plan en DB directamente.
    if (!stripeKey || stripeKey === 'demo') {
      await db.suscripcion.upsert({
        where: { usuarioId: session.user.id },
        update: { plan:appPlan, status: 'active' },
        create: { usuarioId: session.user.id, plan:appPlan, status: 'active' },
      });
      return NextResponse.json({
        demo: true,
        plan:appPlan,
        billingPlan:plan,
        activated: true,
        message: 'Modo demo: plan activado. Configurá STRIPE_SECRET_KEY en .env para cobrar de verdad.',
        redirectUrl: null,
      });
    }

    // MODO PRODUCCIÓN: crear Checkout Session real en Stripe.
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: config.currency,
            product_data: { name: config.name },
            unit_amount: config.amount,
            recurring: { interval: config.interval },
          },
          quantity: 1,
        },
      ],
      subscription_data: { metadata:{plan:appPlan,billingPlan:plan,userId:session.user.id},...(config.trial?{trial_period_days:7}:{}) },
      success_url: `${baseUrl}/pizarra-pro.html?upgrade=success&plan=${plan}`,
      cancel_url: `${baseUrl}/pizarra-pro.html?upgrade=cancel`,
      metadata: { plan:appPlan,billingPlan:plan,userId: session.user.id },
      client_reference_id:session.user.id,
      customer_email: session.user.email || undefined,
    });

    return NextResponse.json({ redirectUrl: checkoutSession.url, plan:appPlan,billingPlan:plan });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}

// GET: estado del endpoint (para verificar configuración)
export async function GET() {
  const hasKey = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'demo';
  return NextResponse.json({
    configured: hasKey,
    mode: hasKey ? 'production' : 'demo',
    message: hasKey
      ? 'Stripe configurado. Los pagos son reales.'
      : 'Modo demo. Configurá STRIPE_SECRET_KEY en .env para activar pagos reales.',
  });
}
