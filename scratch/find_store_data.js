import fs from 'fs';

const chunks = JSON.parse(fs.readFileSync('scratch/chunks.json', 'utf8'));

// Let's print the structure of the first 10 chunks to see what they look like
console.log("First 10 chunks sample:");
for (let i = 0; i < Math.min(10, chunks.length); i++) {
  const c = chunks[i];
  console.log(`Chunk ${i}: type=${typeof c}, isArray=${Array.isArray(c)}, length=${c?.length}`);
  if (Array.isArray(c)) {
    console.log(`  c[0]=${c[0]}, c[1]=${typeof c[1] === 'string' ? c[1].slice(0, 100) : typeof c[1]}`);
  }
}

// Let's search for "initialStoreContent" or "Wrap" or "Chicken" in the chunks
console.log("\nSearching for keywords in chunks...");
for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i];
  if (Array.isArray(c) && typeof c[1] === 'string') {
    const text = c[1];
    if (text.includes("initialStoreContent")) {
      console.log(`Chunk ${i} contains initialStoreContent! Length: ${text.length}`);
    }
    if (text.includes("Wrap") || text.includes("Chicken")) {
      console.log(`Chunk ${i} contains Wrap/Chicken! Matches around Wrap:`, text.indexOf("Wrap") > -1 ? text.slice(text.indexOf("Wrap") - 50, text.indexOf("Wrap") + 50) : '');
    }
  }
}
