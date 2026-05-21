#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Testing Phase 3: Folder Isolation\n');

  try {
    // Step 1: Login as admin
    console.log('1. Login as admin...');
    await page.goto('https://yoom.cihconsultingllc.com/login');
    await page.fill('input#username', 'jhazy33');
    await page.fill('input#password', 'Yoom2026!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Step 2: Go to settings and add restricted user
    console.log('2. Navigate to User Management...');
    await page.goto('https://yoom.cihconsultingllc.com/settings#users');
    await page.waitForTimeout(2000);

    console.log('3. Click "Add New User"...');
    const addButton = await page.locator('text=+ Add New User').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);

      console.log('4. Fill in user details...');
      await page.fill('input[type="text"]', 'testuser');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.selectOption('select', 'user'); // Regular user role

      // Set folder access to testuser only
      const folderInput = await page.locator('input[placeholder*="yoom-videos"]').first();
      await folderInput.fill('yoom-videos/testuser/');

      console.log('5. Submit user creation...');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      console.log('   ✅ Test user created!');
    } else {
      console.log('   ❌ Add User button not found');
      await browser.close();
      return;
    }

    // Step 3: Logout as admin
    console.log('\n6. Logout as admin...');
    await page.goto('https://yoom.cihconsultingllc.com/logout');
    await page.waitForTimeout(2000);

    // Step 4: Login as test user
    console.log('\n7. Login as testuser...');
    await page.goto('https://yoom.cihconsultingllc.com/login');
    await page.fill('input#username', 'testuser');
    await page.fill('input#password', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Step 5: Check what recordings testuser sees
    console.log('\n8. Check testuser recording access...');
    await page.goto('https://yoom.cihconsultingllc.com/');
    await page.waitForTimeout(2000);

    const bodyText = await page.evaluate(() => document.body.textContent);
    const recordingMatch = bodyText.match(/(\d+)\s+recordings?/);
    const testUserCount = recordingMatch ? parseInt(recordingMatch[1]) : 0;

    console.log(`   Testuser sees: ${testUserCount} recordings`);
    console.log(`   Expected: 0 (no recordings in yoom-videos/testuser/)`);

    if (testUserCount === 0) {
      console.log('   ✅ Folder isolation working!');
    } else {
      console.log('   ❌ Folder isolation may not be working');
    }

    await page.screenshot({ path: 'screenshots/phase3-folder-isolation.png' });
    console.log('\n   Screenshot saved');

  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\nKeeping browser open for 5 seconds...');
  await page.waitForTimeout(5000);

  await context.close();
  await browser.close();
})();
