/**
 * Patch Expo for Node v24+ on Windows.
 *
 * Issue: Metro config loader uses `import(absolutePath)` which fails on Windows
 * because `E:\...` is not a valid URL scheme. Needs `pathToFileURL()`.
 */

const fs = require('fs');
const path = require('path');

const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeVersion < 24) {
  process.exit(0);
}

const nmDir = path.join(__dirname, '..', 'node_modules');

// Patch Metro config loader — Windows path → file:// URL
const metroConfigPaths = [
  path.join(nmDir, '@expo', 'metro', 'node_modules', 'metro-config', 'src', 'loadConfig.js'),
  path.join(nmDir, 'metro-config', 'src', 'loadConfig.js'),
];

let patched = false;
for (const configPath of metroConfigPaths) {
  if (!fs.existsSync(configPath)) continue;

  let content = fs.readFileSync(configPath, 'utf8');
  const needle = 'const configModule = await import(absolutePath)';
  if (content.includes(needle) && !content.includes('pathToFileURL')) {
    content = content.replace(
      needle,
      'const { pathToFileURL } = require("url"); const configModule = await import(pathToFileURL(absolutePath).href)'
    );
    fs.writeFileSync(configPath, content);
    console.log(`  Patched: ${path.relative(nmDir, configPath)}`);
    patched = true;
  }
}

if (patched) {
  console.log('  Node v24 Windows patches applied.');
} else {
  console.log('  No patches needed.');
}
