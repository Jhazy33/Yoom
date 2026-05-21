#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Testing with manual login...\n');

  // Go to login
  await page.goto('https://yoom.cihconsultingllc.com/login');
  await page.waitForLoadState('networkidle');

  console.log('✅ Login page loaded');
  console.log('Please login manually (username: jhazy33, password: Yoom2026!)');
  console.log('Then press Enter in this terminal to check the page...\n');

  // Wait for user to login
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  console.log('\nChecking page structure...\n');

  // Check current URL
  console.log('Current URL:', page.url());

  // Look for any interactive elements
  console.log('\nAll buttons:');
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons`);

  console.log('\nAll links:');
  const links = await page.locator('a').all();
  console.log(`Found ${links.length} links`);

  // Show first 10 links
  for (let i = 0; i < Math.min(10, links.length); i++) {
    const link = links[i];
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(`  ${i + 1}. "${text?.trim()}" → ${href}`);
  }

  console.log('\nWaiting 10 seconds for manual inspection...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  await browser.close();
})();
