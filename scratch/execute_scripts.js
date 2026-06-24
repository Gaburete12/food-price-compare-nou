import fs from 'fs';
import vm from 'vm';

async function main() {
  const html = fs.readFileSync('scratch/glovo_test.html', 'utf8');
  const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);

  const chunks = [];
  const selfObj = {
    __next_f: {
      push: function(args) {
        chunks.push(args);
      }
    }
  };

  const context = vm.createContext({ self: selfObj, console });

  for (const code of scriptMatches) {
    if (code.includes('__next_f.push')) {
      try {
        vm.runInContext(code, context);
      } catch (e) {
        // Some script tags might have reference errors for other things, which is fine
      }
    }
  }

  console.log("Collected", chunks.length, "chunks from next_f.push");
  fs.writeFileSync('scratch/chunks.json', JSON.stringify(chunks, null, 2));
}

main().catch(console.error);
