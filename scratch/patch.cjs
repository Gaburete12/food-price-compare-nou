const fs = require('fs');
let code = fs.readFileSync('scripts/scraper/bolt.ts', 'utf8');

code = code.replace(
  `let productElements = Array.from(document.querySelectorAll('div[role="button"], a, li'));`,
  `let productElements = Array.from(document.querySelectorAll('[data-testid="components.DishList.DishRow.view"]'));
          if(productElements.length === 0) productElements = Array.from(document.querySelectorAll('div[role="button"], a, li'));`
);

code = code.replace(
  `return (txt.includes('lei') || txt.includes('Lei') || txt.includes('RON')) && txt.length > 5 && txt.length < 500;`,
  `return (txt.includes('lei') || txt.includes('Lei') || txt.includes('RON')) && txt.length > 5 && txt.length < 1500;`
);

code = code.replace(
  `const nameEl = card.querySelector('h3, h4, [class*="name"], [class*="title"], [class*="Name"], [class*="Title"]');`,
  `const nameEl = card.querySelector('[data-testid="components.DishList.DishRow.title"], h3, h4, [class*="name"], [class*="title"], [class*="Name"], [class*="Title"]');`
);

code = code.replace(
  `let priceEl = card.querySelector('[class*="price"], [class*="Price"], .price');`,
  `let priceEl = card.querySelector('[data-testid="components.Price.originalPrice"], [data-testid="components.Price.discountedPrice"], [class*="price"], [class*="Price"], .price');`
);

code = code.replace(
  `const descEl = card.querySelector('[class*="description"], [class*="Description"], p');`,
  `const descEl = card.querySelector('[data-testid="components.DishList.DishRow.description"], [class*="description"], [class*="Description"], p');`
);

code = code.replace(
  `const imgEl = card.querySelector('img');`,
  `const imgEl = card.querySelector('[data-testid="components.DishList.DishRow.image"] img, img');`
);

fs.writeFileSync('scripts/scraper/bolt.ts', code);
