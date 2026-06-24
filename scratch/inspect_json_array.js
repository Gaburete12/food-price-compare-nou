import fs from 'fs';

const chunks = JSON.parse(fs.readFileSync('scratch/next_f_mesopotamia-constanta.json', 'utf8'));
console.log("Chunks count in JSON array:", chunks.length);

for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i];
  console.log(`Index ${i}: type=${typeof c}, isArray=${Array.isArray(c)}`);
  if (Array.isArray(c)) {
    console.log(`  c[0]=${c[0]}, c[1]=${typeof c[1] === 'string' ? c[1].slice(0, 100) : typeof c[1]}`);
  }
}
