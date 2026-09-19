import {
  MODELS,
  partFromRaw,
  type DetectorMode,
  type PartId,
} from "./labels";
import { expandBox, nmsBoxes, type Box } from "./nms";
import { applyMosaic, drawDebugBox, type MosaicShape, type MosaicStyle } from "./mosaic";
import type { InferenceSession, Tensor } from "onnxruntime-web";

export type Detection = {
  part: PartId;
  raw: string;
  score: number;
  box: Box;
};

export type CensorOptions = {
  mode: DetectorMode;
  parts: PartId[];
  scoreThreshold: number;
  expand: number;
  blockSize: number;
  style: MosaicStyle;
  shape: MosaicShape;
  showBoxes: boolean;
};

export type CensorResult = {
  detections: Detection[];
  mosaicked: Detection[];
  outputUrl: string;
  blob: Blob;
  width: number;
  height: number;
};

const MAX_SIDE = 4096;
const SCORE_FLOOR = 0.12;

type OrtModule = typeof import("onnxruntime-web");

let ortPromise: Promise<OrtModule> | null = null;
const sessions = new Map<DetectorMode, Promise<InferenceSession>>();

function formatOrtError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("no available backend") || msg.includes("Failed to fetch")) {
    return "検出エンジンを起動できませんでした。ページを再読み込みしてください。";
  }
  return msg;
}

function loadOrt(): Promise<OrtModule> {
  if (!ortPromise) {
    ortPromise = import("onnxruntime-web").then((ort) => {
      ort.env.wasm.wasmPaths =
        "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.1/dist/";
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = true;
      ort.env.wasm.proxy = false;
      return ort;
    });
  }
  return ortPromise;
}

async function fetchBuffer(
  url: string,
  onProgress?: (ratio: number) => void,
): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`モデルの読み込みに失敗しました (${res.status})`);
  const total = Number(res.headers.get("content-length") ?? 0);
  if (!res.body || !total) {
    const buf = await res.arrayBuffer();
    onProgress?.(1);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      onProgress?.(Math.min(1, received / total));
    }
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  onProgress?.(1);
  return out.buffer;
}

export async function warmupDetector(
  mode: DetectorMode,
  onProgress?: (ratio: number) => void,
): Promise<void> {
  await getSession(mode, onProgress);
}

async function getSession(
  mode: DetectorMode,
  onProgress?: (ratio: number) => void,
): Promise<InferenceSession> {
  let pending = sessions.get(mode);
  if (!pending) {
    pending = (async () => {
      const ort = await loadOrt();
      onProgress?.(0.05);
      const buffer = await fetchBuffer(MODELS[mode].url, (ratio) => {
        onProgress?.(0.05 + ratio * 0.85);
      });
      const session = await ort.InferenceSession.create(buffer, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });
      onProgress?.(1);
      return session;
    })().catch((err) => {
      sessions.delete(mode);
      throw new Error(formatOrtError(err));
    });
    sessions.set(mode, pending);
  }
  return pending;
}

function toNchw(canvas: HTMLCanvasElement): Float32Array {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("キャンバスを初期化できませんでした");
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const plane = width * height;
  const tensor = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    const o = i * 4;
    tensor[i] = data[o]! / 255;
    tensor[plane + i] = data[o + 1]! / 255;
    tensor[2 * plane + i] = data[o + 2]! / 255;
  }
  return tensor;
}

/** NudeNet: pad to square (bottom/right), then resize. */
function letterbox(source: CanvasImageSource, srcW: number, srcH: number, size: number) {
  const maxSize = Math.max(srcW, srcH);
  const xPad = maxSize - srcW;
  const yPad = maxSize - srcH;
  const square = document.createElement("canvas");
  square.width = maxSize;
  square.height = maxSize;
  const sctx = square.getContext("2d", { willReadFrequently: true });
  if (!sctx) throw new Error("キャンバスを初期化できませんでした");
  sctx.fillStyle = "#000000";
  sctx.fillRect(0, 0, maxSize, maxSize);
  sctx.drawImage(source, 0, 0);
  const input = document.createElement("canvas");
  input.width = size;
  input.height = size;
  const ictx = input.getContext("2d", { willReadFrequently: true });
  if (!ictx) throw new Error("キャンバスを初期化できませんでした");
  ictx.drawImage(square, 0, 0, size, size);
  return { tensor: toNchw(input), xPad, yPad, width: srcW, height: srcH, size };
}

/** imgutils anime YOLO: stretch to square. */
function stretch(source: CanvasImageSource, srcW: number, srcH: number, size: number) {
  const input = document.createElement("canvas");
  input.width = size;
  input.height = size;
  const ictx = input.getContext("2d", { willReadFrequently: true });
  if (!ictx) throw new Error("キャンバスを初期化できませんでした");
  ictx.drawImage(source, 0, 0, size, size);
  return { tensor: toNchw(input), xPad: 0, yPad: 0, width: srcW, height: srcH, size };
}

function postprocess(
  data: Float32Array,
  dims: readonly number[],
  mode: DetectorMode,
  xPad: number,
  yPad: number,
  width: number,
  height: number,
  modelSize: number,
  scoreThreshold: number,
): Detection[] {
  const spec = MODELS[mode];
  const squeezed = dims[0] === 1 ? dims.slice(1) : [...dims];
  const classCount = spec.labels.length;
  let numBoxes: number;
  let stride: number;
  let layout: "cn" | "nc";

  if (squeezed.length === 2 && squeezed[0] === 4 + classCount) {
    stride = squeezed[1]!;
    numBoxes = stride;
    layout = "cn";
  } else if (squeezed.length === 2 && squeezed[1] === 4 + classCount) {
    numBoxes = squeezed[0]!;
    stride = squeezed[1]!;
    layout = "nc";
  } else {
    throw new Error(`想定外の出力形状: [${dims.join(", ")}]`);
  }

  const boxes: Box[] = [];
  const scores: number[] = [];
  const classIds: number[] = [];
  const floor = Math.min(SCORE_FLOOR, scoreThreshold);
  const scaleX = (width + xPad) / modelSize;
  const scaleY = (height + yPad) / modelSize;

  for (let i = 0; i < numBoxes; i++) {
    let cx: number, cy: number, bw: number, bh: number;
    let best = 0;
    let classId = 0;
    if (layout === "cn") {
      cx = data[0 * numBoxes + i]!;
      cy = data[1 * numBoxes + i]!;
      bw = data[2 * numBoxes + i]!;
      bh = data[3 * numBoxes + i]!;
      for (let c = 0; c < classCount; c++) {
        const s = data[(4 + c) * numBoxes + i]!;
        if (s > best) {
          best = s;
          classId = c;
        }
      }
    } else {
      const base = i * stride;
      cx = data[base]!;
      cy = data[base + 1]!;
      bw = data[base + 2]!;
      bh = data[base + 3]!;
      for (let c = 0; c < classCount; c++) {
        const s = data[base + 4 + c]!;
        if (s > best) {
          best = s;
          classId = c;
        }
      }
    }

    if (best < floor) continue;

    let x = (cx - bw / 2) * scaleX;
    let y = (cy - bh / 2) * scaleY;
    let w = bw * scaleX;
    let h = bh * scaleY;
    x = Math.max(0, Math.min(x, width));
    y = Math.max(0, Math.min(y, height));
    w = Math.min(w, width - x);
    h = Math.min(h, height - y);
    if (w < 1 || h < 1) continue;

    boxes.push({ x, y, w, h });
    scores.push(best);
    classIds.push(classId);
  }

  const keep = nmsBoxes(boxes, scores, scoreThreshold, spec.nmsIou);
  const detections: Detection[] = [];
  for (const i of keep) {
    const raw = spec.labels[classIds[i]!]!;
    const part = partFromRaw(mode, raw);
    if (!part) continue;
    detections.push({
      part,
      raw,
      score: scores[i]!,
      box: boxes[i]!,
    });
  }
  detections.sort((a, b) => b.score - a.score);
  return detections;
}

export async function loadImageFile(file: File): Promise<ImageBitmap> {
  const bitmap = await createImageBitmap(file);
  const long = Math.max(bitmap.width, bitmap.height);
  if (long <= MAX_SIDE) return bitmap;
  const scale = MAX_SIDE / long;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像を縮小できませんでした");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return createImageBitmap(canvas);
}

export async function detectAndCensor(
  image: ImageBitmap,
  options: CensorOptions,
  onProgress?: (ratio: number) => void,
): Promise<CensorResult> {
  const spec = MODELS[options.mode];
  const session = await getSession(options.mode, onProgress);
  const ort = await loadOrt();
  const prepared =
    options.mode === "photo"
      ? letterbox(image, image.width, image.height, spec.inputSize)
      : stretch(image, image.width, image.height, spec.inputSize);
  const inputName = session.inputNames[0] ?? "images";
  const tensor: Tensor = new ort.Tensor("float32", prepared.tensor, [
    1,
    3,
    spec.inputSize,
    spec.inputSize,
  ]);
  const outputs = await session.run({ [inputName]: tensor });
  const first = outputs[session.outputNames[0] ?? "output0"];
  if (!first) throw new Error("モデル出力が空です");
  const data = first.data;
  if (!(data instanceof Float32Array)) {
    throw new Error("モデル出力の型が不正です");
  }

  const detections = postprocess(
    data,
    first.dims,
    options.mode,
    prepared.xPad,
    prepared.yPad,
    prepared.width,
    prepared.height,
    prepared.size,
    options.scoreThreshold,
  );

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("キャンバスを初期化できませんでした");
  ctx.drawImage(image, 0, 0);

  const selected = new Set(options.parts);
  const mosaicked = detections.filter((d) => selected.has(d.part));
  for (const det of mosaicked) {
    const box = expandBox(det.box, options.expand, canvas.width, canvas.height);
    applyMosaic(ctx, box, {
      style: options.style,
      shape: options.shape,
      blockSize: options.blockSize,
    });
  }

  if (options.showBoxes) {
    for (const det of detections) {
      const box = expandBox(det.box, options.expand, canvas.width, canvas.height);
      drawDebugBox(ctx, box, det.raw, det.score);
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (out) => {
        if (!out) {
          reject(new Error("画像の書き出しに失敗しました"));
          return;
        }
        resolve(out);
      },
      "image/png",
      1,
    );
  });

  return {
    detections,
    mosaicked,
    outputUrl: URL.createObjectURL(blob),
    blob,
    width: canvas.width,
    height: canvas.height,
  };
}
