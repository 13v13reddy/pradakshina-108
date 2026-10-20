// Rasterizes the app's own geometric mark. No external image dependencies.
import { deflateSync } from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';

const green = [21, 62, 53], brass = [224, 189, 127];
function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}
function chunk(type, data) {
  const tag = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([length, tag, data, crc]);
}
function ink(x, y) {
  const dx = x - 256, dy = y - 256, radius = Math.hypot(dx, dy);
  if (Math.abs(radius - 155) < 1.5 || Math.abs(radius - 43) < 1.5 || radius < 20) return true;
  const a = Math.atan2(dy, dx);
  const nearest = Math.round(a / (Math.PI * 2 / 108)) * Math.PI * 2 / 108;
  if (Math.hypot(dx - Math.cos(nearest) * 134, dy - Math.sin(nearest) * 134) < 1.4) return true;
  if ((Math.abs(dx) < 1.5 && Math.abs(dy) < 65) || (Math.abs(dy) < 1.5 && Math.abs(dx) < 65)) return true;
  if (Math.abs(dx) < 47 && Math.abs(dy) < 47 && (Math.abs(dx - dy) < 2 || Math.abs(dx + dy) < 2)) return true;
  return Math.abs(x - 256) / 8 + Math.abs(y - 87) / 12 < 1;
}
async function render(size, name) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let hits = 0;
    for (const oy of [.25, .75]) for (const ox of [.25, .75]) if (ink((x + ox) * 512 / size, (y + oy) * 512 / size)) hits++;
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    for (let c = 0; c < 3; c++) raw[offset + c] = Math.round(green[c] + (brass[c] - green[c]) * hits / 4);
    raw[offset + 3] = 255;
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  await writeFile(new URL(`../assets/${name}`, import.meta.url), Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
await mkdir(new URL('../assets/', import.meta.url), { recursive: true });
await render(180, 'apple-touch-icon.png');
await render(192, 'icon-192.png');
await render(512, 'icon-512.png');
await render(512, 'icon-maskable.png');
console.log('Generated app icons.');
