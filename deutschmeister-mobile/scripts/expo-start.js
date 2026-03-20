const { execSync } = require('child_process');

// Ensure expo-modules-core is patched for Node v24+
require('./patch-expo-node24');

const args = process.argv.slice(2).join(' ');
const cmd = `npx expo start ${args}`.trim();

try {
  execSync(cmd, { stdio: 'inherit', env: process.env });
} catch {
  process.exit(1);
}
