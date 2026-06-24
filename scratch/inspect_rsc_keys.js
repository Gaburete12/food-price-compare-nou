import fs from 'fs';

const rscData = JSON.parse(fs.readFileSync('scratch/rsc_decoded.json', 'utf8'));

// Let's print keys of objects that contain any array of size > 5
function inspect(obj, depth = 0, path = '') {
  if (!obj || typeof obj !== 'object' || depth > 8) return;
  
  if (Array.isArray(obj)) {
    if (obj.length > 5) {
      console.log(`Array of length ${obj.length} at path: ${path}`);
      console.log(`  Sample item keys:`, Object.keys(obj[0] || {}));
      if (obj[0] && obj[0].name) {
        console.log(`  Sample item name:`, obj[0].name);
      }
    }
    obj.forEach((item, idx) => inspect(item, depth + 1, `${path}[${idx}]`));
    return;
  }
  
  for (const k of Object.keys(obj)) {
    inspect(obj[k], depth + 1, `${path}.${k}`);
  }
}

inspect(rscData);
