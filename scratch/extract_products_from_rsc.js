import fs from 'fs';

const code = fs.readFileSync('scratch/script_86.js', 'utf8');

// Match self.__next_f.push(...) arguments
const match = code.match(/self\.__next_f\.push\(([\s\S]*)\)/);
if (match) {
  const argsText = match[1].trim();
  try {
    const args = JSON.parse(argsText);
    const rscString = args[1];
    
    // The rscString has a prefix like "1d:" or similar, let's strip it
    const colonIndex = rscString.indexOf(':');
    const rscJsonText = rscString.slice(colonIndex + 1);
    
    // Now rscJsonText is a JSON string representing the React element tree
    const rscData = JSON.parse(rscJsonText);
    
    // Let's write the parsed RSC tree to a file
    fs.writeFileSync('scratch/rsc_decoded.json', JSON.stringify(rscData, null, 2));
    console.log("Decoded RSC payload saved to scratch/rsc_decoded.json");
    
    // Let's recursively search for products and categories in rscData
    const products = [];
    const categories = [];
    
    function traverse(obj) {
      if (!obj || typeof obj !== 'object') return;
      
      // If it looks like a product card / element
      if (obj.name && obj.price !== undefined && obj.price > 0) {
        products.push({
          name: obj.name,
          description: obj.description || '',
          price: obj.price,
          imageUrl: obj.imageUrl || obj.image || '',
          category: obj.categoryName || ''
        });
      }
      
      // If it looks like a section / category
      if (obj.name && Array.isArray(obj.products)) {
        categories.push({
          name: obj.name,
          productsCount: obj.products.length
        });
        obj.products.forEach(p => {
          products.push({
            name: p.name,
            description: p.description || '',
            price: p.price,
            imageUrl: p.imageUrl || p.image || '',
            category: obj.name
          });
        });
      }
      
      for (const k of Object.keys(obj)) {
        traverse(obj[k]);
      }
    }
    
    traverse(rscData);
    
    console.log("Extracted categories:", categories);
    console.log("Extracted products count:", products.length);
    if (products.length > 0) {
      console.log("Sample products:", products.slice(0, 5));
      fs.writeFileSync('scratch/extracted_products.json', JSON.stringify(products, null, 2));
    }
  } catch (e) {
    console.error("Failed to parse RSC:", e.message);
  }
} else {
  console.log("No self.__next_f.push match");
}
