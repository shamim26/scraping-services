import { getBrowser } from "./utils/puppeteer";
import puppeteer from "puppeteer";

export async function getPhoneSuggestions(url: string, name: string) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.goto(url);
  await page.setViewport({ width: 1080, height: 720 });

  // Wait for the list to be loaded (adjust selector as needed)
  await page.waitForSelector("aside");

  // Find the href for the specific phone brand
  const brandClicked = await page.evaluate((brandName) => {
    const links = Array.from(document.querySelectorAll("ul li a"));
    const link = links.find(
      (a) => a.textContent?.trim().toLowerCase() === brandName.toLowerCase()
    );
    if (link) {
      (link as HTMLAnchorElement).click();
      return true;
    }
    return false;
  }, name);

  if (!brandClicked) {
    await page.close();
    throw new Error("Brand not found");
  }

  // wait for the list of phones to be loaded
  await page.waitForSelector("div.makers");

  const phones = await page.evaluate(() => {
    const phoneLinks = Array.from(
      document.querySelectorAll("div.makers ul li a")
    );

    return phoneLinks.map((a) => {
      const img = a.querySelector("img");
      const span = a.querySelector("strong span");
      return {
        img: img?.src,
        name: span?.textContent?.trim(),
        title: img ? (img as HTMLImageElement).title : null,
      };
    });
  });

  await page.close();
  return phones;
}
