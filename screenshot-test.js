#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('Taking screenshots to verify deployment...\n');

  // Screenshot 1: Login page
  console.log('1. Screenshotting login page...');
  await page.goto('https://yoom.cihconsultingllc.com/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/01-login.png' });
  console.log('   ✅ Saved: screenshots/01-login.png');

  // Screenshot 2: Home page (should show "Please sign in")
  console.log('2. Screenshotting home page (not logged in)...');
  await page.goto('https://yoom.cihconsultingllc.com/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/02-home-not-logged-in.png' });
  console.log('   ✅ Saved: screenshots/02-home-not-logged-in.png');

  // Login
  console.log('3. Logging in...');
  await page.goto('https://yoom.cihconsultingllc.com/login');
  await page.fill('input[placeholder="Enter your username"]', 'jhazy33');
  await page.fill('input[placeholder="Enter your password"]', 'Yoom2026!');
  await page.click('button:has-text("Sign In")');

  // Wait for navigation
  await page.waitForTimeout(3000);

  // Screenshot 3: Home page after login
  console.log('4. Screenshotting home page (after login)...');
  await page.screenshot({ path: 'screenshots/03-home-after-login.png' });
  console.log('   ✅ Saved: screenshots/03-home-after-login.png');

  console.log('\n✅ Screenshots complete! Check screenshots/ folder.');
  console.log('Press Enter to close browser...');

  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();
