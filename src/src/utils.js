const { Readable } = require('stream');
const { createGunzip } = require('zlib');

// ── Protobuf varint / wire decoder ─────────────────────────────────────────

function readVarint(buf, offset) {
  let result = 0n, shift = 0n;
  while (true) {
    const b = buf[offset++];
    result |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7n;
  }
  return { value: result, offset };
}

function readFloat32LE(buf, at) {
  const dv = new DataView(buf.buffer, buf.byteOffset + at, 4);
  return dv.getFloat32(0, true);
}

function readMessage(buf, start, end) {
  const obj = {};
  let i = start;
  while (i < end) {
    const { value: tag, offset: o1 } = readVarint(buf, i); i = o1;
    const fieldNum = Number(tag >> 3n);
    const wireType = Number(tag & 7n);
    if (wireType === 0) {
      const { value, offset: o2 } = readVarint(buf, i); i = o2;
      (obj[fieldNum] = obj[fieldNum] || []).push(value);
    } else if (wireType === 1) {
      i += 8;
    } else if (wireType === 2) {
      const { value: len, offset: o2 } = readVarint(buf, i); i = o2;
      const end2 = i + Number(len);
      (obj[fieldNum] = obj[fieldNum] || []).push(buf.slice(i, end2)); i = end2;
    } else if (wireType === 5) {
      (obj[fieldNum] = obj[fieldNum] || []).push(readFloat32LE(buf, i)); i += 4;
    } else break;
  }
  return obj;
}

const td = new TextDecoder('utf-8', { fatal: false });
const dec = (b) => (b instanceof Uint8Array ? td.decode(b) : '');

// ── ZIP / GTFS helpers ──────────────────────────────────────────────────────

/**
 * Minimal ZIP reader — extracts named files from a Buffer.
 * Handles uncompressed (method=0) and DEFLATE (method=8).
 */
function readZip(buf) {
  const files = {};
  let i = 0;
  while (i < buf.length - 4) {
    if (buf.readUInt32LE(i) !== 0x04034b50) { i++; continue; }
    const method      = buf.readUInt16LE(i + 8);
    const compSize    = buf.readUInt32LE(i + 18);
    const uncompSize  = buf.readUInt32LE(i + 22);
    const nameLen     = buf.readUInt16LE(i + 26);
    const extraLen    = buf.readUInt16LE(i + 28);
    const name        = buf.slice(i + 30, i + 30 + nameLen).toString('utf8');
    const dataStart   = i + 30 + nameLen + extraLen;
    const data        = buf.slice(dataStart, dataStart + compSize);
    if (method === 0) {
      files[name] = data;
    } else if (method === 8) {
      try {
        const zlib = require('zlib');
        files[name] = zlib.inflateRawSync(data, { maxOutputLength: 50 * 1024 * 1024 });
      } catch { /* skip unreadable file */ }
    }
    i = dataStart + compSize;
  }
  return files;
}

/**
 * Parse a CSV-style GTFS text file (UTF-8) into array of objects.
 */
function parseCSV(text) {
  const lines = text.toString('utf8').replace(/\r/g, '').split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim(); });
    return obj;
  });
}

module.exports = { readVarint, readMessage, dec, readZip, parseCSV };