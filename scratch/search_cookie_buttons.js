import fs from 'fs';

const html = fs.readFileSync('scratch/homepage.html', 'utf8');

// Search for buttons
const buttons = [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map(m => ({
  html: m[0],
  text: m[1].replace(/<[^>]*>/g, '').trim()
}));

console.log("Buttons with accept/cookie/consent:");
buttons.forEach(b => {
  if (b.html.toLowerCase().includes('accept') || b.html.toLowerCase().includes('cookie') || b.html.toLowerCase().includes('consent') || b.html.toLowerCase().includes('toat')) {
    console.log(`- HTML: ${b.html.slice(0, 150)}...\n  Text: ${b.text}`);
  }
});
