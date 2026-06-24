import { execSync } from 'child_process';
const newJson = execSync('git show origin/main:data/restaurant-menus.json', { maxBuffer: 100 * 1024 * 1024 }).toString('utf8');
console.log('Total length:', newJson.length);
console.log('Last 500 chars:', newJson.slice(-500));
