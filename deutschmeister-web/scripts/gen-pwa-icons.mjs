import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const src = 'public/logo.png';
const bg = { r: 10, g: 12, b: 17, alpha: 1 }; // #0A0C11
const small = { compressionLevel: 9, palette: true };

await sharp(src).resize(192, 192, { fit: 'contain', background: bg }).png(small).toFile('public/icon-192.png');
await sharp(src).resize(512, 512, { fit: 'contain', background: bg }).png(small).toFile('public/icon-512.png');

// Favicon: one 48px PNG in an ICO container, which sharp cannot write itself.
const faviconSize = 48;
const faviconPng = await sharp(src)
  .resize(faviconSize, faviconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toBuffer();
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(1, 2); // type: icon
icoHeader.writeUInt16LE(1, 4); // one image
icoHeader[6] = faviconSize;
icoHeader[7] = faviconSize;
icoHeader.writeUInt16LE(1, 10); // colour planes
icoHeader.writeUInt16LE(32, 12); // bits per pixel
icoHeader.writeUInt32LE(faviconPng.length, 14);
icoHeader.writeUInt32LE(icoHeader.length, 18); // image data offset
await writeFile('src/app/favicon.ico', Buffer.concat([icoHeader, faviconPng]));

// Maskable: logo at ~72% inside the safe zone on a solid brand-dark background.
const inner = Math.round(512 * 0.72);
const logo = await sharp(src)
  .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: bg } })
  .composite([{ input: logo, gravity: 'center' }])
  .png(small)
  .toFile('public/icon-512-maskable.png');

console.log('PWA icons written');
