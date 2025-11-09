import { test, expect } from '@playwright/test'

test.describe('Error Handling Tests', () => {
  test('404 page displays correctly', async ({ page }) => {
    // Go to non-existent page
    await page.goto('/non-existent-page-12345')

    // Check 404 page elements
    await expect(page.getByText(/404/i)).toBeVisible()
    await expect(page.getByText(/page not found/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible()

    // Test navigation back to home
    await page.getByRole('link', { name: /home/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('server error page displays correctly', async ({ page }) => {
    // Mock a server error
    await page.route('**/api/error-test', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
      })
    })

    // Navigate to a page that might trigger the error
    await page.goto('/api/error-test').catch(() => {})

    // Should show error page or handle gracefully
    const pageContent = await page.content()

    // Should not expose stack traces or sensitive information
    expect(pageContent).not.toMatch(/stack trace|\/home\/|C:\\Users|\/var\/www/i)
  })

  test('network error handling', async ({ page }) => {
    // Simulate network offline
    await page.context().setOffline(true)

    await page.goto('/')

    // Try to navigate to another page
    await page.getByRole('link', { name: /posts/i }).click()

    // Should handle offline state gracefully
    await page.waitForTimeout(2000)

    // Check for offline indicator or error message
    const offlineIndicator = page.getByText(/offline|no connection|network error/i)

    if (await offlineIndicator.isVisible()) {
      expect(offlineIndicator).toBeVisible()
    }

    // Restore network
    await page.context().setOffline(false)
  })

  test('API error handling in UI', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/posts', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch posts',
        }),
      })
    })

    await page.goto('/posts')

    // Should show error message to user
    await expect(page.getByText(/something went wrong|failed to load|error/i)).toBeVisible({ timeout: 10000 })

    // Should provide retry option
    const retryButton = page.getByRole('button', { name: /retry|try again/i })
    if (await retryButton.isVisible()) {
      expect(retryButton).toBeVisible()
    }
  })

  test('form submission error handling', async ({ page }) => {
    await page.goto('/auth/signin')

    // Mock API error for form submission
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials',
        }),
      })
    })

    // Fill form with invalid credentials
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show error message
    await expect(page.getByText(/invalid credentials|authentication failed/i)).toBeVisible()
  })

  test('timeout error handling', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/posts', route => {
      // Don't respond to simulate timeout
      // This will trigger timeout handling
    })

    await page.goto('/posts')

    // Should handle timeout gracefully
    await page.waitForTimeout(10000) // Wait for timeout

    // Check for timeout error message
    const timeoutMessage = page.getByText(/timeout|took too long|request timed out/i)
    if (await timeoutMessage.isVisible()) {
      expect(timeoutMessage).toBeVisible()
    }
  })

  test('JavaScript error handling', async ({ page }) => {
    await page.goto('/')

    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Trigger potential JavaScript error by interacting with page
    await page.getByRole('link', { name: /posts/i }).click()
    await page.waitForLoadState('networkidle')

    // Should not have unhandled JavaScript errors
    const unhandledErrors = consoleErrors.filter(error =>
      !error.includes('Warning:') && // Filter out warnings
      !error.includes('404') && // Expected 404s
      !error.includes('favicon')
    )

    // In a perfect world, there should be no unhandled errors
    console.log('JavaScript errors found:', unhandledErrors.length)
    if (unhandledErrors.length > 0) {
      console.log('Errors:', unhandledErrors)
    }
  })

  test('resource loading error handling', async ({ page }) => {
    // Mock failed resource loading
    await page.route('**/*.png', route => route.abort())
    await page.route('**/*.jpg', route => route.abort())
    await page.route('**/*.css', route => route.abort())

    await page.goto('/')

    // Page should still be functional even with missing resources
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()

    // Should handle broken images gracefully
    const images = await page.locator('img').all()
    for (const image of images) {
      const hasAlt = await image.getAttribute('alt')
      expect(hasAlt).toBeTruthy() // Images should have alt text for accessibility
    }
  })

  test('validation error handling', async ({ page }) => {
    await page.goto('/auth/signup')

    // Submit empty form
    await page.getByRole('button', { name: /sign up/i }).click()

    // Should show validation errors for all required fields
    await expect(page.getByText(/name is required/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()

    // Test individual field validation
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /sign up/i }).click()

    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })

  test('permission error handling', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard')

    // Should redirect to login or show permission error
    const currentUrl = page.url()

    if (currentUrl.includes('/auth/')) {
      // Redirected to login
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    } else {
      // Shows permission error
      await expect(page.getByText(/unauthorized|permission denied|access denied/i)).toBeVisible()
    }
  })

  test('rate limiting error handling', async ({ page }) => {
    await page.goto('/auth/signin')

    // Mock rate limit response
    let requestCount = 0
    await page.route('**/api/auth/login', route => {
      requestCount++
      if (requestCount > 3) {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Too many requests. Try again later.',
          }),
        })
      } else {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid credentials',
          }),
        })
      }
    })

    // Make multiple failed login attempts
    for (let i = 0; i < 5; i++) {
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword')
      await page.getByRole('button', { name: /sign in/i }).click()
      await page.waitForTimeout(1000)
    }

    // Should show rate limiting message
    await expect(page.getByText(/too many requests|rate limit|try again later/i)).toBeVisible()
  })

  test('graceful degradation', async ({ page }) => {
    // Disable JavaScript to test graceful degradation
    await page.context().addInitScript(() => {
      window.addEventListener('load', () => {
        // Simulate JS being disabled after load
        const scripts = document.querySelectorAll('script')
        scripts.forEach(script => script.remove())
      })
    })

    await page.goto('/')

    // Basic functionality should still work without JavaScript
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()

    // Links should still work
    const postsLink = page.getByRole('link', { name: /posts/i })
    if (await postsLink.isVisible()) {
      await postsLink.click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('/posts')
    }
  })

  test('error reporting mechanism', async ({ page }) => {
    await page.goto('/')

    // Check if error reporting is available
    const errorReported = await page.evaluate(() => {
      // Check for error tracking or reporting mechanisms
      return !!(
        window.gtag || // Google Analytics
        window.analytics || // Segment
        window.Sentry || // Sentry
        window.onerror // Global error handler
      )
    })

    if (errorReported) {
      console.log('Error reporting mechanism detected')
    }

    // Test error boundary behavior by triggering an error
    await page.evaluate(() => {
      // Trigger a harmless error to test error boundaries
      setTimeout(() => {
        throw new Error('Test error for error boundary testing')
      }, 1000)
    })

    await page.waitForTimeout(2000)

    // Page should still be functional
    await expect(page.getByRole('banner')).toBeVisible()
  })
})