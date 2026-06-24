import fs from 'fs';

const data = fs.readFileSync('client/src/lib/data.ts', 'utf8');
const index = data.indexOf('id: "kfc-constanta"');
if (index !== -1) {
  console.log(data.slice(index - 100, index + 1000));
} else {
  console.log('Not found');
}
