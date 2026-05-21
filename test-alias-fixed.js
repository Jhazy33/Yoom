#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login
    console.log('1. Login...');
    await page.goto('https://yoom.cihconsultingllc.com/login');
    await page.fill('input#username', 'jhazy33');
    await page.fill('input#password', 'Yoom2026!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check hamburger
    console.log('\n2. Check hamburger button...');
    const hamburger = await page.$('button[aria-label="Open navigation menu"]');
    console.log(`   Hamburger: ${hamburger ? '✅' : '❌'}`);

    if (hamburger) {
      console.log('\n3. Click hamburger...');
      await hamburger.click();
      await page.waitForTimeout(1000);

      const sidebar = await page.$('[aria-label="Navigation sidebar"]');
      console.log(`   Sidebar opens: ${sidebar ? '✅' : '❌'}`);

      // Check home link
      const homeLink = await page.$('a[href="/"]');
      console.log(`   Home link: ${homeLink ? '✅' : '❌'}`);
    }

    await page.screenshot({ path: 'screenshots/alias-fixed-test.png', fullPage: true });
    console.log('\n   Screenshot saved');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
