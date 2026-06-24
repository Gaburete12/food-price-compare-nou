import fs from 'fs';

const rawText = fs.readFileSync('scratch/next_f_mesopotamia-constanta.json', 'utf8');
const data = JSON.parse(rawText);
console.log("JSON.parse length:", data.length);
console.log("Is array?", Array.isArray(data));

// Count how many keys the object has
console.log("Object keys count:", Object.keys(data).length);
console.log("Type of keys:", typeof Object.keys(data)[0]);
console.log("First 5 keys:", Object.keys(data).slice(0, 5));
console.log("Last 5 keys:", Object.keys(data).slice(-5));
