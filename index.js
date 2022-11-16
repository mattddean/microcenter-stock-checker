'use strict';

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { executablePath } = require('puppeteer')
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  let attempt = 0

  while (true) {
    console.log('attempt', attempt)
    const inStock = await loop()
    if (inStock) return // quit the program once we've detected that the product is in stock
    await sleep(180000) // 3 minutes
    attempt++
  }
}

main().catch(console.error)

async function loop() {
  const STORE_ID = '181'
  const URL = 'https://www.microcenter.com/product/641917/intel-core-i7-12700k-alder-lake-36ghz-twelve-core-lga-1700-boxed-processor-heatsink-not-included'
  // const URL = 'https://www.microcenter.com/product/652626/intel-core-i7-13700k-raptor-lake-34ghz-sixteen-core-lga-1700-boxed-processor-heatsink-not-included'

  const inStock = await isInStock(URL, STORE_ID)

  if (inStock) {
    console.log('in stock')

    await client.messages.create({
      body: 'Your watched product is in stock at MicroCenter!',
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.TWILIO_TO_NUMBER
    })
  } else {
    console.log('out of stock')
  }

  return inStock
}

async function isInStock(url, storeId) {
  puppeteer.use(StealthPlugin())

  const browser = await puppeteer.launch({executablePath: executablePath()});
  const page = await browser.newPage();
  page.setCookie({'name': 'storeSelected', 'value': storeId, domain: '.microcenter.com', session: false, secure: true})
  page.setCookie({'name': 'myStore', 'value': 'true', domain: '.microcenter.com', session: true, secure: true})

  // Load MicroCenter page.
  await page.goto(`${url}?storeid=${storeId}`);

  // Wait for the results page to load and display the results.
  const inventorySelector = '#pnlInventory .inventory';
  await page.waitForSelector(inventorySelector);

  const inventoryStatusElement = await page.$('#pnlInventory .inventory .inventoryCnt');

  await browser.close();

  // The .inventoryCnt element is only present in the DOM when the item is in stock.
  if (inventoryStatusElement) {
    return true
  } else {
    return false
  }  
}
