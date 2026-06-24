import fs from 'fs';

const code = fs.readFileSync('scratch/script_86.js', 'utf8');

// Find the JSON block starting after .push([0, or similar
// Let's find the first index of { and parse it or search for it using regex
const startIndex = code.indexOf('{');
const endIndex = code.lastIndexOf('}');

if (startIndex !== -1 && endIndex !== -1) {
  const jsonStr = code.slice(startIndex, endIndex + 1);
  try {
    const data = JSON.parse(jsonStr);
    console.log("Successfully parsed JSON!");
    fs.writeFileSync('scratch/menu_extracted.json', JSON.stringify(data, null, 2));
    console.log("Saved script state to scratch/menu_extracted.json");
  } catch (e) {
    console.error("Failed to parse JSON directly:", e.message);
    // If it fails, let's try a regex matching keys and values or look for products
    const products = [...code.matchAll(/"name"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"([^"]*)"\s*,\s*"imageUrl"\s*:\s*"([^"]*)"\s*,\s*"price"\s*:\s*([\d.]+)/g)];
    console.log(`Found ${products.length} products via simple regex!`);
  }
}
