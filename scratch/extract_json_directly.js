import fs from 'fs';

const code = fs.readFileSync('scratch/script_86.js', 'utf8');

// Find the index of the first '[' that starts the array pushed
const startArray = code.indexOf('[');
const endArray = code.lastIndexOf(']');

if (startArray !== -1 && endArray !== -1) {
  const inner = code.slice(startArray, endArray + 1);
  // We want to extract the object in self.__next_s.push([0, { ... }])
  // Let's find the first { and last }
  const startObj = inner.indexOf('{');
  const endObj = inner.lastIndexOf('}');
  if (startObj !== -1 && endObj !== -1) {
    const objStr = inner.slice(startObj, endObj + 1);
    try {
      // Clean up JavaScript specific things if any (like undefined, functions)
      // Since it's Next.js hydration state, it's usually valid JSON except for some undefined or similar
      const data = JSON.parse(objStr);
      console.log("Successfully extracted and parsed JSON!");
      fs.writeFileSync('scratch/menu_extracted.json', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Failed to parse extracted JSON:", e.message);
      // Let's try to extract specific product structures via regex
      // Product objects look like: { name: "...", price: ... }
      // Let's write a script to find products inside the raw string!
    }
  }
}
