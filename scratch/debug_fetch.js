import fs from 'fs';

async function debug() {
  const urls = [
    "https://glovoapp.com/ro/ro/constanta/stores/mesopotamia-constanta",
    "https://glovoapp.com/ro/ro/constanta/stores/tacoseria-cta"
  ];
  for (const url of urls) {
    console.log("Fetching:", url);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Length:", text.length);
    console.log("Snippet:", text.slice(0, 1000));
    fs.writeFileSync(`scratch/debug_${url.split('/').pop()}.html`, text, 'utf8');
  }
}
debug();
