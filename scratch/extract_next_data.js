import fs from 'fs';

const filePath = 'C:/Users/andre/.gemini/antigravity/brain/c8afe6ee-37d6-4e6c-abee-f45e1e88b96c/.system_generated/steps/5696/content.md';
const content = fs.readFileSync(filePath, 'utf8');

// Find NEXT_DATA JSON blob
const match = content.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (match) {
  console.log("Found __NEXT_DATA__!");
  const json = JSON.parse(match[1]);
  fs.writeFileSync('scratch/next_data.json', JSON.stringify(json, null, 2));
  console.log("Saved to scratch/next_data.json");
} else {
  console.log("__NEXT_DATA__ not found");
}
