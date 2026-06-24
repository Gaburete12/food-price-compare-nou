const fs = require('fs');
const path = require('path');

const ocrData = JSON.parse(fs.readFileSync(path.join(__dirname, 'ocr_results.json'), 'utf8'));

// We want to process each screenshot
ocrData.forEach(item => {
    console.log(`\n=== FILE: ${item.file} (Index: ${item.index}) ===`);
    
    // Let's filter lines that are in the main content area (X between 250 and 1100)
    const contentLines = item.lines.map(line => {
        // Find min/max X and Y for the line
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

    // Print all lines with their X and Y bounds to see the layout
    contentLines.forEach(l => {
        console.log(`  X: [${Math.round(l.minX)}-${Math.round(l.maxX)}] Y: ${Math.round(l.centerY)} | ${l.text}`);
    });
});
