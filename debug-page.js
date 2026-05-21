#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Log console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  console.log('Loading home page...\n');
  await page.goto('https://yoom.cihconsultingllc.com/', { waitUntil: 'networkidle' });

  console.log('Page URL:', page.url());
  console.log('Page title:', await page.title());

  console.log('\nPage text content:');
  const text = await page.textContent('body');
  console.log(text?.substring(0, 500) || 'No text content');

  console.log('\nWaiting 10 seconds for manual inspection...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  await browser.close();
})();
