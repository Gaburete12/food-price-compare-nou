import fs from 'fs';

const data = fs.readFileSync('client/src/lib/data.ts', 'utf8');

// Let's find restaurant IDs. They are inside RESTAURANTS = [ { id: "..." } ]
// We can find them by looking for id: "..." that are not indented inside menu arrays.
// Or we can just print the lines containing id: "..." that don't start with many spaces.
const lines = data.split('\n');
for (const line of lines) {
  if (line.includes('id:') && (line.startsWith('    id:') || line.startsWith('  {') || line.startsWith('    { id:'))) {
    console.log(line.trim());
  }
}
