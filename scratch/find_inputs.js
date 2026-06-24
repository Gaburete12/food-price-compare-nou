import fs from 'fs';
const html = fs.readFileSync('scratch/homepage.html', 'utf8');
const matches = html.match(/<input[^>]*>/g) || [];
console.log("Found", matches.length, "inputs:");
matches.forEach((m, idx) => console.log(idx, m));
