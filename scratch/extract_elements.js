import fs from 'fs';

const html = fs.readFileSync('scratch/debug_mesopotamia-constanta.html', 'utf8');

// Get all script tags
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
console.log("Number of scripts:", scripts.length);

// Let's print the first 200 chars of each script
scripts.forEach((s, idx) => {
  console.log(`Script ${idx} (len=${s.length}): ${s.slice(0, 150).trim().replace(/\s+/g, ' ')}...`);
});
