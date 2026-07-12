export type AppPlan = 'free' | 'pro' | 'club'

export function normalizePlan(plan?: string | null): AppPlan {
  const value = String(plan || '').toLowerCase()
  if (value === 'club' || value.startsWith('club-')) return 'club'
  if (value === 'pro' || value.startsWith('pro-')) return 'pro'
  return 'free'
}

export function effectivePlan(subscription?: { plan?: string | null; status?: string | null; currentPeriodEnd?: Date | string | null } | null): AppPlan {
  if (!subscription) return 'free'
  const plan = normalizePlan(subscription.plan)
  if (plan === 'free') return 'free'
  const status = subscription.status
  if (!status) return plan
  if (status === 'active' || status === 'trialing') return plan
  if (status === 'canceled' && subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > new Date()) return plan
  return 'free'
}

export function hasUnlimitedAccess(plan: AppPlan) {
  return plan === 'pro' || plan === 'club'
}
