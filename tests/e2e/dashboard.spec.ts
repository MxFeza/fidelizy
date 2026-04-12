import { test, expect } from '@playwright/test'
import {
  createAdminClient,
  createTestBusiness,
  createTestCustomer,
  cleanupTestData,
} from './helpers'

let businessId: string
let merchantEmail: string
let merchantPassword: string

test.beforeAll(async () => {
  const supabase = createAdminClient()
  await cleanupTestData(supabase)

  // Create a test business with merchant credentials
  const biz = await createTestBusiness(supabase)
  businessId = biz.id
  merchantEmail = biz.email
  merchantPassword = biz.password

  // Create a few test customers so the dashboard has data
  await createTestCustomer(supabase, businessId, {
    firstName: 'ClientA',
    stamps: 3,
  })
  await createTestCustomer(supabase, businessId, {
    firstName: 'ClientB',
    stamps: 7,
  })
  await createTestCustomer(supabase, businessId, {
    firstName: 'ClientC',
    stamps: 1,
  })
})

test.afterAll(async () => {
  const supabase = createAdminClient()
  await cleanupTestData(supabase)
})

test.describe('Parcours 2 — Dashboard commercant', () => {
  test('un commercant se connecte, voit ses KPIs, liste clients, et detail client', async ({
    page,
  }) => {
    // Step 1: Login
    await page.goto('/dashboard/login')
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()

    await page.getByPlaceholder('vous@exemple.com').fill(merchantEmail)
    await page.locator('input[type="password"]').fill(merchantPassword)
    await page.getByRole('button', { name: /se connecter/i }).click()

    // Wait for dashboard content to load (WebKit doesn't fire "load" on client-side nav)
    // The dashboard shows KPI cards with numbers using font-bold class
    const kpiValues = page.locator('[class*="font-bold"][class*="text-gray-900"]')
    await expect(kpiValues.first()).toBeVisible({ timeout: 30000 })

    // Wait for enriched KPIs from /api/dashboard/kpis (appears after initial render)
    await page.waitForResponse(
      (res) => res.url().includes('/api/dashboard/kpis') && res.status() === 200,
      { timeout: 15000 }
    ).catch(() => {})
    // Re-count after API response
    const kpiCount = await kpiValues.count()
    expect(kpiCount).toBeGreaterThanOrEqual(4)

    // Step 3: Navigate to clients list
    // Click on "Clients" link in sidebar (desktop) or bottom nav (mobile)
    const clientsLink = page.getByRole('link', { name: /clients/i }).first()
    await clientsLink.click()

    await page.waitForURL(/\/dashboard\/clients/, { timeout: 10000 })

    // Verify the clients table/list is visible
    // Desktop: table with rows; Mobile: cards
    const clientEntries = page.locator('table tbody tr, [class*="card"]').first()
    await expect(clientEntries).toBeVisible({ timeout: 10000 })

    // Verify at least one test client name appears
    await expect(page.getByText('ClientA').first()).toBeVisible()

    // Step 4: Click on a client to see the detail
    // Use the table row link (desktop) — first match
    await page.getByText('ClientA').first().click()

    // Wait for the client detail page
    await page.waitForURL(/\/dashboard\/clients\//, { timeout: 10000 })

    // Verify client detail page shows the client name
    await expect(page.getByText('ClientA').first()).toBeVisible()

    // Verify stamp visualization is present (a grid of stamps)
    const stampGrid = page.locator('[class*="grid"]').first()
    await expect(stampGrid).toBeVisible({ timeout: 5000 })
  })
})
