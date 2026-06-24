import fs from 'fs';
import vm from 'vm';

const code = fs.readFileSync('scratch/script_86.js', 'utf8');

const sandbox = {
  self: {},
  window: {}
};

vm.createContext(sandbox);

try {
  vm.runInContext(code, sandbox);
  console.log("Script executed successfully!");
} catch (e) {
  console.error("Execution failed:", e.stack);
}
