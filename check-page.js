#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Checking page structure after login...\n');

  // Login first
  await page.goto('https://yoom.cihconsultingllc.com/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[placeholder="Enter your username"]', 'jhazy33');
  await page.fill('input[placeholder="Enter your password"]', 'Yoom2026!');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/');
  await page.waitForLoadState('domcontentloaded');

  console.log('All buttons on page:');
  const buttons = await page.locator('button').all();
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const ariaLabel = await button.getAttribute('aria-label');
    console.log(`  ${i + 1}. text="${text.trim()}", aria-label="${ariaLabel}"`);
  }

  console.log('\nPress Enter to close...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  await browser.close();
})();
