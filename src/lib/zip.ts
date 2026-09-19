const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { time: number; date: number } {
  const time =
    (date.getSeconds() >> 1) | (date.getMinutes() << 5) | (date.getHours() << 11);
  const d =
    date.getDate() | ((date.getMonth() + 1) << 5) | ((date.getFullYear() - 1980) << 9);
  return { time, date: d };
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  return b;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  b[2] = (n >>> 16) & 0xff;
  b[3] = (n >>> 24) & 0xff;
  return b;
}

export function safeZipPath(name: string): string {
  return name
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replaceAll(/\.\.\//g, "")
    .replaceAll(/^\.\//g, "");
}

export async function zipBlobs(
  entries: { path: string; blob: Blob }[],
): Promise<Blob> {
  const now = dosDateTime(new Date());
  const chunks: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const path = safeZipPath(entry.path) || "image.png";
    const name = new TextEncoder().encode(path);
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    const crc = crc32(data);
    const local = [
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(now.time),
      u16(now.date),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ];
    const localSize = 30 + name.length + data.length;
    for (const part of local) chunks.push(part);

    const central = [
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(now.time),
      u16(now.date),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ];
    centrals.push(...central);
    offset += localSize;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const part of centrals) {
    chunks.push(part);
    centralSize += part.length;
  }

  chunks.push(
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralSize),
    u32(centralStart),
    u16(0),
  );

  return new Blob(chunks as BlobPart[], { type: "application/zip" });
}
