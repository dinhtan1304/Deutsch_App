import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

let raw = 0;
let compressed = 0;
function measure(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filename = join(directory, entry.name);
    if (entry.isDirectory()) measure(filename);
    else if (/\.(js|css)$/.test(filename)) {
      const content = readFileSync(filename);
      raw += content.length;
      compressed += gzipSync(content).length;
    }
  }
}
measure('.next/static');
console.log(`All route JS/CSS: ${Math.ceil(raw / 1024)} KiB raw, ${Math.ceil(compressed / 1024)} KiB gzip`);
// Compare transferable application code, excluding font binaries and build
// metadata. This is a total code-growth budget across all lazy-loaded routes.
if (compressed > 2 * 1024 * 1024) {
  console.error('Application JS/CSS exceeds the 2 MiB gzip budget');
  process.exitCode = 1;
}
