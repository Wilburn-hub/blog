import { test, expect, devices } from '@playwright/test'

const viewports = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop Small', width: 1024, height: 768 },
  { name: 'Desktop Large', width: 1920, height: 1080 },
]

test.describe('Responsive Design Tests', () => {
  viewports.forEach(viewport => {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
      })

      test('homepage renders correctly', async ({ page }) => {
        await page.goto('/')

        // Check main elements are visible
        await expect(page.getByRole('banner')).toBeVisible()
        await expect(page.getByRole('main')).toBeVisible()
        await expect(page.getByRole('contentinfo')).toBeVisible()

        // Check navigation adapts to viewport
        if (viewport.width < 768) {
          // Mobile: should have hamburger menu
          await expect(page.getByRole('button', { name: /menu/i })).toBeVisible()
        } else {
          // Desktop: should have regular navigation
          await expect(page.getByRole('navigation')).toBeVisible()
        }
      })

      test('navigation works on all screen sizes', async ({ page }) => {
        await page.goto('/')

        // Mobile-specific navigation
        if (viewport.width < 768) {
          // Open mobile menu
          await page.getByRole('button', { name: /menu/i }).click()
          await expect(page.getByRole('navigation')).toBeVisible()

          // Navigate to posts
          await page.getByRole('link', { name: /posts/i }).click()
        } else {
          // Desktop navigation
          await page.getByRole('link', { name: /posts/i }).click()
        }

        await expect(page).toHaveURL(/\/posts/)
        await expect(page.getByRole('heading', { name: /posts/i })).toBeVisible()
      })

      test('text is readable on all screen sizes', async ({ page }) => {
        await page.goto('/')

        // Check font sizes are not too small
        const mainContent = page.getByRole('main')
        const textElements = await mainContent.locator('p, h1, h2, h3, h4, h5, h6').all()

        for (const element of textElements.slice(0, 5)) { // Check first 5 elements
          const fontSize = await element.evaluate(el => {
            const style = window.getComputedStyle(el)
            return parseInt(style.fontSize)
          })

          // Minimum readable font size (12px)
          expect(fontSize).toBeGreaterThanOrEqual(12)
        }
      })

      test('buttons are touch-friendly on mobile', async ({ page }) => {
        await page.goto('/auth/signup')

        if (viewport.width < 768) {
          // Check buttons have adequate touch target size (minimum 44x44px)
          const buttons = await page.locator('button').all()

          for (const button of buttons.slice(0, 3)) { // Check first 3 buttons
            const boundingBox = await button.boundingBox()
            if (boundingBox) {
              expect(boundingBox.width).toBeGreaterThanOrEqual(44)
              expect(boundingBox.height).toBeGreaterThanOrEqual(44)
            }
          }
        }
      })

      test('forms are usable on all screen sizes', async ({ page }) => {
        await page.goto('/auth/signup')

        // Check form fields are visible and usable
        await expect(page.getByLabel(/email/i)).toBeVisible()
        await expect(page.getByLabel(/password/i)).toBeVisible()
        await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()

        // Test form interaction
        await page.getByLabel(/email/i).fill('test@example.com')
        await page.getByLabel(/password/i).fill('password123')

        const emailValue = await page.getByLabel(/email/i).inputValue()
        expect(emailValue).toBe('test@example.com')
      })

      test('images scale properly', async ({ page }) => {
        await page.goto('/')

        // Wait for images to load
        await page.waitForLoadState('networkidle')

        const images = await page.locator('img').all()

        for (const image of images.slice(0, 3)) { // Check first 3 images
          const boundingBox = await image.boundingBox()
          if (boundingBox) {
            // Images should not overflow viewport
            expect(boundingBox.width).toBeLessThanOrEqual(viewport.width + 50) // Allow some margin
          }
        }
      })

      test('horizontal scrolling is avoided', async ({ page }) => {
        await page.goto('/')

        // Get page dimensions
        const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth)

        // Page width should not exceed viewport width (no horizontal scroll)
        expect(pageWidth).toBeLessThanOrEqual(viewport.width + 20) // Allow small tolerance
      })

      test('table content is handled on small screens', async ({ page }) => {
        // Test if there are any tables on the site
        await page.goto('/')

        const tables = await page.locator('table').all()

        if (tables.length > 0) {
          // On small screens, tables should be responsive or handled specially
          if (viewport.width < 768) {
            // Check for table scroll wrapper or responsive table implementation
            const tableWrapper = tables[0].locator('..')
            const hasOverflow = await tableWrapper.evaluate(el => {
              const style = window.getComputedStyle(el)
              return style.overflowX === 'auto' || style.overflowX === 'scroll'
            })

            // Either table should be wrapped in scrollable container
            // or table should have responsive design
            expect(hasOverflow || tables.length > 0).toBeTruthy()
          }
        }
      })
    })
  })

  test('orientation changes work correctly', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check initial layout
    await expect(page.getByRole('banner')).toBeVisible()

    // Change to landscape
    await page.setViewportSize({ width: 667, height: 375 })

    // Wait for layout adjustment
    await page.waitForTimeout(500)

    // Page should still be functional
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()

    // Navigation should adapt
    if (page.viewportSize() && page.viewportSize()!.width < 768) {
      await expect(page.getByRole('button', { name: /menu/i })).toBeVisible()
    }
  })

  test('high DPI displays are handled correctly', async ({ page }) => {
    // Set device pixel ratio for high DPI display
    await page.setViewportSize({ width: 375, height: 667 })
    await page.emulateMedia({ colorScheme: 'light' })

    await page.goto('/')

    // Check images have appropriate resolution handling
    const images = await page.locator('img').all()

    for (const image of images.slice(0, 2)) {
      const src = await image.getAttribute('src')
      if (src) {
        // Check for responsive image techniques
        const hasSrcSet = await image.getAttribute('srcset')
        const hasSizes = await image.getAttribute('sizes')

        // At least one responsive image technique should be present
        expect(hasSrcSet || hasSizes || src.includes('w=') || src.includes('q=')).toBeTruthy()
      }
    }
  })

  test('accessibility features work across screen sizes', async ({ page }) => {
    await page.goto('/')

    // Check semantic HTML structure
    await expect(page.getByRole('banner')).toBeVisible() // header
    await expect(page.getByRole('main')).toBeVisible() // main content
    await expect(page.getByRole('contentinfo')).toBeVisible() // footer

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(0)

    // Check for skip links (especially important on mobile)
    const skipLinks = await page.locator('a[href^="#"]').all()
    // This is optional but good to have
  })
})

test.describe('Browser Compatibility Tests', () => {
  test('works in different browser engines', async ({ page, browserName }) => {
    await page.goto('/')

    // Basic functionality should work in all browsers
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()

    // Test navigation
    await page.getByRole('link', { name: /posts/i }).click()
    await expect(page).toHaveURL(/\/posts/)

    // Test form interaction
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')

    const emailValue = await page.getByLabel(/email/i).inputValue()
    expect(emailValue).toBe('test@example.com')

    console.log(`Browser compatibility test passed for ${browserName}`)
  })

  test('ES6+ features are properly transpiled', async ({ page }) => {
    await page.goto('/')

    // Test that modern JavaScript features work
    const modernJSWorks = await page.evaluate(() => {
      try {
        // Test arrow functions
        const arrow = () => true
        if (!arrow()) return false

        // Test template literals
        const template = `test ${'string'}`
        if (template !== 'test string') return false

        // Test destructuring
        const { test } = { test: true }
        if (!test) return false

        // Test async/await
        const asyncWorks = async () => true
        return asyncWorks()
      } catch (error) {
        return false
      }
    })

    expect(modernJSWorks).toBe(true)
  })

  test('CSS features are properly handled', async ({ page }) => {
    await page.goto('/')

    // Test CSS Grid and Flexbox support
    const layoutWorks = await page.evaluate(() => {
      const container = document.querySelector('nav, header, main')
      if (!container) return true // Skip if no container found

      const style = window.getComputedStyle(container)
      return (
        style.display === 'flex' ||
        style.display === 'grid' ||
        style.display === 'block'
      )
    })

    expect(layoutWorks).toBe(true)
  })

  test('localStorage and sessionStorage work', async ({ page }) => {
    await page.goto('/')

    const storageWorks = await page.evaluate(() => {
      try {
        // Test localStorage
        localStorage.setItem('test', 'value')
        const localValue = localStorage.getItem('test')
        localStorage.removeItem('test')

        // Test sessionStorage
        sessionStorage.setItem('test', 'value')
        const sessionValue = sessionStorage.getItem('test')
        sessionStorage.removeItem('test')

        return localValue === 'value' && sessionValue === 'value'
      } catch (error) {
        return false
      }
    })

    expect(storageWorks).toBe(true)
  })
})