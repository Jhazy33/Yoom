/**
 * TDD Test: R2 Upload Flow
 *
 * This test verifies the complete recording upload flow:
 * 1. Recording captures data
 * 2. Upload proxy receives file
 * 3. Metadata is saved
 * 4. Recording appears in list
 */

import { test, expect } from '@playwright/test';

test.describe('R2 Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('https://yoom.cihconsultingllc.com/login');
    await page.fill('input[placeholder="Enter your username"]', 'jhazy33');
    await page.fill('input[placeholder="Enter your password"]', 'Yoom2026!');
    await page.click('button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
  });

  test('should upload recording to R2', async ({ page }) => {
    // Setup: Listen for API calls
    const uploadProxyCalls: string[] = [];
    const uploadCompleteCalls: string[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/upload-proxy')) {
        uploadProxyCalls.push(url);
        console.log(`[Upload Proxy] ${response.status()} ${url}`);
      }
      if (url.includes('/api/upload-complete')) {
        uploadCompleteCalls.push(url);
        console.log(`[Upload Complete] ${response.status()} ${url}`);
      }
    });

    // Step 1: Go to recorder
    await page.goto('https://yoom.cihconsultingllc.com/recorder');
    await page.waitForLoadState('networkidle');

    // Step 2: Check recording count before
    await page.goto('https://yoom.cihconsultingllc.com/recordings');
    await page.waitForLoadState('networkidle');
    const recordingsBefore = await page.locator('[data-testid="recording-card"]').count();
    console.log(`Recordings before: ${recordingsBefore}`);

    // Step 3: Start recording
    await page.goto('https://yoom.cihconsultingllc.com/recorder');
    await page.click('button:has-text("Start Recording")');

    // Wait for recording to start
    await page.waitForSelector('text=Recording', { timeout: 5000 });

    // Step 4: Record for 5 seconds
    await page.waitForTimeout(5000);

    // Step 5: Stop recording
    await page.click('button:has-text("Stop Recording")');

    // Step 6: Wait for upload completion (max 60s)
    const startTime = Date.now();
    let uploadSuccess = false;

    while (Date.now() - startTime < 60000) {
      const errorElement = await page.locator('[data-testid="recording-error"]').first();
      const doneElement = await page.locator('[data-testid="recording-done"]').first();
      const hasError = await errorElement.count();
      const isDone = await doneElement.count();

      if (hasError > 0) {
        const errorText = await errorElement.textContent();
        throw new Error(`Recording failed: ${errorText}`);
      }

      if (isDone > 0) {
        uploadSuccess = true;
        break;
      }

      await page.waitForTimeout(1000);
    }

    expect(uploadSuccess, 'Upload should complete within 60 seconds').toBe(true);

    // Verify upload proxy was called
    expect(uploadProxyCalls.length, 'Upload proxy should be called').toBeGreaterThan(0);

    // Verify upload-complete was called
    expect(uploadCompleteCalls.length, 'Upload complete should be called').toBeGreaterThan(0);

    // Step 7: Verify recording appears in list
    await page.goto('https://yoom.cihconsultingllc.com/recordings');
    await page.waitForLoadState('networkidle');

    const recordingsAfter = await page.locator('[data-testid="recording-card"]').count();
    console.log(`Recordings after: ${recordingsAfter}`);

    expect(recordingsAfter, 'Should have one more recording').toBe(recordingsBefore + 1);
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // This test verifies error handling when upload fails
    await page.goto('https://yoom.cihconsultingllc.com/recorder');

    // Mock upload proxy failure by intercepting the request
    await page.route('**/api/upload-proxy', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Simulated upload failure' })
      });
    });

    // Start and stop recording
    await page.click('button:has-text("Start Recording")');
    await page.waitForTimeout(3000);
    await page.click('button:has-text("Stop Recording")');

    // Wait for error state
    await page.waitForSelector('[data-testid="recording-error"]', { timeout: 30000 });

    // Verify error message is displayed
    const errorElement = await page.locator('[data-testid="recording-error"]');
    const errorText = await errorElement.textContent();

    expect(errorText).toContain('Upload failed');
  });
});
