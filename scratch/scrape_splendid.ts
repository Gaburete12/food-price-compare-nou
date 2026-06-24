import { chromium } from "playwright";
import fs from "fs";

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  const page = await context.newPage();
  
  console.log("Navigating to Glovo Wrap 'n Go (Splendid Chicken)...");
  await page.goto("https://glovoapp.com/ro/ro/constanta/stores/wrap-n-go-cta", { waitUntil: "networkidle" });
  
  const title = await page.title();
  console.log("Page title:", title);
  
  // Save page content for inspection
  const content = await page.content();
  fs.writeFileSync("scratch/splendid_glovo.html", content, "utf8");
  console.log("Saved HTML to scratch/splendid_glovo.html");
  
  // Extract all script contents
  const scriptContents = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll("script"));
    return scripts.map(s => s.textContent || s.src);
  });
  
  fs.writeFileSync("scratch/splendid_scripts.json", JSON.stringify(scriptContents, null, 2), "utf8");
  console.log("Saved script contents to scratch/splendid_scripts.json");
  
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
