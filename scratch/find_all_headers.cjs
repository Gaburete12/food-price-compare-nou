const fs = require('fs');
const path = require('path');

let jsonStr = fs.readFileSync(path.join(__dirname, 'ocr_results.json'), 'utf8');
if (jsonStr.charCodeAt(0) === 0xFEFF) {
    jsonStr = jsonStr.slice(1);
}
const ocrData = JSON.parse(jsonStr);

ocrData.forEach(item => {
    const candidates = [];
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
        
        // If line is in the main content header column and has standard header characteristics
        if (minX >= 250 && minX <= 380) {
            candidates.push({ text: line.text, x: minX, y: centerY });
        }
    });
    
    if (candidates.length > 0) {
        console.log(`File ${item.file}:`);
        candidates.forEach(c => {
            console.log(`  '${c.text}' at X=${Math.round(c.x)}, Y=${Math.round(c.y)}`);
        });
    }
});
