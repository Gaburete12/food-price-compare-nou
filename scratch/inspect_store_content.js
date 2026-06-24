import fs from 'fs';

const rscData = JSON.parse(fs.readFileSync('scratch/rsc_decoded.json', 'utf8'));

let storeContent = null;
function findStoreContent(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (obj.initialStoreContent && obj.initialStoreContent.data) {
    storeContent = obj.initialStoreContent.data;
    return;
  }
  for (const k of Object.keys(obj)) {
    findStoreContent(obj[k]);
  }
}
findStoreContent(rscData);

if (storeContent) {
  const listElement = storeContent.body[0];
  const firstProduct = listElement.data.elements[0];
  console.log("Product keys:", Object.keys(firstProduct.data));
  console.log("Product data:", JSON.stringify(firstProduct.data, (k, v) => k === 'attributeGroups' ? undefined : v, 2));
}
