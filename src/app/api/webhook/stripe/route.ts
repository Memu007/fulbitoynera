import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripeKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook no configurado' },
      { status: 500 }
    )
  }

  const payload = await req.text()
  const signature = req.headers.get('stripe-signature') || ''

  const stripe = new Stripe(stripeKey)
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    console.error('Error verificando firma del webhook de Stripe', err)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const plan = session.metadata?.plan
    const userId = session.metadata?.userId
    const customerId = session.customer
    const subscriptionId = session.subscription

    if (!plan) {
      console.error('Webhook Stripe: checkout session sin metadata.plan')
      return NextResponse.json({ received: true })
    }

    try {
      if (userId) {
        await db.suscripcion.upsert({
          where: { usuarioId: userId },
          update: {
            plan,
            status: 'active',
            stripeCustomerId: customerId as string | undefined,
            stripeSubscriptionId: subscriptionId as string | undefined,
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
          create: {
            usuarioId: userId,
            plan,
            status: 'active',
            stripeCustomerId: customerId as string | undefined,
            stripeSubscriptionId: subscriptionId as string | undefined,
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        })
      } else if (session.customer_email) {
        const user = await db.usuario.findUnique({
          where: { email: session.customer_email },
        })
        if (user) {
          await db.suscripcion.upsert({
            where: { usuarioId: user.id },
            update: {
              plan,
              status: 'active',
              stripeCustomerId: customerId as string | undefined,
              stripeSubscriptionId: subscriptionId as string | undefined,
              currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
            create: {
              usuarioId: user.id,
              plan,
              status: 'active',
              stripeCustomerId: customerId as string | undefined,
              stripeSubscriptionId: subscriptionId as string | undefined,
              currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          })
        } else {
          console.error('Webhook Stripe: no se encontró usuario', session.customer_email)
        }
      } else {
        console.error('Webhook Stripe: checkout session sin userId ni customer_email')
      }
    } catch (err) {
      console.error('Error actualizando suscripción desde webhook Stripe', err)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
