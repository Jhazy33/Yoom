#!/usr/bin/env node

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Checking login page structure...\n');
  await page.goto('https://yoom.cihconsultingllc.com/login');
  await page.waitForLoadState('networkidle');

  // Get all input fields
  const inputs = await page.locator('input').all();
  console.log(`Found ${inputs.length} input fields:`);

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const placeholder = await input.getAttribute('placeholder');
    const name = await input.getAttribute('name');
    const type = await input.getAttribute('type');
    console.log(`  ${i + 1}. placeholder="${placeholder}", name="${name}", type="${type}"`);
  }

  console.log('\nAll buttons:');
  const buttons = await page.locator('button').all();
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    console.log(`  ${i + 1}. "${text}"`);
  }

  console.log('\nPress Enter to close...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();
