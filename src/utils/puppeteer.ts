import puppeteer, { Browser } from "puppeteer";

let browserInstance: Browser | null = null;

/**
 * Returns a singleton Puppeteer browser instance.
 * Launches a new browser if one does not already exist.
 */
export async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  browserInstance = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return browserInstance;
}

/**
 * Closes the Puppeteer browser instance if it exists.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
