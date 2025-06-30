import puppeteer from "puppeteer";
import { closeBrowser, getBrowser } from "./utils/puppeteer";

export async function getPhoneSuggestions(url: string, search: string) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  await page.goto(url);
  await page.setViewport({ width: 1080, height: 720 });

  // Wait for all brand links to appear
  await page.waitForSelector("div.CategoryList_list__TSyXP a");

  // Find the link with the matching brand name and click it
  const brandClicked = await page.evaluate((brandName) => {
    const links = Array.from(
      document.querySelectorAll("div.CategoryList_list__TSyXP a")
    );
    const link = links.find(
      (a) => a.textContent?.trim().toLowerCase() === brandName.toLowerCase()
    );
    if (link) {
      (link as HTMLElement).click();
      return true;
    }
    return false;
  }, search);

  if (!brandClicked) {
    throw new Error(`Brand link with name "${search}" not found`);
  }

  // Wait for product cards to appear instead of waiting for navigation
  await page.waitForSelector('div[class^="ProductCard_ProductCard"]', {
    timeout: 30000,
  });

  let hasMoreProducts = true;
  const results = [];

  while (hasMoreProducts) {
    // Wait for product cards to appear
    await page.waitForSelector('div[class^="ProductCard_ProductCard"]', {
      timeout: 30000,
    });

    const productCards = await page.$$('div[class^="ProductCard_ProductCard"]');
    if (productCards.length === 0) {
      hasMoreProducts = false;
      break;
    }

    for (const card of productCards) {
      // Price
      let price = null;
      try {
        price = await card.$eval("span.ProductCard_price__t9DLm", (el) =>
          el.textContent?.trim()
        );
      } catch {}

      // Old Price (optional)
      let oldPrice = null;
      try {
        oldPrice = await card.$eval("span.ProductCard_prePrice__hRsk1", (el) =>
          el.textContent?.trim()
        );
      } catch {}

      // Product Link
      const productLink = await card.$eval(
        "div.ProductCard_cardBody__8nPmw a",
        (el) => el.getAttribute("href")
      );

      // Construct full URL if needed
      const baseUrl = "https://gadgetandgear.com/";
      const fullProductUrl = productLink?.startsWith("http")
        ? productLink
        : baseUrl.replace(/\/$/, "") + "/" + productLink?.replace(/^\//, "");

      // Open product detail page in a new tab
      const detailPage = await browser.newPage();
      await detailPage.goto(fullProductUrl, { waitUntil: "domcontentloaded" });

      // Wait for the main container to ensure the page is loaded
      await detailPage.waitForSelector("div.Top_container__AqeSG");

      // Product Name
      const detailTitle = await detailPage.$eval(
        "h1.Top_productName__i6Zp2",
        (el) => el.textContent?.trim()
      );

      // Short Features (bulleted list)
      const keyFeatures = await detailPage.$$eval(
        "div.html-content ul li",
        (els) => els.map((el) => el.textContent?.trim())
      );

      // Available Colors
      const colors = await detailPage.$$eval(
        "button.Top_option__gX7oZ",
        (els) => els.map((el) => el.getAttribute("title"))
      );

      // Scrape the specification table
      const specs = await detailPage.$$eval(
        "table.Description_specification__pXv75 tr.border-b",
        (rows) => {
          const specsArr: Record<string, string>[] = [];
          for (const row of rows) {
            const labelEl = row.querySelector('p[class*="basis-[30%]"]');
            const valueEl = row.querySelector('p[class*="basis-[70%]"]');
            if (labelEl && valueEl) {
              const key = labelEl.textContent?.trim() || "";
              const value = valueEl.textContent?.trim() || "";
              if (key && value) {
                const obj: Record<string, string> = {};
                obj[key] = value;
                specsArr.push(obj);
              }
            }
          }
          return specsArr;
        }
      );

      await detailPage.close();

      results.push({
        productName: detailTitle,
        price,
        oldPrice,
        colors,
        keyFeatures,
        specs,
      });
    }

    // Check for "Next" button and click if available
    const nextButton = await page.$("button.PageChange_right__IyfXJ");
    const totalPage = await page.$eval("p.PageChange_text__0eSpH", (el) =>
      el.textContent?.trim()
    );
    const totalPages = parseInt(totalPage?.match(/\d+/)?.[0] || "1", 10);
    const currentPage = parseInt(page.url().split("=")[1], 10);

    if (currentPage >= totalPages) {
      hasMoreProducts = false;
    } else {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        nextButton?.click(),
      ]);
    }
  }

  await page.close();
  await closeBrowser();
  return results;
}
