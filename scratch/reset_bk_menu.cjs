const fs = require('fs');
const path = require('path');

const clientDataPath = path.join(__dirname, '..', 'client', 'src', 'lib', 'data.ts');

if (!fs.existsSync(clientDataPath)) {
    console.error(`Error: client/src/lib/data.ts not found!`);
    process.exit(1);
}

let content = fs.readFileSync(clientDataPath, 'utf8');

// Find the index of burgerking-constanta
const targetId = 'id: "burgerking-constanta",';
const idIndex = content.indexOf(targetId);
if (idIndex === -1) {
    console.error("Error: Could not find burgerking-constanta in data.ts!");
    process.exit(1);
}

// Find the start of the menu: [ array
const menuStartIndex = content.indexOf('menu: [', idIndex);
if (menuStartIndex === -1) {
    console.error("Error: Could not find menu: [ in data.ts!");
    process.exit(1);
}

// Find the matching closing bracket ] of the menu array
let bracketCount = 1;
let currentIndex = menuStartIndex + 'menu: ['.length;

while (bracketCount > 0 && currentIndex < content.length) {
    const char = content[currentIndex];
    if (char === '[') {
        bracketCount++;
    } else if (char === ']') {
        bracketCount--;
    }
    currentIndex++;
}

if (bracketCount !== 0) {
    console.error("Error: Could not find matching closing bracket for menu array!");
    process.exit(1);
}

// Replace the entire menu array with menu: []
const updatedContent = content.slice(0, menuStartIndex) + 'menu: []' + content.slice(currentIndex);
fs.writeFileSync(clientDataPath, updatedContent, 'utf8');
console.log("Successfully reset burgerking-constanta menu to menu: [] in client/src/lib/data.ts!");
