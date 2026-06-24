import fs from 'fs';

const html = fs.readFileSync('scratch/homepage.html', 'utf8');

// Find all inputs
const inputs = [...html.matchAll(/<input[^>]*>/g)].map(m => m[0]);
console.log("Inputs found:", inputs);

// Find buttons
const buttons = [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map(m => `${m[0]} -> text: ${m[1].trim()}`);
console.log("Buttons found:", buttons.slice(0, 15));
