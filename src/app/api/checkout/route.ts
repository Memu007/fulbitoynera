import { NextRequest, NextResponse } from 'next/server';

// Endpoint para crear una Stripe Checkout Session.
// Funciona en dos modos:
// 1. DEMO (sin STRIPE_SECRET_KEY): devuelve un plan simulado para que el flujo de la app funcione.
// 2. PRODUCCIÓN (con STRIPE_SECRET_KEY): crea una Checkout Session real y devuelve la URL.

const PLAN_CONFIG: Record<string, {
  name: string;
  amount: number; // en centavos
  currency: string;
  interval: 'month' | 'year';
  trial: boolean;
}> = {
  'pro-yearly': {
    name: 'Pizarra Pro Anual',
    amount: 249900, // ARS 2.499
    currency: 'ars',
    interval: 'year',
    trial: true,
  },
  'pro-monthly': {
    name: 'Pizarra Pro Mensual',
    amount: 49900, // ARS 499
    currency: 'ars',
    interval: 'month',
    trial: false,
  },
  'club': {
    name: 'Pizarra Pro Club (5 entrenadores)',
    amount: 19900, // USD 199 — B2B en USD
    currency: 'usd',
    interval: 'year',
    trial: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();

    if (!plan || !PLAN_CONFIG[plan]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const config = PLAN_CONFIG[plan];
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // MODO DEMO: sin credenciales de Stripe configuradas.
    // Devolvemos una respuesta simulada para que el flujo de la app funcione.
    if (!stripeKey || stripeKey === 'demo') {
      return NextResponse.json({
        demo: true,
        plan,
        message: 'Modo demo: activación simulada. Configurá STRIPE_SECRET_KEY en .env para cobrar de verdad.',
        redirectUrl: null,
      });
    }

    // MODO PRODUCCIÓN: crear Checkout Session real en Stripe.
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.create({
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
      ...(config.trial && { subscription_data: { trial_period_days: 7 } }),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pizarra-pro.html?upgrade=success&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pizarra-pro.html?upgrade=cancel`,
      metadata: { plan },
    });

    return NextResponse.json({ redirectUrl: session.url, plan });
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
