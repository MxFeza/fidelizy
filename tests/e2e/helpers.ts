import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { type Page } from '@playwright/test'

/**
 * Creates a Supabase admin client using service role key.
 * Used for test setup/teardown and OTP bypass.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local. ' +
      'Add SUPABASE_SERVICE_ROLE_KEY to .env.local for E2E tests to work.'
    )
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Unique prefix for test data cleanup */
const TEST_PREFIX = 'pw-test'

/** Generate a unique test email */
export function testEmail(label: string): string {
  const ts = Date.now()
  return `${TEST_PREFIX}-${label}-${ts}@example.com`
}

/** Generate a unique test phone */
export function testPhone(): string {
  const rand = Math.floor(100000 + Math.random() * 900000)
  return `0600${rand}`
}

// ── ID-based cleanup tracker ──────────────────────────────────────────
// Tracks all entities created during a test run for precise cleanup.

interface CreatedEntities {
  authUserIds: string[]
  businessIds: string[]
  customerIds: string[]
  cardIds: string[]
  missionIds: string[]
}

let _created: CreatedEntities = emptyEntities()

function emptyEntities(): CreatedEntities {
  return { authUserIds: [], businessIds: [], customerIds: [], cardIds: [], missionIds: [] }
}

function track<K extends keyof CreatedEntities>(key: K, id: string) {
  _created[key].push(id)
}

// ── Test data factories ───────────────────────────────────────────────

interface TestBusinessResult {
  id: string
  email: string
  password: string
}

/**
 * Creates a test merchant account (Supabase Auth user + businesses row).
 * Returns the business ID and credentials for login.
 */
export async function createTestBusiness(
  supabase: SupabaseClient,
  overrides: { initial_stamps?: number } = {}
): Promise<TestBusinessResult> {
  const email = testEmail('merchant')
  const password = 'TestPassword123!'

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authUser.user) {
    throw new Error(`Failed to create test merchant auth: ${authError?.message}`)
  }

  const businessId = authUser.user.id
  track('authUserIds', businessId)

  const initialStamps = overrides.initial_stamps ?? 2

  const { error: bizError } = await supabase.from('businesses').insert({
    id: businessId,
    email,
    business_name: `Test Commerce ${Date.now()}`,
    primary_color: '#4f46e5',
    loyalty_type: 'stamps',
    stamps_required: 10,
    stamps_reward: 'Un cafe offert',
    points_per_euro: 1,
    short_code: `T${Date.now().toString(36).slice(-5).toUpperCase()}`,
    is_active: true,
    gamification: {
      initial_stamps: initialStamps,
      surprise: { enabled: false },
      goal_gradient: { enabled: false },
    },
  })

  if (bizError) {
    await supabase.auth.admin.deleteUser(businessId)
    throw new Error(`Failed to create test business: ${bizError.message}`)
  }

  track('businessIds', businessId)
  return { id: businessId, email, password }
}

/**
 * Creates a test customer with a loyalty card for the given business.
 */
export async function createTestCustomer(
  supabase: SupabaseClient,
  businessId: string,
  opts: { firstName?: string; phone?: string; email?: string; stamps?: number } = {}
): Promise<{
  customerId: string
  cardId: string
  qrCodeId: string
  firstName: string
  phone: string
  email: string
}> {
  const firstName = opts.firstName ?? 'TestClient'
  const phone = opts.phone ?? testPhone()
  const email = opts.email ?? testEmail('client')

  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .insert({ first_name: firstName, phone, email })
    .select('id')
    .single()

  if (custErr || !customer) {
    throw new Error(`Failed to create test customer: ${custErr?.message}`)
  }
  track('customerIds', customer.id)

  const qrCodeId = crypto.randomUUID()
  const { data: card, error: cardErr } = await supabase
    .from('loyalty_cards')
    .insert({
      customer_id: customer.id,
      business_id: businessId,
      current_stamps: opts.stamps ?? 0,
      current_points: 0,
      total_visits: 0,
      qr_code_id: qrCodeId,
    })
    .select('id, qr_code_id')
    .single()

  if (cardErr || !card) {
    throw new Error(`Failed to create test card: ${cardErr?.message}`)
  }
  track('cardIds', card.id)

  return {
    customerId: customer.id,
    cardId: card.id,
    qrCodeId: card.qr_code_id,
    firstName,
    phone,
    email,
  }
}

/**
 * Activates the referral mission for a business so referral bonuses work.
 */
export async function enableReferralMission(
  supabase: SupabaseClient,
  businessId: string,
  opts: { referrerPoints?: number; referredBonus?: number } = {}
): Promise<string> {
  const { data, error } = await supabase
    .from('missions')
    .insert({
      business_id: businessId,
      template_key: 'referral',
      reward_points: opts.referrerPoints ?? 5,
      is_active: true,
      config: { referred_bonus: opts.referredBonus ?? 2 },
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to enable referral mission: ${error?.message}`)
  }
  track('missionIds', data.id)
  return data.id
}

/**
 * Generates a valid OTP for a given email using the Supabase admin API.
 */
export async function getOTPForEmail(
  supabase: SupabaseClient,
  email: string
): Promise<string> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error || !data) {
    throw new Error(`Failed to generate OTP for ${email}: ${error?.message}`)
  }

  const otp = (data.properties as Record<string, unknown>)?.email_otp as string
  if (!otp) {
    throw new Error(
      'OTP not found in generateLink response. Check Supabase version supports email_otp in admin API.'
    )
  }

  return otp
}

// ── Shared UI actions (DRY) ───────────────────────────────────────────

/**
 * Fills the /join form and handles the OTP-or-fallback flow.
 * Returns once the card page is loaded.
 */
export async function fillJoinFormAndWaitForCard(
  page: Page,
  opts: { firstName: string; phone: string; email: string; referralCode?: string }
) {
  await page.getByPlaceholder('Votre prénom').fill(opts.firstName)
  await page.getByPlaceholder('06 00 00 00 00').fill(opts.phone)
  await page.getByPlaceholder('votre@email.com').fill(opts.email)

  if (opts.referralCode) {
    await page.getByPlaceholder('XXXX-0000').fill(opts.referralCode)
  }

  await page.getByRole('button', { name: /obtenir ma carte/i }).click()

  // Two outcomes: OTP screen (valid email) or fallback redirect (test email rejected).
  // Wait for either OTP numeric inputs or the card stamp badge "/10".
  const otpInput = page.locator('input[inputmode="numeric"]').first()
  const cardStampBadge = page.getByText('/10')

  await otpInput.or(cardStampBadge).first().waitFor({ state: 'visible', timeout: 30000 })

  // Robustly check which path we're on
  if ((await otpInput.count()) > 0 && (await otpInput.isVisible())) {
    const supabase = createAdminClient()
    const otp = await getOTPForEmail(supabase, opts.email)
    await page.keyboard.type(otp, { delay: 50 })
    // Wait for card page after OTP verification
    await cardStampBadge.waitFor({ state: 'visible', timeout: 30000 })
  }
}

// ── Cleanup (ID-based) ───────────────────────────────────────────────

/**
 * Cleans up all test data tracked by this run (by exact IDs).
 * Also sweeps any orphaned test data by prefix as a safety net.
 */
export async function cleanupTestData(supabase: SupabaseClient): Promise<void> {
  // 1. Clean up by tracked IDs (precise)
  if (_created.cardIds.length) {
    await supabase.from('transactions').delete().in('loyalty_card_id', _created.cardIds)
    await supabase.from('referrals').delete().in('referrer_card_id', _created.cardIds)
    await supabase.from('referrals').delete().in('referred_card_id', _created.cardIds)
    await supabase.from('mission_completions').delete().in('card_id', _created.cardIds)
    await supabase.from('loyalty_cards').delete().in('id', _created.cardIds)
  }

  if (_created.customerIds.length) {
    await supabase.from('customers').delete().in('id', _created.customerIds)
  }

  if (_created.missionIds.length) {
    await supabase.from('missions').delete().in('id', _created.missionIds)
  }

  if (_created.businessIds.length) {
    await supabase.from('businesses').delete().in('id', _created.businessIds)
  }

  for (const uid of _created.authUserIds) {
    await supabase.auth.admin.deleteUser(uid).catch(() => {})
  }

  // 2. Safety net: sweep orphans from previous failed runs (by prefix)
  const { data: orphanCustomers } = await supabase
    .from('customers')
    .select('id')
    .like('email', `${TEST_PREFIX}%`)

  if (orphanCustomers?.length) {
    const ids = orphanCustomers.map((c) => c.id)
    const { data: cards } = await supabase
      .from('loyalty_cards')
      .select('id')
      .in('customer_id', ids)

    if (cards?.length) {
      const cardIds = cards.map((c) => c.id)
      await supabase.from('transactions').delete().in('loyalty_card_id', cardIds)
      await supabase.from('referrals').delete().in('referrer_card_id', cardIds)
      await supabase.from('referrals').delete().in('referred_card_id', cardIds)
      await supabase.from('mission_completions').delete().in('card_id', cardIds)
      await supabase.from('loyalty_cards').delete().in('id', cardIds)
    }
    await supabase.from('customers').delete().in('id', ids)
  }

  const { data: orphanBiz } = await supabase
    .from('businesses')
    .select('id')
    .like('business_name', 'Test Commerce%')

  if (orphanBiz?.length) {
    for (const biz of orphanBiz) {
      await supabase.from('missions').delete().eq('business_id', biz.id)
      await supabase.from('businesses').delete().eq('id', biz.id)
      await supabase.auth.admin.deleteUser(biz.id).catch(() => {})
    }
  }

  // Reset tracker for next test file
  _created = emptyEntities()
}
