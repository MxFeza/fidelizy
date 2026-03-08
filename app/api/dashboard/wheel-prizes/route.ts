import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { wheelPrizesLimiter, getIP } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  try {
    const { success } = await wheelPrizesLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: prizes } = await supabase
      .from('wheel_prizes')
      .select('*')
      .eq('business_id', user.id)
      .order('sort_order', { ascending: true })

    return NextResponse.json({ prizes: prizes ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { success } = await wheelPrizesLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check max 8 segments
    const { count } = await supabase
      .from('wheel_prizes')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', user.id)

    if ((count ?? 0) >= 8) {
      return NextResponse.json({ error: 'Maximum 8 segments atteint' }, { status: 400 })
    }

    const body = await request.json()
    const { label, emoji, probability, reward_type, reward_value, reward_description } = body

    if (!label || !probability || !reward_type) {
      return NextResponse.json({ error: 'Paramètres manquants (label, probability, reward_type)' }, { status: 400 })
    }

    if (typeof label !== 'string' || label.trim().length < 1 || label.trim().length > 50) {
      return NextResponse.json({ error: 'Label invalide (1-50 caractères)' }, { status: 400 })
    }

    if (!Number.isInteger(probability) || probability < 1 || probability > 100) {
      return NextResponse.json({ error: 'Probabilité invalide (1-100)' }, { status: 400 })
    }

    const validTypes = ['bonus_stamps', 'bonus_points', 'custom_reward']
    if (!validTypes.includes(reward_type)) {
      return NextResponse.json({ error: 'Type de récompense invalide' }, { status: 400 })
    }

    const { data: prize, error } = await supabase
      .from('wheel_prizes')
      .insert({
        business_id: user.id,
        label: label.trim(),
        emoji: emoji || '🎯',
        probability,
        reward_type,
        reward_value: reward_value ?? 1,
        reward_description: reward_description || null,
        sort_order: (count ?? 0),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ prize })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { success } = await wheelPrizesLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { id, label, emoji, probability, reward_type, reward_value, reward_description, sort_order } = body

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (label !== undefined) {
      if (typeof label !== 'string' || label.trim().length < 1 || label.trim().length > 50) {
        return NextResponse.json({ error: 'Label invalide (1-50 caractères)' }, { status: 400 })
      }
      updateData.label = label.trim()
    }
    if (emoji !== undefined) updateData.emoji = emoji || '🎯'
    if (probability !== undefined) {
      if (!Number.isInteger(probability) || probability < 1 || probability > 100) {
        return NextResponse.json({ error: 'Probabilité invalide (1-100)' }, { status: 400 })
      }
      updateData.probability = probability
    }
    if (reward_type !== undefined) {
      const validTypes = ['bonus_stamps', 'bonus_points', 'custom_reward']
      if (!validTypes.includes(reward_type)) {
        return NextResponse.json({ error: 'Type de récompense invalide' }, { status: 400 })
      }
      updateData.reward_type = reward_type
    }
    if (reward_value !== undefined) updateData.reward_value = reward_value
    if (reward_description !== undefined) updateData.reward_description = reward_description || null
    if (sort_order !== undefined) updateData.sort_order = sort_order

    const { data: prize, error } = await supabase
      .from('wheel_prizes')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', user.id)
      .select()
      .single()

    if (error || !prize) {
      return NextResponse.json({ error: 'Segment introuvable ou erreur' }, { status: 404 })
    }

    return NextResponse.json({ prize })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { success } = await wheelPrizesLimiter.limit(getIP(request))
    if (!success) {
      return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    // Check min 2 segments
    const { count } = await supabase
      .from('wheel_prizes')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', user.id)

    if ((count ?? 0) <= 2) {
      return NextResponse.json({ error: 'Minimum 2 segments requis' }, { status: 400 })
    }

    const { error } = await supabase
      .from('wheel_prizes')
      .delete()
      .eq('id', id)
      .eq('business_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 })
  }
}
