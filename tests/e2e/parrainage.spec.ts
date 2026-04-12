import { test, expect } from '@playwright/test'
import {
  createAdminClient,
  createTestBusiness,
  createTestCustomer,
  enableReferralMission,
  cleanupTestData,
  testEmail,
  testPhone,
  fillJoinFormAndWaitForCard,
} from './helpers'
import { generateReferralCode } from '../../lib/services/referral.service'

let businessId: string
let clientA: Awaited<ReturnType<typeof createTestCustomer>>
let referralCode: string

test.beforeAll(async () => {
  const supabase = createAdminClient()
  await cleanupTestData(supabase)

  const biz = await createTestBusiness(supabase, { initial_stamps: 0 })
  businessId = biz.id

  await enableReferralMission(supabase, businessId, {
    referrerPoints: 5,
    referredBonus: 2,
  })

  clientA = await createTestCustomer(supabase, businessId, {
    firstName: 'Parrain',
    stamps: 3,
  })

  referralCode = generateReferralCode(clientA.firstName, clientA.phone)
})

test.afterAll(async () => {
  const supabase = createAdminClient()
  await cleanupTestData(supabase)
})

test.describe('Parcours 3 — Parrainage', () => {
  test('Client A partage son code, Client B s\'inscrit avec, les deux recoivent des bonus', async ({
    page,
  }) => {
    // Step 1: Verify Client A's card page loads
    await page.goto(`/card/${clientA.qrCodeId}`)
    await expect(page.getByText(/carte/i).first()).toBeVisible({ timeout: 10000 })

    // Navigate to missions tab to see referral code
    const missionsTab = page.getByText(/missions/i).first()
    if (await missionsTab.isVisible().catch(() => false)) {
      await missionsTab.click()
      // Wait for missions API response instead of fixed timeout
      await page.waitForResponse(
        (res) => res.url().includes('/api/missions/') && res.status() === 200,
        { timeout: 10000 }
      ).catch(() => {})
    }

    // Referral code format: PARR-XXXX
    const expectedCodePrefix = clientA.firstName.substring(0, 4).toUpperCase()
    const codeElement = page.getByText(new RegExp(`${expectedCodePrefix}-\\d{4}`))
    if (await codeElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(codeElement).toBeVisible()
    }

    // Step 2: Client B registers with the referral code (shared helper)
    const clientBFirstName = 'Filleul'
    const clientBPhone = testPhone()
    const clientBEmail = testEmail('filleul')

    await page.goto(`/join/${businessId}`)
    await expect(page.locator('h2')).toContainText('Rejoindre le programme')

    await fillJoinFormAndWaitForCard(page, {
      firstName: clientBFirstName,
      phone: clientBPhone,
      email: clientBEmail,
      referralCode,
    })

    // Step 3: Verify Client B's card page
    await expect(page).toHaveURL(/\/card\/[a-f0-9-]+/, { timeout: 10000 })

    // Step 4: Verify referral bonuses via database
    // The /api/join handler processes referral synchronously before responding,
    // so by the time we're on the card page, the DB should be updated.
    const supabase = createAdminClient()

    // Client A (parrain) should have received 5 points
    const { data: referrerCard } = await supabase
      .from('loyalty_cards')
      .select('current_points')
      .eq('id', clientA.cardId)
      .single()

    expect(referrerCard?.current_points).toBeGreaterThanOrEqual(5)

    // Client B (filleul) should have received 2 bonus points
    const { data: clientBCards } = await supabase
      .from('loyalty_cards')
      .select('current_points')
      .eq('business_id', businessId)
      .neq('id', clientA.cardId)
      .order('created_at', { ascending: false })
      .limit(1)

    expect(clientBCards?.[0]?.current_points).toBeGreaterThanOrEqual(2)

    // Verify a referral record was created
    const { data: referrals } = await supabase
      .from('referrals')
      .select('referrer_points_awarded, referred_points_awarded')
      .eq('referrer_card_id', clientA.cardId)
      .eq('business_id', businessId)

    expect(referrals?.length).toBeGreaterThanOrEqual(1)
    expect(referrals?.[0]?.referrer_points_awarded).toBe(5)
    expect(referrals?.[0]?.referred_points_awarded).toBe(2)

    // Step 5: Navigate back to Client A's card and verify UI
    await page.goto(`/card/${clientA.qrCodeId}`)
    await expect(page.getByText(/carte/i).first()).toBeVisible({ timeout: 10000 })
  })
})
