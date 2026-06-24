const fs = require('fs');
const path = require('path');

let jsonStr = fs.readFileSync(path.join(__dirname, 'ocr_results.json'), 'utf8');
if (jsonStr.charCodeAt(0) === 0xFEFF) {
    jsonStr = jsonStr.slice(1);
}
const ocrData = JSON.parse(jsonStr);

ocrData.forEach(item => {
    // Find all price-like lines (ending with RON or having numbers with decimals and being on the right side)
    const priceCandidates = [];
    item.lines.forEach(line => {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        line.words.forEach(w => {
            if (w.x < minX) minX = w.x;
            if (w.x + w.w > maxX) maxX = w.x + w.w;
            if (w.y < minY) minY = w.y;
            if (w.y + w.h > maxY) maxY = w.y + w.h;
        });
        const centerY = (minY + maxY) / 2;
        
        if ((line.text.includes(',') || line.text.includes('.')) && (line.text.includes('RON') || line.text.includes('lei') || /\d+,\d+/.test(line.text))) {
            priceCandidates.push({ text: line.text, minX, maxX, centerY });
        }
    });

    if (priceCandidates.length > 0) {
        // Group candidate prices that are aligned on the right (similar X coordinates)
        // Usually, prices are aligned in a column
        const rightmostX = Math.max(...priceCandidates.map(p => p.minX));
        const alignedPrices = priceCandidates.filter(p => Math.abs(p.minX - rightmostX) < 100);
        
        const avgPriceX = alignedPrices.reduce((sum, p) => sum + p.minX, 0) / alignedPrices.length;
        console.log(`File ${item.file}: detected price column at X=${Math.round(avgPriceX)} | count=${alignedPrices.length}`);
    } else {
        console.log(`File ${item.file}: NO price column detected!`);
    }
});
