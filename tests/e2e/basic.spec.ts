import { test, expect } from '@playwright/test'

test.describe('Basic functionality tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/')

    // Check if page title is correct
    await expect(page).toHaveTitle(/Personal Blog/)

    // Check if main elements are present
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()

    // Check navigation
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/')

    // Test navigation to posts page
    await page.getByRole('link', { name: /posts/i }).click()
    await expect(page).toHaveURL(/\/posts/)
    await expect(page.getByRole('heading', { name: /posts/i })).toBeVisible()

    // Test navigation back to home
    await page.getByRole('link', { name: /home/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('search functionality works', async ({ page }) => {
    await page.goto('/')

    // Find search input and enter search term
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()

    await searchInput.fill('test post')
    await searchInput.press('Enter')

    // Should navigate to search results page
    await expect(page).toHaveURL(/\/search/)
    await expect(page.getByText(/search results/i)).toBeVisible()
  })

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check mobile navigation
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible()

    // Open mobile menu
    await page.getByRole('button', { name: /menu/i }).click()
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/')

    // Find dark mode toggle
    const themeToggle = page.getByRole('button', { name: /theme/i })
    await expect(themeToggle).toBeVisible()

    // Toggle dark mode
    await themeToggle.click()

    // Check if dark mode is applied (you might need to check for a specific class or attribute)
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Toggle back to light mode
    await themeToggle.click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('error pages work correctly', async ({ page }) => {
    // Go to non-existent page
    await page.goto('/non-existent-page')

    // Should show 404 page
    await expect(page.getByText(/404/i)).toBeVisible()
    await expect(page.getByText(/page not found/i)).toBeVisible()
  })

  test('loading states work', async ({ page }) => {
    await page.goto('/')

    // Navigate to posts page
    await page.getByRole('link', { name: /posts/i }).click()

    // Should show loading indicator initially
    const loadingIndicator = page.getByText(/loading/i)
    await expect(loadingIndicator).toBeVisible()

    // Wait for content to load
    await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 })
  })

  test('footer links work', async ({ page }) => {
    await page.goto('/')

    // Find footer
    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()

    // Test social media links if they exist
    const socialLinks = footer.locator('a[href*="twitter"], a[href*="github"], a[href*="linkedin"]')
    const count = await socialLinks.count()

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const link = socialLinks.nth(i)
        await expect(link).toBeVisible()
        await expect(link).toHaveAttribute('href')
      }
    }
  })
})