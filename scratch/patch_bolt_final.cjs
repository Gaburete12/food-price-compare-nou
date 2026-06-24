const fs = require('fs');
let code = fs.readFileSync('scripts/scraper/bolt.ts', 'utf8');

const targetStr = `        // Forțăm încărcarea elementelor de tip lazy-loading
        for (let i = 0; i < 5; i++) {
          await restPage.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
          await restPage.waitForTimeout(600);
        }
        // Revenim sus pentru siguranță
        await restPage.evaluate(() => window.scrollTo(0, 0));

        const menuItems = await restPage.evaluate((url) => {`;

const newStr = `        const menuItemsMap = new Map<string, any>();

        // Focusăm body-ul pentru a permite mouse wheel nativ
        const boundingBox = await restPage.locator('body').boundingBox();
        if (boundingBox) {
            await restPage.mouse.move(boundingBox.width / 2, boundingBox.height / 2);
        }

        let prevSize = 0;
        let noChangeAttempts = 0;

        for (let scrollStep = 0; scrollStep < 40; scrollStep++) {
            const stepItems = await restPage.evaluate((url) => {`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newStr);
    
    // Now replace the end part
    const endStr = `            if (name && price > 0 && name.length < 100) {
              const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              items.push({
                id,
                name,
                description,
                category,
                imageUrl,
                prices: [{
                  platform: "bolt",
                  available: true,
                  price: price,
                  link: "" // Se populează în Node
                }]
              });
            }
          });
          return items;
        }, rest.url);`;

    const newEndStr = `            if (name && price > 0 && name.length < 100) {
              const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              items.push({
                id,
                name,
                description,
                category,
                imageUrl,
                prices: [{
                  platform: "bolt",
                  available: true,
                  price: price,
                  link: "" // Se populează în Node
                }]
              });
            }
          });
          return items;
        }, rest.url);

        for (const item of stepItems) {
            if (!menuItemsMap.has(item.name)) {
                item.prices[0].link = rest.url;
                menuItemsMap.set(item.name, item);
            }
        }

        await restPage.mouse.wheel(0, 1000);
        await restPage.waitForTimeout(400);

        if (menuItemsMap.size === prevSize) {
            noChangeAttempts++;
            if (noChangeAttempts >= 6) {
                console.log(\`Bolt: Am ajuns la final, extragerea s-a oprit după \${scrollStep} scroll-uri.\`);
                break;
            }
        } else {
            noChangeAttempts = 0;
            prevSize = menuItemsMap.size;
        }
      }

      const menuItems = Array.from(menuItemsMap.values());`;

    if (code.includes(endStr)) {
        code = code.replace(endStr, newEndStr);
        fs.writeFileSync('scripts/scraper/bolt.ts', code);
        console.log('PATCH_SUCCESS');
    } else {
        console.log('FAILED_TO_FIND_END');
    }
} else {
    console.log('FAILED_TO_FIND_START');
}
