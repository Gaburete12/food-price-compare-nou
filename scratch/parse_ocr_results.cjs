const fs = require('fs');
const path = require('path');

let jsonStr = fs.readFileSync(path.join(__dirname, 'ocr_results.json'), 'utf8');
if (jsonStr.charCodeAt(0) === 0xFEFF) {
    jsonStr = jsonStr.slice(1);
}
const ocrData = JSON.parse(jsonStr);

ocrData.forEach(item => {
    console.log(`\n=== FILE: ${item.file} (Index: ${item.index}) ===`);
    
    const contentLines = item.lines.map(line => {
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

    contentLines.forEach(l => {
        console.log(`  X: [${Math.round(l.minX)}-${Math.round(l.maxX)}] Y: ${Math.round(l.centerY)} | ${l.text}`);
    });
});
