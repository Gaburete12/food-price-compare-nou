import fs from 'fs';

async function test() {
  try {
    const res = await fetch("https://glovoapp.com/ro/ro/constanta/stores/wrap-n-go-cta", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Length:", text.length);
    fs.writeFileSync('scratch/glovo_test.html', text, 'utf8');
    console.log("Saved HTML to scratch/glovo_test.html");
  } catch (e) {
    console.error(e);
  }
}
test();
