const fs = require('fs');
const path = require('path');

let jsonStr = fs.readFileSync(path.join(__dirname, 'ocr_results.json'), 'utf8');
if (jsonStr.charCodeAt(0) === 0xFEFF) {
    jsonStr = jsonStr.slice(1);
}
const ocrData = JSON.parse(jsonStr);

ocrData.forEach(item => {
    const lines = item.lines.map(line => {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        line.words.forEach(w => {
            if (w.x < minX) minX = w.x;
            if (w.x + w.w > maxX) maxX = w.x + w.w;
            if (w.y < minY) minY = w.y;
            if (w.y + w.h > maxY) maxY = w.y + w.h;
        });
        return { text: line.text, minX, maxX, minY, maxY, centerY: (minY + maxY) / 2 };
    }).sort((a, b) => a.centerY - b.centerY);

    // Let's print the top lines (Y < 150) that could be category headers (X starting between 250 and 380)
    const headers = lines.filter(l => l.minX >= 250 && l.minX <= 380 && l.centerY < 150);
    const headerTexts = headers.map(h => `'${h.text}' (Y:${Math.round(h.centerY)})`).join(', ');
    console.log(`File ${item.file}: headers = [${headerTexts}]`);
});
