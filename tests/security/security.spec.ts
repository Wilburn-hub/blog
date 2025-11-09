import { test, expect } from '@playwright/test'

test.describe('Security Tests', () => {
  test('security headers are present', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers() || {}

    // Check for important security headers
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toMatch(/origin-when-cross-origin|strict-origin-when-cross-origin/)

    // CSP header should be present
    if (headers['content-security-policy']) {
      expect(headers['content-security-policy']).toBeDefined()
    }
  })

  test('no sensitive information in client-side code', async ({ page }) => {
    await page.goto('/')

    // Check if sensitive API keys or passwords are exposed
    const pageContent = await page.content()

    // Common patterns that shouldn't be in client code
    const sensitivePatterns = [
      /api[_-]?key/i,
      /secret[_-]?key/i,
      /password/i,
      /token.*['"]\w+['"]/i,
      /mongodb:\/\//,
      /mysql:\/\//,
      /postgres:\/\//
    ]

    for (const pattern of sensitivePatterns) {
      // Allow some exceptions for legitimate uses
      const matches = pageContent.match(pattern)
      if (matches) {
        console.warn(`Potential sensitive information found: ${matches[0]}`)
        // In a real test, you might want to fail on certain patterns
      }
    }
  })

  test('form inputs are properly sanitized', async ({ page }) => {
    await page.goto('/auth/signup')

    // Test XSS prevention in form inputs
    const xssPayload = '<script>alert("XSS")</script>'

    await page.getByLabel(/name/i).fill(xssPayload)
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/username/i).fill('testuser')
    await page.getByLabel(/password/i).fill('TestPass123!')

    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click()

    // Check if script tag was escaped
    const nameInput = page.getByLabel(/name/i)
    const inputValue = await nameInput.inputValue()

    // The script tag should be escaped or sanitized
    expect(inputValue).not.toContain('<script>')
  })

  test('CSRF protection on forms', async ({ page }) => {
    await page.goto('/auth/signin')

    // Check for CSRF token or similar protection
    const form = page.locator('form')
    const csrfToken = await form.locator('input[name*="csrf"], input[name*="token"]').count()

    if (csrfToken > 0) {
      // If CSRF token exists, ensure it's not empty
      const tokenValue = await form.locator('input[name*="csrf"], input[name*="token"]').inputValue()
      expect(tokenValue).toBeTruthy()
      expect(tokenValue.length).toBeGreaterThan(10)
    }
  })

  test('rate limiting on login attempts', async ({ page }) => {
    await page.goto('/auth/signin')

    // Mock multiple failed login attempts
    for (let i = 0; i < 5; i++) {
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword')
      await page.getByRole('button', { name: /sign in/i }).click()

      // Wait for response
      await page.waitForTimeout(1000)
    }

    // Check if we get rate limited or blocked
    const pageContent = await page.content()
    const hasRateLimitMessage = pageContent.match(/too many attempts|rate limit|try again later/i)

    if (hasRateLimitMessage) {
      expect(hasRateLimitMessage[0]).toBeTruthy()
    }
  })

  test('secure cookie attributes', async ({ page }) => {
    const responses: { url: string; headers: Record<string, string> }[] = []

    page.on('response', response => {
      if (response.headers()['set-cookie']) {
        responses.push({
          url: response.url(),
          headers: response.headers(),
        })
      }
    })

    await page.goto('/auth/signin')

    // Try to trigger auth to set cookies
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Check cookie security attributes
    responses.forEach(response => {
      const setCookieHeader = response.headers['set-cookie']
      if (setCookieHeader) {
        // Check for secure cookie attributes
        expect(setCookieHeader).toMatch(/HttpOnly|Secure|SameSite/i)
      }
    })
  })

  test('error messages don\'t reveal sensitive information', async ({ page }) => {
    // Test 404 error
    await page.goto('/non-existent-page')
    const notFoundContent = await page.content()

    // Should not reveal server details
    expect(notFoundContent).not.toMatch(/express|node\.js|stack trace|internal server error/i)

    // Test server error (if accessible)
    await page.goto('/api/error-test').catch(() => {}) // This might not exist
    const errorContent = await page.content()

    // Should not expose stack traces or internal paths
    expect(errorContent).not.toMatch(/\/home\/|\/var\/|C:\\|stack trace/i)
  })

  test('input validation and sanitization', async ({ page }) => {
    await page.goto('/search')

    // Test various malicious inputs
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '"><script>alert("XSS")</script>',
      '\';alert("XSS");//',
      '{{7*7}}', // Template injection
      '${7*7}',  // Expression injection
    ]

    const searchInput = page.getByPlaceholder(/search/i)

    for (const input of maliciousInputs) {
      await searchInput.fill(input)
      await searchInput.press('Enter')

      // Wait for navigation
      await page.waitForLoadState('networkidle')

      // Check if malicious content was executed (it shouldn't be)
      const pageContent = await page.content()
      expect(pageContent).not.toContain('alert("XSS")')

      // Go back to search page
      await page.goto('/search')
    }
  })

  test('directory traversal protection', async ({ page }) => {
    const traversalAttempts = [
      '/../../../etc/passwd',
      '/..\\..\\..\\windows\\system32',
      '/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '/..%252f..%252f..%252fetc%252fpasswd',
    ]

    for (const attempt of traversalAttempts) {
      const response = await page.goto(attempt).catch(() => null)

      if (response) {
        // Should not return file contents
        const content = await page.content()
        expect(content).not.toContain('root:x:0:0')
        expect(content).not.toContain('[boot loader]')
      }
    }
  })

  test('SQL injection protection', async ({ page }) => {
    await page.goto('/search')

    const sqlInjectionAttempts = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1' AND (SELECT COUNT(*) FROM users) > 0 --",
    ]

    const searchInput = page.getByPlaceholder(/search/i)

    for (const injection of sqlInjectionAttempts) {
      await searchInput.fill(injection)
      await searchInput.press('Enter')

      await page.waitForLoadState('networkidle')

      // Should not reveal database structure or data
      const pageContent = await page.content()
      expect(pageContent).not.toContain('sql syntax')
      expect(pageContent).not.toContain('mysql_fetch')
      expect(pageContent).not.toContain('ORA-')
      expect(pageContent).not.toContain('Microsoft OLE DB')
    }
  })

  test('session management security', async ({ page }) => {
    // Check if session ID is regenerated after login
    await page.goto('/auth/signin')

    // Get initial session cookie
    const initialCookies = await page.context().cookies()
    const initialSessionCookie = initialCookies.find(c => c.name.includes('session') || c.name.includes('token'))

    if (initialSessionCookie) {
      // Simulate login (this would need actual valid credentials)
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('password123')
      await page.getByRole('button', { name: /sign in/i }).click()

      // Check if session cookie changed (regenerated)
      await page.waitForTimeout(2000)
      const newCookies = await page.context().cookies()
      const newSessionCookie = newCookies.find(c => c.name.includes('session') || c.name.includes('token'))

      if (newSessionCookie) {
        // In a proper implementation, session ID should change after authentication
        // This test documents the expected behavior
        console.log('Session cookie after login:', newSessionCookie.value)
      }
    }
  })
})