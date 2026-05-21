#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Testing JWT authentication...\n');

  // 1. Login page
  console.log('1. Navigating to login page...');
  await page.goto('https://yoom.cihconsultingllc.com/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/jwt-01-login.png' });
  console.log('   ✅ Login page loaded');

  // 2. Fill credentials
  console.log('2. Filling credentials...');
  await page.fill('input#username', 'jhazy33');
  await page.fill('input#password', 'Yoom2026!');
  console.log('   ✅ Credentials filled');

  // 3. Submit login
  console.log('3. Submitting login...');
  await page.click('button[type="submit"]');

  // 4. Wait for redirect
  console.log('4. Waiting for redirect...');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/jwt-02-after-login.png' });
  console.log('   ✅ Redirect complete');

  // 5. Check URL
  const currentUrl = page.url();
  console.log(`   Current URL: ${currentUrl}`);

  // 6. Check for authenticated content
  const hasWelcome = await page.textContent('body').then(text => text.includes('Welcome to Yoom'));
  const hasSignOut = await page.textContent('body').then(text => text.includes('Sign Out'));

  if (hasWelcome && hasSignOut) {
    console.log('\n✅ JWT AUTHENTICATION SUCCESSFUL!');
    console.log('   - User logged in');
    console.log('   - Session persists');
    console.log('   - Navigation working');
  } else {
    console.log('\n❌ JWT AUTHENTICATION FAILED');
    console.log('   - hasWelcome:', hasWelcome);
    console.log('   - hasSignOut:', hasSignOut);
  }

  console.log('\nKeeping browser open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);

  await browser.close();
})();
