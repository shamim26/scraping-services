import { getBrowser } from "./utils/puppeteer";
import puppeteer from "puppeteer";

export async function getProductSuggestions(name: string, category: string) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  // ...scraping logic here...
  await page.goto("https://example.com/search?q=" + encodeURIComponent(name));
  // ...extract data...
  await page.close();
  return [
    /* suggestions */
  ];
}
