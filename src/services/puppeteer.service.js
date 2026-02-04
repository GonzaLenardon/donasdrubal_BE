import puppeteer from 'puppeteer';

let browserInstance = null;

export async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      protocolTimeout: 120_000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
    });
  }
  return browserInstance;
}
