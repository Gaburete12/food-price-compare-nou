import fs from 'fs';
const chunks = JSON.parse(fs.readFileSync('scratch/next_f_mesopotamia-constanta.json', 'utf8'));
console.log("Chunks count in file:", chunks.length);
