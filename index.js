'use strict';

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { executablePath } = require('puppeteer')

async function main() {
  const twelve = 'https://www.microcenter.com/product/641917/intel-core-i7-12700k-alder-lake-36ghz-twelve-core-lga-1700-boxed-processor-heatsink-not-included?storeid=181'
  const thirteen = 'https://www.microcenter.com/product/652626/intel-core-i7-13700k-raptor-lake-34ghz-sixteen-core-lga-1700-boxed-processor-heatsink-not-included?storeid=181'

  const inStock = await isInStock(thirteen)
  console.log('in stock', inStock)
}

async function isInStock(url) {
  puppeteer.use(StealthPlugin())

  const browser = await puppeteer.launch({executablePath: executablePath()});
  const page = await browser.newPage();
  page.setCookie({'name': 'storeSelected', 'value': '181', domain: '.microcenter.com', session: false, secure: true})
  page.setCookie({'name': 'myStore', 'value': 'true', domain: '.microcenter.com', session: true, secure: true})

  // Load micro center page
  await page.goto(url);

  // Wait for the results page to load and display the results.
  const inventorySelector = '#pnlInventory .inventory';
  await page.waitForSelector(inventorySelector);

  const inventoryStatusElement = await page.$('#pnlInventory .inventory .inventoryCnt');

  await browser.close();

  if (inventoryStatusElement) {
    return true
  } else {
    return false
  }  
}

main().catch(console.error)
