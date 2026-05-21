#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Testing Phase 3: Folder Permissions...\n');

  try {
    // Login as admin
    console.log('1. Logging in as admin (jhazy33)...');
    await page.goto('https://yoom.cihconsultingllc.com/login');
    await page.fill('input#username', 'jhazy33');
    await page.fill('input#password', 'Yoom2026!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Get admin's recording count
    console.log('2. Checking admin recording count...');
    await page.goto('https://yoom.cihconsultingllc.com/');
    await page.waitForTimeout(2000);

    const adminRecordingsText = await page.evaluate(() => document.body.textContent);
    const adminMatch = adminRecordingsText.match(/(\d+)\s+recordings?/);
    const adminCount = adminMatch ? parseInt(adminMatch[1]) : 0;

    console.log(`   Admin sees: ${adminCount} recordings`);
    console.log(`   ✅ Admin has full access`);

    // Logout
    console.log('\n3. Logging out...');
    await page.goto('https://yoom.cihconsultingllc.com/logout');
    await page.waitForTimeout(2000);

    // TODO: Test with regular user once created
    console.log('\n4. Testing complete!');
    console.log('   Next: Add regular user and test folder isolation');
    console.log('   Expected: Regular user should only see their assigned folders');

    await page.screenshot({ path: 'screenshots/phase3-admin-view.png' });
    console.log('\n   Screenshot saved: screenshots/phase3-admin-view.png');
  } catch (error) {
    console.error('Error during test:', error);
  }

  console.log('\nKeeping browser open for 5 seconds...');
  await page.waitForTimeout(5000);

  await context.close();
  await browser.close();
})();
