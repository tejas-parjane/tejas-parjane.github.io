import { expect, test } from '@playwright/test'

test('homepage loads and navigates to the project index', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'From data to intelligence.',
  )

  await page.getByRole('link', { name: 'Explore Projects' }).click()
  await expect(page).toHaveURL(/\/projects\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('implementation status')
})

test('project card opens a working case-study route', async ({ page }) => {
  await page.goto('/projects/')
  await page.getByRole('link', { name: 'Attention-OS', exact: true }).click()

  await expect(page).toHaveURL(/\/projects\/attention-os\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Attention-OS' })).toBeVisible()
})

test('theme toggle persists across a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /switch to dark theme/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('direct URL loads the interactive Business Diagnosis challenge', async ({ page }) => {
  await page.goto('/cognitive-os/business-diagnosis/')

  await expect(page.getByRole('heading', { level: 1, name: 'Business Diagnosis' })).toBeVisible()
  await page.getByRole('button', { name: /begin investigation/i }).click()
  await expect(page.getByRole('heading', { name: 'Evidence' })).toBeVisible()
  await expect(page.getByText('Competing hypotheses')).toBeVisible()
})

test('direct URL loads the interactive Agent Autopsy challenge', async ({ page }) => {
  await page.goto('/cognitive-os/agent-autopsy/')

  await expect(page.getByRole('heading', { level: 1, name: 'Agent Autopsy' })).toBeVisible()
  await page.getByRole('button', { name: /review the trace/i }).click()
  await expect(page.getByText('Execution timeline')).toBeVisible()
  await expect(page.getByText('Diagnostic comparisons')).toBeVisible()
  await page.getByRole('button', { name: 'Event 8 details' }).click()
  await expect(page.getByText(/kept refund-policy-v2 \(rank 1\)/i)).toBeVisible()
})
