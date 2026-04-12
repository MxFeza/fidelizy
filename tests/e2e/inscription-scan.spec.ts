import { test, expect } from '@playwright/test'
import {
  createAdminClient,
  createTestBusiness,
  cleanupTestData,
  testEmail,
  testPhone,
  fillJoinFormAndWaitForCard,
} from './helpers'

let businessId: string

test.beforeAll(async () => {
  const supabase = createAdminClient()
  await cleanupTestData(supabase)

  const biz = await createTestBusiness(supabase, { initial_stamps: 2 })
  businessId = biz.id
})

test.afterAll(async () => {
  const supabase = createAdminClient()
  await cleanupTestData(supabase)
})

test.describe('Parcours 1 — Inscription client + tampon bienvenue', () => {
  test('un nouveau client s\'inscrit via /join et recoit 2 tampons bienvenue', async ({ page }) => {
    const firstName = 'Alice'
    const phone = testPhone()
    const email = testEmail('inscription')

    await page.goto(`/join/${businessId}`)
    await expect(page.locator('h2')).toContainText('Rejoindre le programme')

    // Fill form + handle OTP/fallback (shared helper)
    await fillJoinFormAndWaitForCard(page, { firstName, phone, email })

    // Verify card page
    await expect(page).toHaveURL(/\/card\/[a-f0-9-]+/, { timeout: 10000 })

    // Stamp count: 2 welcome stamps out of 10
    const stampBadge = page.locator('text=/^2$/').first()
    await expect(stampBadge).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('/10')).toBeVisible()

    // Business name visible
    await expect(page.locator('text=/Test Commerce/').first()).toBeVisible()

    // Stamp grid rendered
    const stampsContainer = page.locator('[class*="grid"]').first()
    await expect(stampsContainer).toBeVisible()
  })
})
