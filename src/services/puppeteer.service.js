import puppeteer from 'puppeteer';

let browserInstance = null;

export async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
    });
  }
  return browserInstance;
}
