import fs from 'fs';

const code = fs.readFileSync('scratch/script_86.js', 'utf8');
console.log('Script 86 start:', code.slice(0, 1000));
console.log('Script 86 end:', code.slice(-1000));
