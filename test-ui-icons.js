#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Testing UI Icons on https://yoom.cihconsultingllc.com\n');

  try {
    // Login
    console.log('1. Login...');
    await page.goto('https://yoom.cihconsultingllc.com/login');
    await page.fill('input#username', 'jhazy33');
    await page.fill('input#password', 'Yoom2026!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check for back arrow
    console.log('\n2. Checking for back arrow...');
    const backArrow = await page.$('button[aria-label="Go back"], button.back, svg[class*="arrow"]');
    console.log(`   Back arrow: ${backArrow ? '✅ Found' : '❌ Missing'}`);

    // Check for home icon
    console.log('\n3. Checking for home icon...');
    const homeIcon = await page.$('a[href="/"], a[aria-label="Home"], svg[class*="home"]');
    console.log(`   Home icon: ${homeIcon ? '✅ Found' : '❌ Missing'}`);

    // Check hamburger menu
    console.log('\n4. Checking hamburger menu...');
    const hamburger = await page.$('button[aria-label="Menu"], button.hamburger, button[class*="menu"]');
    console.log(`   Hamburger button: ${hamburger ? '✅ Found' : '❌ Missing'}`);

    // Test hamburger click if found
    if (hamburger) {
      console.log('\n5. Testing hamburger click...');
      await hamburger.click();
      await page.waitForTimeout(1000);

      const menuVisible = await page.evaluate(() => {
        const menu = document.querySelector('[role="menu"], .dropdown-menu, nav.mobile-menu');
        return menu !== null && menu.classList.contains('hidden') === false;
      });

      console.log(`   Menu opens: ${menuVisible ? '✅' : '❌'}`);
    }

    // Screenshot current state
    await page.screenshot({ path: 'screenshots/ui-icons-test.png', fullPage: true });
    console.log('\n   Screenshot saved: screenshots/ui-icons-test.png');

    // Get page HTML to debug
    const headerHTML = await page.evaluate(() => {
      const header = document.querySelector('header');
      return header ? header.innerHTML.substring(0, 500) : 'No header found';
    });
    console.log('\n6. Header HTML preview:');
    console.log(headerHTML);

  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\nKeeping browser open for 10s...');
  await page.waitForTimeout(10000);

  await browser.close();
})();
