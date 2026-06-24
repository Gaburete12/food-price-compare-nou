import { execSync } from 'child_process';
const newJson = execSync('git show origin/main:data/restaurant-menus.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8');

try {
  JSON.parse(newJson);
  console.log("Successfully parsed JSON!");
} catch (e) {
  console.error(e.message);
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    console.log("Error context:");
    console.log(newJson.slice(Math.max(0, pos - 150), Math.min(newJson.length, pos + 150)));
  }
}
