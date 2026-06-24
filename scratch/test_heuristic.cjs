const fs = require('fs');
const path = require('path');

let jsonStr = fs.readFileSync(path.join(__dirname, 'ocr_results.json'), 'utf8');
if (jsonStr.charCodeAt(0) === 0xFEFF) {
    jsonStr = jsonStr.slice(1);
}
const ocrData = JSON.parse(jsonStr);

// Let's test on the first item
const firstItem = ocrData.find(d => d.index === 1);

// Analyze layout
const lines = firstItem.lines.map(line => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    line.words.forEach(w => {
        if (w.x < minX) minX = w.x;
        if (w.x + w.w > maxX) maxX = w.x + w.w;
        if (w.y < minY) minY = w.y;
        if (w.y + w.h > maxY) maxY = w.y + w.h;
    });
    
    return {
        text: line.text,
        minX,
        maxX,
        minY,
        maxY,
        centerY: (minY + maxY) / 2
    };
}).sort((a, b) => a.centerY - b.centerY);

// Find category header (e.g., lines starting at X=270-350, Y < 100)
let category = "Unknown";
const catLine = lines.find(l => l.minX >= 270 && l.minX <= 350 && l.centerY < 100);
if (catLine) {
    category = catLine.text;
}

console.log(`Detected Category: ${category}`);

// Find all prices
// A price line has X > 950 and contains a number with comma or "RON"
const priceLines = lines.filter(l => l.minX > 950 && l.minX < 1100 && (l.text.includes(',') || l.text.includes('RON')));

console.log(`Found ${priceLines.length} price lines:`);
priceLines.forEach(pl => {
    console.log(`  Price: '${pl.text}' at Y=${Math.round(pl.centerY)}`);
});

// Group products
const products = [];
priceLines.forEach(pl => {
    const priceY = pl.centerY;
    
    // Find name line (X around 400-420, Y close to priceY)
    const nameLine = lines.find(l => l.minX >= 400 && l.minX <= 420 && Math.abs(l.centerY - priceY) < 20);
    if (!nameLine) {
        console.log(`  Warning: Could not find name line for price '${pl.text}' at Y=${Math.round(priceY)}`);
        return;
    }
    
    // Find description lines (X around 400-420, Y between nameLine.centerY + 10 and nameLine.centerY + 120)
    // and make sure it doesn't overlap with another product's name Y
    const descLines = lines.filter(l => {
        return l.minX >= 400 && l.minX <= 420 && 
               l.centerY > nameLine.centerY + 10 && 
               l.centerY < nameLine.centerY + 120;
    });
    
    const description = descLines.map(dl => dl.text).join(' ');
    
    products.push({
        name: nameLine.text,
        priceText: pl.text,
        description,
        priceY,
        imgRect: {
            x: 279,
            y: Math.round(priceY - 4), // relative center
            w: 110,
            h: 110
        }
    });
});

console.log("\nGrouped Products:");
console.log(JSON.stringify(products, null, 2));
