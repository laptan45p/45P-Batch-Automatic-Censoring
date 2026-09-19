const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp)$/i;
const MAX_FILES = 200;

export function isImageFile(file: File): boolean {
  if (file.name.startsWith(".") || file.name.startsWith("._")) return false;
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXT.test(file.name);
}

export function fileKey(file: File): string {
  return `${file.webkitRelativePath || file.name}:${file.size}:${file.lastModified}`;
}

export function mosaicZipPath(relPath: string): string {
  const parts = relPath.replaceAll("\\", "/").split("/").filter(Boolean);
  const base = parts.pop() ?? "image.png";
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  parts.push(`${stem}_mosaic.png`);
  return parts.join("/");
}

export function filterImages(files: File[]): File[] {
  return files.filter(isImageFile);
}

export function capFiles(files: File[], existing = 0): { files: File[]; truncated: boolean } {
  const room = Math.max(0, MAX_FILES - existing);
  return { files: files.slice(0, room), truncated: files.length > room };
}

export { MAX_FILES };

async function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const all: FileSystemEntry[] = [];
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (!batch.length) return all;
    all.push(...batch);
  }
}

async function walkEntry(entry: FileSystemEntry, out: File[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    out.push(file);
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await readAllEntries(reader);
    for (const child of children) await walkEntry(child, out);
  }
}

export async function collectFromDataTransfer(dt: DataTransfer): Promise<File[]> {
  const items = [...dt.items];
  const files: File[] = [];
  let walked = false;
  for (const item of items) {
    const entry = item.webkitGetAsEntry?.();
    if (!entry) continue;
    walked = true;
    await walkEntry(entry, files);
  }
  if (walked && files.length) return files;
  return [...dt.files];
}
