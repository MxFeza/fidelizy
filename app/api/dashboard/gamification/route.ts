import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { gamificationLimiter, getIP } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  const { success } = await gamificationLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('gamification')
    .eq('id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
  }

  const defaults = {
    surprise_enabled: false,
    surprise_probability: 0.2,
    surprise_reward_type: 'bonus_stamp',
    surprise_reward_value: 1,
    initial_stamps: 0,
    goal_gradient_notification: true,
  }

  return NextResponse.json({ ...defaults, ...business.gamification })
}

export async function PUT(request: NextRequest) {
  const { success } = await gamificationLimiter.limit(getIP(request))
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()

  // Validate fields
  const allowed = [
    'surprise_enabled',
    'surprise_probability',
    'surprise_reward_type',
    'surprise_reward_value',
    'initial_stamps',
    'goal_gradient_notification',
  ]

  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  // Clamp values
  if (typeof update.surprise_probability === 'number') {
    update.surprise_probability = Math.max(0.1, Math.min(0.3, update.surprise_probability))
  }
  if (typeof update.surprise_reward_value === 'number') {
    update.surprise_reward_value = Math.max(1, Math.min(10, Math.floor(update.surprise_reward_value)))
  }
  if (typeof update.initial_stamps === 'number') {
    update.initial_stamps = Math.max(0, Math.min(3, Math.floor(update.initial_stamps)))
  }

  // Fetch current gamification, merge with update
  const { data: business } = await supabase
    .from('businesses')
    .select('gamification')
    .eq('id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 })
  }

  const merged = { ...(business.gamification ?? {}), ...update }

  const { error } = await supabase
    .from('businesses')
    .update({ gamification: merged })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json(merged)
}
