import { test, expect } from '@playwright/test'

test.describe('Authentication tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('signin page loads correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('signup page loads correctly', async ({ page }) => {
    await page.goto('/auth/signup')

    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('validation works on signin form', async ({ page }) => {
    // Test empty form submission
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()

    // Test invalid email format
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })

  test('validation works on signup form', async ({ page }) => {
    await page.goto('/auth/signup')

    // Test empty form submission
    await page.getByRole('button', { name: /sign up/i }).click()

    await expect(page.getByText(/name is required/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/username is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()

    // Test weak password
    await page.getByLabel(/password/i).fill('weak')
    await page.getByRole('button', { name: /sign up/i }).click()
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()

    // Test short username
    await page.getByLabel(/username/i).fill('ab')
    await page.getByRole('button', { name: /sign up/i }).click()
    await expect(page.getByText(/username must be at least 3 characters/i)).toBeVisible()
  })

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i)
    const toggleButton = page.locator('button').filter({ has: passwordInput })

    await passwordInput.fill('password123')
    await expect(passwordInput).toHaveAttribute('type', 'password')

    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('can navigate between signin and signup', async ({ page }) => {
    // From signin to signup
    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/\/auth\/signup/)
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible()

    // From signup back to signin
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/auth\/signin/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('form remembers input values during validation errors', async ({ page }) => {
    await page.goto('/auth/signup')

    // Fill out form with valid data except password
    await page.getByLabel(/name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/username/i).fill('testuser')
    await page.getByLabel(/password/i).fill('weak')

    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click()

    // Check that valid fields still have their values
    await expect(page.getByLabel(/name/i)).toHaveValue('Test User')
    await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com')
    await expect(page.getByLabel(/username/i)).toHaveValue('testuser')
  })

  test('form shows appropriate error states', async ({ page }) => {
    await page.goto('/auth/signup')

    // Focus and blur empty fields to trigger validation
    await page.getByLabel(/email/i).focus()
    await page.getByLabel(/email/i).blur()

    await page.getByLabel(/password/i).focus()
    await page.getByLabel(/password/i).blur()

    // Submit form to show all validation errors
    await page.getByRole('button', { name: /sign up/i }).click()

    // Check that inputs have error styling
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)

    await expect(emailInput).toHaveClass(/border-red-500|ring-red-500/)
    await expect(passwordInput).toHaveClass(/border-red-500|ring-red-500/)
  })

  test('protected routes redirect to signin', async ({ page }) => {
    // Try to access dashboard without being authenticated
    await page.goto('/dashboard')

    // Should redirect to signin page
    await expect(page).toHaveURL(/\/auth\/signin/)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('signin success redirects appropriately', async ({ page }) => {
    // Mock successful signin response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User',
            },
            accessToken: 'mock-token',
          },
        }),
      })
    })

    // Fill out signin form
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should redirect to dashboard or home page
    await page.waitForURL(/\/dashboard|^\/$/)
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/dashboard|^\/$/)
  })
})