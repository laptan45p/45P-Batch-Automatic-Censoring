import type { Box } from "./nms";

export type MosaicStyle = "pixel" | "blur";
export type MosaicShape = "rect" | "ellipse";

function clipBox(box: Box, w: number, h: number): Box {
  const x = Math.max(0, Math.floor(box.x));
  const y = Math.max(0, Math.floor(box.y));
  const bw = Math.max(1, Math.min(w - x, Math.ceil(box.w)));
  const bh = Math.max(1, Math.min(h - y, Math.ceil(box.h)));
  return { x, y, w: bw, h: bh };
}

function pixelateRegion(
  ctx: CanvasRenderingContext2D,
  box: Box,
  blockSize: number,
): void {
  const { x, y, w, h } = box;
  const blocksX = Math.max(1, Math.round(w / blockSize));
  const blocksY = Math.max(1, Math.round(h / blockSize));
  const tmp = document.createElement("canvas");
  tmp.width = blocksX;
  tmp.height = blocksY;
  const tctx = tmp.getContext("2d");
  if (!tctx) return;
  tctx.imageSmoothingEnabled = true;
  tctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, blocksX, blocksY);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, blocksX, blocksY, x, y, w, h);
  ctx.imageSmoothingEnabled = true;
}

function blurRegion(ctx: CanvasRenderingContext2D, box: Box, radius: number): void {
  const { x, y, w, h } = box;
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext("2d");
  if (!tctx) return;
  tctx.filter = `blur(${Math.max(2, radius)}px)`;
  tctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h);
  ctx.drawImage(tmp, x, y);
}

export function applyMosaic(
  ctx: CanvasRenderingContext2D,
  box: Box,
  options: { style: MosaicStyle; shape: MosaicShape; blockSize: number },
): void {
  const canvas = ctx.canvas;
  const region = clipBox(box, canvas.width, canvas.height);
  if (region.w < 2 || region.h < 2) return;

  if (options.shape === "ellipse") {
    const snap = document.createElement("canvas");
    snap.width = canvas.width;
    snap.height = canvas.height;
    const sctx = snap.getContext("2d");
    if (!sctx) return;
    sctx.drawImage(canvas, 0, 0);
    if (options.style === "pixel") pixelateRegion(sctx, region, options.blockSize);
    else blurRegion(sctx, region, options.blockSize * 0.9);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      region.x + region.w / 2,
      region.y + region.h / 2,
      region.w / 2,
      region.h / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.clip();
    ctx.drawImage(snap, 0, 0);
    ctx.restore();
    return;
  }

  if (options.style === "pixel") pixelateRegion(ctx, region, options.blockSize);
  else blurRegion(ctx, region, options.blockSize * 0.9);
}

export function drawDebugBox(
  ctx: CanvasRenderingContext2D,
  box: Box,
  label: string,
  score: number,
): void {
  const { x, y, w, h } = clipBox(box, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.strokeStyle = "rgba(110, 231, 197, 0.9)";
  ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.015));
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  const text = `${label}  ${(score * 100).toFixed(0)}%`;
  ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
  const padX = 6;
  const padY = 4;
  const metrics = ctx.measureText(text);
  const tw = metrics.width + padX * 2;
  const th = 20;
  const ty = y - th < 0 ? y : y - th;
  ctx.fillStyle = "rgba(11, 12, 14, 0.86)";
  ctx.fillRect(x, ty, tw, th);
  ctx.fillStyle = "#6ee7c5";
  ctx.fillText(text, x + padX, ty + th - padY - 2);
  ctx.restore();
}
