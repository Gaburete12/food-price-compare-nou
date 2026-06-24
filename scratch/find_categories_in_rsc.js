import fs from 'fs';

const rscData = JSON.parse(fs.readFileSync('scratch/rsc_decoded.json', 'utf8'));

// We want to print some sample structures that contain products or lists of products.
// Let's traverse the object and print keys of any object containing "section" or "category" or "title".
const paths = [];

function findPath(obj, currentPath = '') {
  if (!obj || typeof obj !== 'object') return;
  
  if (obj.name && Array.isArray(obj.elements) && obj.elements.length > 0) {
    console.log(`Found section: "${obj.name}" with ${obj.elements.length} elements at path: ${currentPath}`);
    // Check if the elements look like products
    const elSample = obj.elements[0];
    console.log('  Element keys:', Object.keys(elSample));
    if (elSample.name && elSample.price !== undefined) {
      console.log(`  This is a product section! First element name: ${elSample.name}`);
    }
  }
  
  for (const k of Object.keys(obj)) {
    findPath(obj[k], `${currentPath}.${k}`);
  }
}

findPath(rscData);
