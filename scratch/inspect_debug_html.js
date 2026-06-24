import fs from 'fs';

const mesopotamia = fs.readFileSync('scratch/debug_mesopotamia-constanta.html', 'utf8');
const tacoseria = fs.readFileSync('scratch/debug_tacoseria-cta.html', 'utf8');

console.log("Mesopotamia: contains 'închis'?", mesopotamia.toLowerCase().includes('închis'));
console.log("Mesopotamia: contains 'livr'?", mesopotamia.toLowerCase().includes('livr'));
console.log("Mesopotamia: contains 'adresă'?", mesopotamia.toLowerCase().includes('adresă'));
console.log("Mesopotamia: contains 'store'?", mesopotamia.toLowerCase().includes('store'));
console.log("Mesopotamia: contains 'next_f'?", mesopotamia.toLowerCase().includes('next_f'));

console.log("\nTacoseria: contains 'închis'?", tacoseria.toLowerCase().includes('închis'));
console.log("\nTacoseria body snippets:");
const mesopotamiaBody = mesopotamia.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
console.log("Mesopotamia text:", mesopotamiaBody.slice(0, 1000));
const tacoseriaBody = tacoseria.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
console.log("Tacoseria text:", tacoseriaBody.slice(0, 1000));
