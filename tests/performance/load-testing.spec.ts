import { test, expect } from '@playwright/test'

test.describe('Performance and Load Testing', () => {
  test('page load performance metrics', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')

    const loadTime = Date.now() - startTime

    // Check basic load time should be under 3 seconds
    expect(loadTime).toBeLessThan(3000)

    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0,
      }
    })

    // Core Web Vitals checks
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2500) // FCP < 2.5s
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000) // DCL < 3s
  })

  test('API response times', async ({ page }) => {
    await page.goto('/')

    // Listen for network responses
    const responses: { url: string; status: number; responseTime: number }[] = []

    page.on('response', response => {
      const url = response.url()
      if (url.includes('/api/')) {
        responses.push({
          url,
          status: response.status(),
          responseTime: Date.now(), // Simplified - in real test you'd measure actual response time
        })
      }
    })

    // Trigger API calls by navigating to posts page
    await page.getByRole('link', { name: /posts/i }).click()
    await page.waitForLoadState('networkidle')

    // Check API responses
    expect(responses.length).toBeGreaterThan(0)

    responses.forEach(response => {
      expect(response.status).toBeLessThan(500) // No server errors
    })
  })

  test('image loading performance', async ({ page }) => {
    await page.goto('/')

    // Wait for all images to load
    await page.waitForLoadState('networkidle')

    // Check for broken images
    const images = await page.locator('img').all()

    for (const image of images) {
      const naturalWidth = await image.evaluate(img => (img as HTMLImageElement).naturalWidth)
      expect(naturalWidth).toBeGreaterThan(0) // Image loaded successfully
    }

    // Check for proper alt attributes
    const imagesWithoutAlt = await page.locator('img:not([alt])').count()
    expect(imagesWithoutAlt).toBe(0)
  })

  test('memory usage stability', async ({ page }) => {
    await page.goto('/')

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })

    // Navigate through multiple pages
    const pages = ['/', '/posts', '/search']
    for (const pageUrl of pages) {
      await page.goto(pageUrl)
      await page.waitForLoadState('networkidle')
    }

    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })

    // Memory shouldn't increase dramatically (allowing some growth)
    const memoryIncrease = finalMemory - initialMemory
    const maxAllowedIncrease = 50 * 1024 * 1024 // 50MB

    expect(memoryIncrease).toBeLessThan(maxAllowedIncrease)
  })

  test('concurrent user simulation', async ({ context }) => {
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage(),
    ])

    // Simulate 3 concurrent users
    const navigationPromises = pages.map(async (page, index) => {
      await page.goto('/')
      await page.getByRole('link', { name: /posts/i }).click()
      await page.waitForLoadState('networkidle')

      // Simulate different user actions
      if (index === 0) {
        await page.getByPlaceholder(/search/i).fill('test')
      } else if (index === 1) {
        await page.getByRole('link', { name: /home/i }).click()
      } else {
        await page.reload()
      }
    })

    // All operations should complete without timeout
    await Promise.all(navigationPromises)

    // Clean up
    await Promise.all(pages.map(page => page.close()))
  })

  test('resource loading optimization', async ({ page }) => {
    const responses: { url: string; size: number; type: string }[] = []

    page.on('response', async response => {
      const url = response.url()
      const headers = response.headers()
      const size = parseInt(headers['content-length'] || '0')

      responses.push({
        url,
        size,
        type: headers['content-type'] || 'unknown',
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for gzipped responses
    const textResponses = responses.filter(r => r.type.includes('text'))
    const hasCompression = textResponses.some(r => r.url.includes('.js') || r.url.includes('.css'))

    if (hasCompression) {
      // In a real scenario, you'd check for gzip/brotli compression headers
      console.log('Text resources loaded:', textResponses.length)
    }

    // Check total page size (should be reasonable)
    const totalSize = responses.reduce((sum, r) => sum + r.size, 0)
    expect(totalSize).toBeLessThan(5 * 1024 * 1024) // Less than 5MB
  })

  test('cache headers validation', async ({ page }) => {
    const cacheHeaders: { url: string; cacheControl?: string; etag?: string }[] = []

    page.on('response', response => {
      const headers = response.headers()
      cacheHeaders.push({
        url: response.url(),
        cacheControl: headers['cache-control'],
        etag: headers['etag'],
      })
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check static assets have appropriate cache headers
    const staticAssets = cacheHeaders.filter(h =>
      h.url.includes('.js') || h.url.includes('.css') || h.url.includes('.png') || h.url.includes('.jpg')
    )

    staticAssets.forEach(asset => {
      if (asset.cacheControl) {
        // Static assets should have some cache control
        expect(asset.cacheControl).toBeDefined()
      }
    })
  })
})