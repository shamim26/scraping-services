import { getBrowser } from "./utils/puppeteer";

export async function getPhoneSuggestions(url: string, search: string) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  await page.goto(url);
  await page.setViewport({ width: 1080, height: 720 });

  await page.waitForSelector("form input[name='sSearch']");
  await page.click("form input[name='sSearch']");
  await page.type("form input[name='sSearch']", search);

  await page.waitForFunction(
    () => {
      const items = Array.from(
        document.querySelectorAll("div.phone-results ul li a")
      );
      return items.some(
        (a) => a.getAttribute("href") && a.getAttribute("href") !== "#"
      );
    },
    { timeout: 3000 }
  );

  const suggestions = await page.evaluate(() => {
    const items = Array.from(
      document.querySelectorAll("div.phone-results ul li a")
    );
    return items.map((a) => {
      const href = a.getAttribute("href");
      const img = a.querySelector("img");
      const imgSrc = img?.getAttribute("src");
      const name = a.querySelector("span")?.innerText;
      return {
        name,
        imgSrc,
      };
    });
  });
  await page.close();
  return suggestions;
}
