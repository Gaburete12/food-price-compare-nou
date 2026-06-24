import fs from "node:fs/promises";
import path from "node:path";

async function run() {
  const menusPath = path.resolve("data/restaurant-menus.json");
  const imagesDir = path.resolve("client/public/mcdonalds");

  const rawMenus = JSON.parse(await fs.readFile(menusPath, "utf8"));
  const mcMenuItems = rawMenus.menus["mcdonalds-constanta"] || [];

  const imageFiles = await fs.readdir(imagesDir);

  console.log(`Found ${mcMenuItems.length} McDonald's menu items in DB.`);
  console.log(`Found ${imageFiles.length} images in client/public/mcdonalds.`);

  // Print first 5 items
  console.log("\nSample DB Menu items:");
  mcMenuItems.slice(0, 10).forEach(item => {
    console.log(` - ${item.name} (Category: ${item.category})`);
  });

  console.log("\nSample Image Files:");
  imageFiles.slice(0, 10).forEach(file => {
    console.log(` - ${file}`);
  });
}

run().catch(console.error);
