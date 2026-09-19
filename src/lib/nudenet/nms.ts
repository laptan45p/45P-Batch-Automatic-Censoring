export type Box = { x: number; y: number; w: number; h: number };

function iou(a: Box, b: Box): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union <= 0 ? 0 : inter / union;
}

/** OpenCV-style NMSBoxes: score_threshold then IoU suppression. */
export function nmsBoxes(
  boxes: Box[],
  scores: number[],
  scoreThreshold: number,
  iouThreshold: number,
): number[] {
  const order = scores
    .map((score, index) => ({ score, index }))
    .filter((item) => item.score >= scoreThreshold)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.index);

  const keep: number[] = [];
  const dead = new Set<number>();

  for (const i of order) {
    if (dead.has(i)) continue;
    keep.push(i);
    const box = boxes[i];
    if (!box) continue;
    for (const j of order) {
      if (j === i || dead.has(j)) continue;
      const other = boxes[j];
      if (other && iou(box, other) > iouThreshold) dead.add(j);
    }
  }

  return keep;
}

export function expandBox(box: Box, scale: number, imgW: number, imgH: number): Box {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const nw = box.w * scale;
  const nh = box.h * scale;
  let x = cx - nw / 2;
  let y = cy - nh / 2;
  let w = nw;
  let h = nh;
  if (x < 0) {
    w += x;
    x = 0;
  }
  if (y < 0) {
    h += y;
    y = 0;
  }
  if (x + w > imgW) w = imgW - x;
  if (y + h > imgH) h = imgH - y;
  return { x, y, w: Math.max(1, w), h: Math.max(1, h) };
}
