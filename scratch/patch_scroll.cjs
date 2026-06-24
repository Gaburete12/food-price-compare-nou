const fs = require('fs');
let code = fs.readFileSync('scripts/scraper/bolt.ts', 'utf8');

const oldScroll = `        // Forțăm încărcarea elementelor de tip lazy-loading
        for (let i = 0; i < 5; i++) {
          await restPage.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
          await restPage.waitForTimeout(600);
        }
        // Revenim sus pentru siguranță
        await restPage.evaluate(() => window.scrollTo(0, 0));`;

const newScroll = `        // Forțăm încărcarea elementelor de tip lazy-loading prin auto-scroll
        await restPage.evaluate(async () => {
          await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 400; // Scrollăm câte 400px o dată
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;
              // Opțional putem adăuga o limită maximă pentru a nu bloca la infinit (ex: 30000px)
              if (totalHeight >= scrollHeight || totalHeight > 30000) {
                clearInterval(timer);
                resolve(true);
              }
            }, 300); // 300ms delay între scroll-uri pentru a da timp react-ului
          });
        });
        
        // Mai dăm un mic timeout după scroll pentru siguranță
        await restPage.waitForTimeout(2000);
        // Revenim sus pentru siguranță
        await restPage.evaluate(() => window.scrollTo(0, 0));`;

code = code.replace(oldScroll, newScroll);
fs.writeFileSync('scripts/scraper/bolt.ts', code);
