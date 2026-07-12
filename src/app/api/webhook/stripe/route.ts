import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { normalizePlan } from '@/lib/plans'

const stripeKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Días de período según plan: mensual = 30, anual = 365
function periodDaysFromPlan(plan?: string): number {
  const p = (plan || '').toLowerCase()
  if (p.includes('mensual') || p.includes('month')) return 30
  if (p.includes('anual') || p.includes('year') || p.includes('annual')) return 365
  return 365 // default anual
}

function periodEndFromPlan(plan?: string): Date {
  return new Date(Date.now() + periodDaysFromPlan(plan) * 24 * 60 * 60 * 1000)
}

function subscriptionStatusFromEvent(
  sub: Stripe.Subscription
): 'active' | 'canceled' | 'past_due' | 'unpaid' {
  const s = sub.status
  if (s === 'canceled' || s === 'incomplete_expired') return 'canceled'
  if (s === 'past_due') return 'past_due'
  if (s === 'unpaid') return 'unpaid'
  return 'active'
}

async function upsertFromCheckout(session: Stripe.Checkout.Session) {
  const plan = normalizePlan(session.metadata?.plan)
  const billingPlan=session.metadata?.billingPlan||session.metadata?.plan
  const userId = session.metadata?.userId
  const customerId = session.customer as string | null | undefined
  const subscriptionId = session.subscription as string | null | undefined

  if (plan==='free') {
    console.error('Webhook Stripe: checkout session sin metadata.plan')
    return
  }

  const periodEnd = periodEndFromPlan(billingPlan)
  const subscriptionData = {
    plan,
    status: 'active' as const,
    stripeCustomerId: customerId || undefined,
    stripeSubscriptionId: subscriptionId || undefined,
    currentPeriodEnd: periodEnd,
  }

  if (userId) {
    await db.suscripcion.upsert({
      where: { usuarioId: userId },
      update: subscriptionData,
      create: { usuarioId: userId, ...subscriptionData },
    })
  } else if (session.customer_email) {
    const user = await db.usuario.findUnique({
      where: { email: session.customer_email },
    })
    if (user) {
      await db.suscripcion.upsert({
        where: { usuarioId: user.id },
        update: subscriptionData,
        create: { usuarioId: user.id, ...subscriptionData },
      })
    } else {
      console.error('Webhook Stripe: no se encontró usuario', session.customer_email)
    }
  } else {
    console.error('Webhook Stripe: checkout session sin userId ni customer_email')
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const status = subscriptionStatusFromEvent(sub)
  const plan = sub.metadata?.plan ? normalizePlan(sub.metadata.plan) : undefined
  // Stripe.Subscription expone current_period_end como número (timestamp)
  const periodEndRaw = (sub as unknown as Record<string, number>).current_period_end
  const currentPeriodEnd = periodEndRaw ? new Date(periodEndRaw * 1000) : undefined

  const updateData: {
    status: string
    currentPeriodEnd?: Date
    plan?: string
    stripeSubscriptionId?: string
  } = {
    status,
    ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
    ...(plan ? { plan } : {}),
  }

  if (sub.id) {
    await db.suscripcion.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: updateData,
    })
  }

  if (status !== 'active' && sub.customer) {
    await db.suscripcion.updateMany({
      where: {
        stripeCustomerId: sub.customer as string,
        NOT: { stripeSubscriptionId: sub.id },
      },
      data: { status },
    })
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  if (sub.id) {
    await db.suscripcion.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: { status: 'canceled' },
    })
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const status = invoice.status === 'uncollectible' ? 'unpaid' : 'past_due'
  if (invoice.customer) {
    await db.suscripcion.updateMany({
      where: { stripeCustomerId: invoice.customer as string },
      data: { status },
    })
  }
}

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

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await upsertFromCheckout(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        // Evento no manejado explícitamente, pero recibido
        break
    }
  } catch (err) {
    console.error('Error procesando webhook de Stripe', event.type, err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
