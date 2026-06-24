import fs from 'fs';

const data = fs.readFileSync('client/src/lib/data.ts', 'utf8');

// Find all lines containing id: "..." or id: '...'
const ids = [...data.matchAll(/id:\s*["']([^"']+)["']/g)].map(m => m[1]);
console.log('All IDs found in data.ts:', [...new Set(ids)]);
