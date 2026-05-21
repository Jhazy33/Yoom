#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    await page.goto('https://yoom.cihconsultingllc.com/login');
    await page.fill('input#username', 'jhazy33');
    await page.fill('input#password', 'Yoom2026!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Go to settings
    await page.goto('https://yoom.cihconsultingllc.com/settings#users');
    await page.waitForTimeout(2000);

    // Click Add User
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent.includes('Add New User'));
      if (addBtn) addBtn.click();
    });
    await page.waitForTimeout(1000);

    // Fill form (use more specific selectors)
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');

    // Select role
    await page.selectOption('select', 'user');

    // Set folders
    const folderInputs = await page.$$('input[type="text"]');
    for (const input of folderInputs) {
      const placeholder = await input.getAttribute('placeholder');
      if (placeholder && placeholder.includes('yoom-videos')) {
        await input.fill('yoom-videos/testuser/');
        break;
      }
    }

    // Click save button via JS
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(b => b.textContent.includes('Add') || b.textContent.includes('Save'));
      if (saveBtn) {
        saveBtn.click();
        console.log('Clicked save button');
      } else {
        console.error('Save button not found');
      }
    });

    console.log('Waiting for user creation...');
    await page.waitForTimeout(3000);

    console.log('✅ Test user should be created');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await page.waitForTimeout(5000);
  await context.close();
  await browser.close();
})();
