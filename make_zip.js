const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function createZip(sourceDir, outputFile) {
  const fileEntries = [];

  // Files/folders to exclude from game build
  const excludeList = new Set([
    'README.md',
    'serve.js',
    'package.json',
    'package-lock.json',
    '.git',
    '.gitignore',
    '.DS_Store'
  ]);

  function collectFiles(currentDir, relativePath = '') {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      if (excludeList.has(item)) continue;
      if (item.startsWith('test_') || item.startsWith('.')) continue;

      const fullPath = path.join(currentDir, item);
      const rel = relativePath ? `${relativePath}/${item}` : item;
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        collectFiles(fullPath, rel);
      } else {
        fileEntries.push({ fullPath, zipPath: rel.replace(/\\/g, '/') });
      }
    }
  }

  collectFiles(sourceDir);

  const localHeaders = [];
  const centralHeaders = [];
  let currentOffset = 0;

  for (const entry of fileEntries) {
    const rawData = fs.readFileSync(entry.fullPath);
    const uncompressedSize = rawData.length;
    const crc = crc32(rawData);

    // Deflate compression
    const compressedData = zlib.deflateRawSync(rawData, { level: 6 });
    const useCompression = compressedData.length < uncompressedSize;
    const finalData = useCompression ? compressedData : rawData;
    const compressionMethod = useCompression ? 8 : 0;
    const compressedSize = finalData.length;

    const nameBuf = Buffer.from(entry.zipPath, 'utf8');

    // Local Header (30 bytes + name)
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4);         // version needed (2.0)
    localHeader.writeUInt16LE(0, 6);          // general purpose bit flag
    localHeader.writeUInt16LE(compressionMethod, 8); // compression method
    localHeader.writeUInt16LE(0x5248, 10);    // mod time (dummy 10:18:16)
    localHeader.writeUInt16LE(0x5d5a, 12);    // mod date (dummy 2026-10-26)
    localHeader.writeUInt32LE(crc, 14);       // crc32
    localHeader.writeUInt32LE(compressedSize, 18);   // compressed size
    localHeader.writeUInt32LE(uncompressedSize, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26);   // file name length
    localHeader.writeUInt16LE(0, 28);         // extra field length
    nameBuf.copy(localHeader, 30);

    localHeaders.push(localHeader);
    localHeaders.push(finalData);

    // Central Directory Header (46 bytes + name)
    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(0x0314, 4);     // version made by (UNIX 2.0)
    centralHeader.writeUInt16LE(20, 6);         // version needed (2.0)
    centralHeader.writeUInt16LE(0, 8);          // bit flag
    centralHeader.writeUInt16LE(compressionMethod, 10);
    centralHeader.writeUInt16LE(0x5248, 12);
    centralHeader.writeUInt16LE(0x5d5a, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);         // extra field length
    centralHeader.writeUInt16LE(0, 32);         // file comment length
    centralHeader.writeUInt16LE(0, 34);         // disk number start
    centralHeader.writeUInt16LE(0, 36);         // internal file attributes
    centralHeader.writeUInt32LE((0x81A40000) >>> 0, 38); // external attributes (UNIX -rw-r--r--)
    centralHeader.writeUInt32LE(currentOffset, 42);   // relative offset of local header
    nameBuf.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);

    currentOffset += localHeader.length + finalData.length;
  }

  const centralDirOffset = currentOffset;
  const centralDirSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);

  // End of Central Directory Record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4);          // disk number
  eocd.writeUInt16LE(0, 6);          // disk where central dir starts
  eocd.writeUInt16LE(fileEntries.length, 8);  // entries on this disk
  eocd.writeUInt16LE(fileEntries.length, 10); // total entries
  eocd.writeUInt32LE(centralDirSize, 12);     // size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16);   // offset of central directory
  eocd.writeUInt16LE(0, 20);         // comment length

  const allBuffers = [...localHeaders, ...centralHeaders, eocd];
  const finalZip = Buffer.concat(allBuffers);

  fs.writeFileSync(outputFile, finalZip);
  console.log(`Successfully created standard POSIX ZIP: ${outputFile} (${finalZip.length} bytes, ${fileEntries.length} files)`);
}

module.exports = { createZip };

if (require.main === module) {
  const src = process.argv[2] || 'C:/REA/atomic-bomber';
  const out = process.argv[3] || 'C:/REA/itch-upload/atomic-bomber-itch.zip';
  createZip(src, out);
}
