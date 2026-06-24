import fs from 'fs';

const mesopotamia = fs.readFileSync('scratch/debug_mesopotamia-constanta.html', 'utf8');
const tacoseria = fs.readFileSync('scratch/debug_tacoseria-cta.html', 'utf8');

console.log("Mesopotamia: contains 'initialStoreContent'?", mesopotamia.includes('initialStoreContent'));
console.log("Tacoseria: contains 'initialStoreContent'?", tacoseria.includes('initialStoreContent'));

// Let's count how many times self.__next_f.push appears in each file
const countM = (mesopotamia.match(/self\.__next_f\.push/g) || []).length;
const countT = (tacoseria.match(/self\.__next_f\.push/g) || []).length;
console.log("Mesopotamia: next_f.push count:", countM);
console.log("Tacoseria: next_f.push count:", countT);

// Let's search where "initialStoreContent" occurs or if there is another keyword like "StorePage" or similar
if (mesopotamia.includes('initialStoreContent')) {
  console.log("Mesopotamia initialStoreContent index:", mesopotamia.indexOf('initialStoreContent'));
}
