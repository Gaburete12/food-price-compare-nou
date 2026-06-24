import fs from 'fs';

const filePath = 'C:/Users/andre/.gemini/antigravity/brain/c8afe6ee-37d6-4e6c-abee-f45e1e88b96c/.system_generated/steps/5696/content.md';
const content = fs.readFileSync(filePath, 'utf8');

// Find all matches of self.__next_s or next_f script payloads
const scripts = [...content.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
console.log(`Found ${scripts.length} script tags`);

for (let i = 0; i < scripts.length; i++) {
  const s = scripts[i];
  if (s.includes('pizza') || s.includes('shaorma') || s.includes('Chow Mein')) {
    console.log(`Script ${i} matches! Length: ${s.length}`);
    fs.writeFileSync(`scratch/script_${i}.js`, s);
  }
}

// Let's also search for visible elements in HTML text
const bodyWithoutTags = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
console.log('Sample body text:', bodyWithoutTags.slice(0, 1000));
