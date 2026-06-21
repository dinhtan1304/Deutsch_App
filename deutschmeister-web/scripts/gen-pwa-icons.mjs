import sharp from 'sharp';

const src = 'public/logo.png';
const bg = { r: 10, g: 12, b: 17, alpha: 1 }; // #0A0C11

await sharp(src).resize(192, 192, { fit: 'contain', background: bg }).png().toFile('public/icon-192.png');
await sharp(src).resize(512, 512, { fit: 'contain', background: bg }).png().toFile('public/icon-512.png');

// Maskable: logo at ~72% inside the safe zone on a solid brand-dark background.
const inner = Math.round(512 * 0.72);
const logo = await sharp(src)
  .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: bg } })
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toFile('public/icon-512-maskable.png');

console.log('PWA icons written');
