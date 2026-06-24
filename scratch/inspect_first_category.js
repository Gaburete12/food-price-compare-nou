import fs from 'fs';

const rscData = JSON.parse(fs.readFileSync('scratch/rsc_decoded.json', 'utf8'));

// Let's find the elements array directly
let menuData = null;
function findMenuData(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (obj.initialStoreMenu && obj.initialStoreMenu.data) {
    menuData = obj.initialStoreMenu.data;
    return;
  }
  for (const k of Object.keys(obj)) {
    findMenuData(obj[k]);
  }
}
findMenuData(rscData);

if (menuData) {
  console.log("Found menu data! Keys:", Object.keys(menuData));
  console.log("Number of elements:", menuData.elements.length);
  const first = menuData.elements[0];
  console.log("First element keys:", Object.keys(first));
  console.log("First element name:", first.name);
  console.log("First element sub-elements count:", first.elements.length);
  if (first.elements.length > 0) {
    console.log("Sub-element sample:", JSON.stringify(first.elements[0], null, 2));
  }
} else {
  console.log("Could not find initialStoreMenu");
}
