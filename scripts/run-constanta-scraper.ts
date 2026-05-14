import { runScrapers } from "./scraper/index";

async function main() {
  const address = "Bulevardul Tomis 47, Constanta";
  console.log(`=== TEST SCRAPER CONSTANTA ===`);
  console.log(`Adresa: ${address}`);
  console.log(`------------------------------`);

  try {
    const results = await runScrapers(address);
    console.log(`\n=== REZULTATE SCRAPING ===`);
    console.log(JSON.stringify(results, null, 2));
    console.log(`\nScraping finalizat cu succes!`);
  } catch (error) {
    console.error(`\nEROARE LA SCRAPING:`, error);
  }
}

main();
