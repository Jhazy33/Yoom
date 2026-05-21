#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Testing Yoom Navigation on Production...\n');

  // Navigate to login
  console.log('1. Navigating to login page...');
  await page.goto('https://yoom.cihconsultingllc.com/login');
  await page.waitForLoadState('networkidle');
  console.log('✅ Login page loaded\n');

  // Login
  console.log('2. Logging in...');
  await page.fill('input[placeholder="Enter your username"]', 'jhazy33');
  await page.fill('input[placeholder="Enter your password"]', 'Yoom2026!');
  await page.click('button:has-text("Sign In")');

  // Wait for navigation to home
  await page.waitForURL('**/', { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');
  console.log('✅ Logged in successfully\n');

  // Test hamburger menu
  console.log('3. Testing hamburger menu...');
  const hamburger = await page.locator('button:has-text("Open navigation")').first();
  if (await hamburger.isVisible()) {
    console.log('✅ Hamburger menu visible');

    // Click hamburger
    await hamburger.click();
    await page.waitForTimeout(500);

    // Check sidebar items
    console.log('\n4. Checking sidebar navigation items...');

    const navItems = [
      { text: 'Home', href: '/' },
      { text: 'Start Recording', href: '/recorder' },
      { text: 'Manage Recordings', href: '/recordings' },
      { text: 'Settings', href: '/settings' }
    ];

    for (const item of navItems) {
      const element = await page.locator(`a:has-text("${item.text}")`).first();
      if (await element.isVisible()) {
        console.log(`✅ ${item.text} link present`);
      } else {
        console.log(`❌ ${item.text} link MISSING`);
      }
    }

    // Check sign out button
    console.log('\n5. Checking Sign Out button...');
    const signOut = await page.locator('button:has-text("Sign Out")').first();
    if (await signOut.isVisible()) {
      console.log('✅ Sign Out button present');
    } else {
      console.log('❌ Sign Out button MISSING');
    }

    // Close sidebar
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

  } else {
    console.log('❌ Hamburger menu NOT FOUND');
  }

  // Test navigation to recordings page
  console.log('\n6. Testing navigation to /recordings...');
  await page.goto('https://yoom.cihconsultingllc.com/recordings');
  await page.waitForLoadState('networkidle');

  const recordingsTitle = await page.locator('h1:has-text("My Recordings")').first();
  if (await recordingsTitle.isVisible()) {
    console.log('✅ Recordings page loaded successfully');
  } else {
    console.log('❌ Recordings page NOT loading');
  }

  // Check hamburger on recordings page
  const hamburgerRecordings = await page.locator('button:has-text("Open navigation")').first();
  if (await hamburgerRecordings.isVisible()) {
    console.log('✅ Hamburger menu present on recordings page');
  } else {
    console.log('❌ Hamburger menu MISSING on recordings page');
  }

  console.log('\n✨ Navigation testing complete!\n');

  await browser.close();
})();
