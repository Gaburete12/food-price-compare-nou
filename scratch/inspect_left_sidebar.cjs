const fs = require('fs');
const path = require('path');

let jsonStr = fs.readFileSync(path.join(__dirname, 'ocr_results.json'), 'utf8');
if (jsonStr.charCodeAt(0) === 0xFEFF) {
    jsonStr = jsonStr.slice(1);
}
const ocrData = JSON.parse(jsonStr);

ocrData.forEach(item => {
    const sidebar = [];
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
        
        if (minX >= 50 && minX <= 220) {
            sidebar.push({ text: line.text, y: centerY });
        }
    });
    
    if (sidebar.length > 0) {
        // Sort by Y
        sidebar.sort((a, b) => a.y - b.y);
        console.log(`File ${item.file}: sidebar = [${sidebar.map(s => s.text).join(' | ')}]`);
    }
});
