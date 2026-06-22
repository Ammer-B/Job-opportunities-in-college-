import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[i] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([lenBuf, t, data, crcBuf]);
}

function solidColorPNG(size, bgR, bgG, bgB, accentR, accentG, accentB) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB color type

  // Build image: dark background with a centered amber circle
  const raw = [];
  const cx = size / 2, cy = size / 2, radius = size * 0.4;
  for (let y = 0; y < size; y++) {
    raw.push(0); // filter byte: None
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Rounded square shape: amber if inside, dark if outside
      const inShape = Math.abs(dx) < radius * 0.85 && Math.abs(dy) < radius * 0.85;
      if (inShape) {
        raw.push(accentR, accentG, accentB);
      } else {
        raw.push(bgR, bgG, bgB);
      }
    }
  }

  const compressed = deflateSync(Buffer.from(raw));
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });

// slate-950 bg (#0f172a) + amber-500 accent (#f59e0b)
const [bgR, bgG, bgB]       = [15, 23, 42];
const [acR, acG, acB]       = [245, 158, 11];

writeFileSync('public/icons/icon-192.png',         solidColorPNG(192, bgR,bgG,bgB, acR,acG,acB));
writeFileSync('public/icons/icon-512.png',         solidColorPNG(512, bgR,bgG,bgB, acR,acG,acB));
writeFileSync('public/icons/apple-touch-icon.png', solidColorPNG(180, bgR,bgG,bgB, acR,acG,acB));

console.log('Icons created in public/icons/');
