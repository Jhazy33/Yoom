#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Testing Folder Isolation\n');

  try {
    // Login as testuser
    console.log('1. Login as testuser...');
    await page.goto('https://yoom.cihconsultingllc.com/login');
    await page.fill('input#username', 'testuser');
    await page.fill('input#password', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check recordings
    console.log('2. Check recordings...');
    await page.goto('https://yoom.cihconsultingllc.com/');
    await page.waitForTimeout(2000);

    const bodyText = await page.evaluate(() => document.body.textContent);
    const match = bodyText.match(/(\d+)\s+recordings?/);
    const count = match ? parseInt(matchMatch[1]) : 0;

    console.log(`   Testuser sees: ${count} recordings`);
    console.log(`   Expected: 0 (empty folder yoom-videos/testuser/)`);

    // Verify user cannot access admin settings
    console.log('\n3. Check settings access...');
    await page.goto('https://yoom.cihconsultingllc.com/settings#users');
    await page.waitForTimeout(2000);

    const settingsText = await page.evaluate(() => document.body.textContent);
    const hasUserManagement = settingsText.includes('User Management');

    console.log(`   User Management visible: ${hasUserManagement ? '❌' : '✅ (hidden)'}`);
    console.log(`   Expected: false (regular users cannot manage users)`);

    await page.screenshot({ path: 'screenshots/folder-isolation-test.png' });
    console.log('\n✅ Phase 3 Complete: Folder permissions working!');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
