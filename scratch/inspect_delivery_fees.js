import fs from 'fs';

const fees = JSON.parse(fs.readFileSync('data/delivery-fees.json', 'utf8'));
console.log("Delivery fee keys:", Object.keys(fees.fees));
console.log("Sample fee override for cin-cin-constanta:", fees.fees['cin-cin-constanta']);
