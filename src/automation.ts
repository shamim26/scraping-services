import puppeteer from "puppeteer";
import { closeBrowser, getBrowser } from "./utils/puppeteer";

export async function getPhoneSuggestions(url: string, search: string) {
  const browser = await puppeteer.launch({ headless: false });
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

  let currentPage = 1;
  let hasMoreProducts = true;
  const results = [];

  while (hasMoreProducts) {
    const paginatedUrl = `${url}?currentPage=${currentPage}`;
    await page.goto(paginatedUrl);

    const productCards = await page.$$('div[class^="ProductCard_ProductCard"]');
    if (productCards.length === 0) {
      hasMoreProducts = false;
      console.log("No more products found");
      break;
    }

    for (const card of productCards) {
      // Title
      const title = await card.$eval("h4.ProductCard_cardTitle__HlwIo", (el) =>
        el.textContent?.trim()
      );

      // Price
      const price = await card.$eval("span.ProductCard_price__t9DLm", (el) =>
        el.textContent?.trim()
      );

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

      // Image
      const image = await card.$eval(
        "div.ProductCard_cardTop__x1s9c img",
        (el) => el.getAttribute("src")
      );
      const imageAlt = await card.$eval(
        "div.ProductCard_cardTop__x1s9c img",
        (el) => el.getAttribute("alt")
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

      // Main Image
      const mainImage = await detailPage.$eval(
        "div.Top_mainImage__Jl6rU img.Top_image__3b3Bd",
        (el) => el.getAttribute("src")
      );

      // Short Features (bulleted list)
      const features = await detailPage.$$eval(
        "div.html-content ul li",
        (els) => els.map((el) => el.textContent?.trim())
      );

      // Available Colors
      const colors = await detailPage.$$eval(
        "button.Top_option__gX7oZ",
        (els) => els.map((el) => el.getAttribute("title"))
      );

      // Warranty
      let warranty = null;
      try {
        warranty = await detailPage.$eval(
          "div.Top_warranty__c92S8 span",
          (el) => el.textContent?.trim()
        );
      } catch {}

      await detailPage.close();

      results.push({
        title,
        price,
        oldPrice,
        productLink: fullProductUrl,
        image,
        imageAlt,
        detailTitle,
        mainImage,
        features,
        colors,
        warranty,
      });
    }

    currentPage++;
  }

  await page.close();
  await closeBrowser();
  return results;
}
