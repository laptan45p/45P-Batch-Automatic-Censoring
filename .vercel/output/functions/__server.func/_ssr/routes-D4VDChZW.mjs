import { i as __toESM } from "../_runtime.mjs";
import { c as Slot, d as require_jsx_runtime, f as require_react, n as CheckboxIndicator, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { a as ImagePlus, c as Download, i as LoaderCircle, l as Check, n as Square, o as FolderOpen, r as ShieldCheck, s as Eraser } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D4VDChZW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums", {
	variants: { variant: {
		default: "border-transparent bg-surface-2 text-fg",
		accent: "border-transparent bg-accent-soft text-accent",
		muted: "border-border text-muted"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform,background-color,color,border-color] duration-[var(--motion-quick)] ease-[var(--ease-smooth-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90",
			secondary: "bg-surface text-fg border border-border hover:bg-surface-2",
			ghost: "text-muted hover:text-fg hover:bg-surface",
			outline: "border border-border bg-transparent text-fg hover:bg-surface"
		},
		size: {
			default: "h-11 rounded-md px-4 text-sm",
			sm: "h-9 rounded-sm px-3 text-xs",
			lg: "h-12 rounded-md px-5 text-sm",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function Checkbox({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
		className: cn("peer size-5 shrink-0 rounded-xs border border-border-strong bg-surface text-accent-fg transition-colors duration-[var(--motion-quick)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:border-accent data-[state=checked]:bg-accent", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
			className: "flex items-center justify-center text-current",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
				className: "size-3.5",
				strokeWidth: 3
			})
		})
	});
}
function Progress({ value, className, ...props }) {
	const clamped = Math.max(0, Math.min(100, value));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("h-1 w-full overflow-hidden rounded-full bg-surface-2", className),
		role: "progressbar",
		"aria-valuenow": Math.round(clamped),
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-full rounded-full bg-accent transition-[width] duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)]",
			style: { width: `${clamped}%` }
		})
	});
}
function Slider({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
		className: cn("relative flex h-11 w-full touch-none select-none items-center", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
			className: "relative h-1 w-full grow overflow-hidden rounded-full bg-surface-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-accent" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full border border-border-strong bg-fg shadow-none transition-transform duration-[var(--motion-micro)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" })]
	});
}
function Switch({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
		className: cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-surface-2 transition-colors duration-[var(--motion-quick)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:bg-accent", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-fg shadow-none transition-transform duration-[var(--motion-quick)] ease-[var(--ease-smooth-out)] data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-accent-fg" })
	});
}
var IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp)$/i;
function isImageFile(file) {
	if (file.name.startsWith(".") || file.name.startsWith("._")) return false;
	if (file.type.startsWith("image/")) return true;
	return IMAGE_EXT.test(file.name);
}
function fileKey(file) {
	return `${file.webkitRelativePath || file.name}:${file.size}:${file.lastModified}`;
}
function mosaicZipPath(relPath) {
	const parts = relPath.replaceAll("\\", "/").split("/").filter(Boolean);
	const base = parts.pop() ?? "image.png";
	const dot = base.lastIndexOf(".");
	const stem = dot > 0 ? base.slice(0, dot) : base;
	parts.push(`${stem}_mosaic.png`);
	return parts.join("/");
}
function filterImages(files) {
	return files.filter(isImageFile);
}
function capFiles(files, existing = 0) {
	const room = Math.max(0, 200 - existing);
	return {
		files: files.slice(0, room),
		truncated: files.length > room
	};
}
async function readAllEntries(reader) {
	const all = [];
	for (;;) {
		const batch = await new Promise((resolve, reject) => {
			reader.readEntries(resolve, reject);
		});
		if (!batch.length) return all;
		all.push(...batch);
	}
}
async function walkEntry(entry, out) {
	if (entry.isFile) {
		const file = await new Promise((resolve, reject) => {
			entry.file(resolve, reject);
		});
		out.push(file);
		return;
	}
	if (entry.isDirectory) {
		const children = await readAllEntries(entry.createReader());
		for (const child of children) await walkEntry(child, out);
	}
}
async function collectFromDataTransfer(dt) {
	const items = [...dt.items];
	const files = [];
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
var PART_JA = {
	female: "女性器",
	male: "男性器",
	breast: "胸部",
	anus: "肛門",
	buttocks: "臀部"
};
var DEFAULT_PARTS = ["female", "male"];
var MODELS = {
	illust: {
		url: "/models/anime-censor-n.onnx",
		inputSize: 640,
		nmsIou: .7,
		labels: [
			"nipple_f",
			"penis",
			"pussy"
		],
		map: {
			pussy: "female",
			penis: "male",
			nipple_f: "breast"
		},
		extras: ["breast"]
	},
	photo: {
		url: "/models/nudenet-320n.onnx",
		inputSize: 320,
		nmsIou: .45,
		labels: [
			"FEMALE_GENITALIA_COVERED",
			"FACE_FEMALE",
			"BUTTOCKS_EXPOSED",
			"FEMALE_BREAST_EXPOSED",
			"FEMALE_GENITALIA_EXPOSED",
			"MALE_BREAST_EXPOSED",
			"ANUS_EXPOSED",
			"FEET_EXPOSED",
			"BELLY_COVERED",
			"FEET_COVERED",
			"ARMPITS_COVERED",
			"ARMPITS_EXPOSED",
			"FACE_MALE",
			"BELLY_EXPOSED",
			"MALE_GENITALIA_EXPOSED",
			"ANUS_COVERED",
			"FEMALE_BREAST_COVERED",
			"BUTTOCKS_COVERED"
		],
		map: {
			FEMALE_GENITALIA_COVERED: "female",
			FEMALE_GENITALIA_EXPOSED: "female",
			MALE_GENITALIA_EXPOSED: "male",
			FEMALE_BREAST_EXPOSED: "breast",
			ANUS_EXPOSED: "anus",
			BUTTOCKS_EXPOSED: "buttocks"
		},
		extras: [
			"breast",
			"anus",
			"buttocks"
		]
	}
};
function partFromRaw(mode, raw) {
	return MODELS[mode].map[raw] ?? null;
}
function iou(a, b) {
	const x1 = Math.max(a.x, b.x);
	const y1 = Math.max(a.y, b.y);
	const x2 = Math.min(a.x + a.w, b.x + b.w);
	const y2 = Math.min(a.y + a.h, b.y + b.h);
	const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
	const union = a.w * a.h + b.w * b.h - inter;
	return union <= 0 ? 0 : inter / union;
}
/** OpenCV-style NMSBoxes: score_threshold then IoU suppression. */
function nmsBoxes(boxes, scores, scoreThreshold, iouThreshold) {
	const order = scores.map((score, index) => ({
		score,
		index
	})).filter((item) => item.score >= scoreThreshold).sort((a, b) => b.score - a.score).map((item) => item.index);
	const keep = [];
	const dead = /* @__PURE__ */ new Set();
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
function expandBox(box, scale, imgW, imgH) {
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
	return {
		x,
		y,
		w: Math.max(1, w),
		h: Math.max(1, h)
	};
}
function clipBox(box, w, h) {
	const x = Math.max(0, Math.floor(box.x));
	const y = Math.max(0, Math.floor(box.y));
	return {
		x,
		y,
		w: Math.max(1, Math.min(w - x, Math.ceil(box.w))),
		h: Math.max(1, Math.min(h - y, Math.ceil(box.h)))
	};
}
function pixelateRegion(ctx, box, blockSize) {
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
function blurRegion(ctx, box, radius) {
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
function applyMosaic(ctx, box, options) {
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
		else blurRegion(sctx, region, options.blockSize * .9);
		ctx.save();
		ctx.beginPath();
		ctx.ellipse(region.x + region.w / 2, region.y + region.h / 2, region.w / 2, region.h / 2, 0, 0, Math.PI * 2);
		ctx.clip();
		ctx.drawImage(snap, 0, 0);
		ctx.restore();
		return;
	}
	if (options.style === "pixel") pixelateRegion(ctx, region, options.blockSize);
	else blurRegion(ctx, region, options.blockSize * .9);
}
function drawDebugBox(ctx, box, label, score) {
	const { x, y, w, h } = clipBox(box, ctx.canvas.width, ctx.canvas.height);
	ctx.save();
	ctx.strokeStyle = "rgba(110, 231, 197, 0.9)";
	ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * .015));
	ctx.strokeRect(x + .5, y + .5, w, h);
	const text = `${label}  ${(score * 100).toFixed(0)}%`;
	ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
	const padX = 6;
	const padY = 4;
	const tw = ctx.measureText(text).width + 12;
	const th = 20;
	const ty = y - th < 0 ? y : y - th;
	ctx.fillStyle = "rgba(11, 12, 14, 0.86)";
	ctx.fillRect(x, ty, tw, th);
	ctx.fillStyle = "#6ee7c5";
	ctx.fillText(text, x + padX, ty + th - padY - 2);
	ctx.restore();
}
var MAX_SIDE = 4096;
var SCORE_FLOOR = .12;
var ortPromise = null;
var sessions = /* @__PURE__ */ new Map();
function formatOrtError(err) {
	const msg = err instanceof Error ? err.message : String(err);
	if (msg.includes("no available backend") || msg.includes("Failed to fetch")) return "検出エンジンを起動できませんでした。ページを再読み込みしてください。";
	return msg;
}
function loadOrt() {
	if (!ortPromise) ortPromise = import("../_libs/onnxruntime-web.mjs").then((n) => n.t).then((ort) => {
		ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.1/dist/";
		ort.env.wasm.numThreads = 1;
		ort.env.wasm.simd = true;
		ort.env.wasm.proxy = false;
		return ort;
	});
	return ortPromise;
}
async function fetchBuffer(url, onProgress) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`モデルの読み込みに失敗しました (${res.status})`);
	const total = Number(res.headers.get("content-length") ?? 0);
	if (!res.body || !total) {
		const buf = await res.arrayBuffer();
		onProgress?.(1);
		return buf;
	}
	const reader = res.body.getReader();
	const chunks = [];
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
async function warmupDetector(mode, onProgress) {
	await getSession(mode, onProgress);
}
async function getSession(mode, onProgress) {
	let pending = sessions.get(mode);
	if (!pending) {
		pending = (async () => {
			const ort = await loadOrt();
			onProgress?.(.05);
			const buffer = await fetchBuffer(MODELS[mode].url, (ratio) => {
				onProgress?.(.05 + ratio * .85);
			});
			const session = await ort.InferenceSession.create(buffer, {
				executionProviders: ["wasm"],
				graphOptimizationLevel: "all"
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
function toNchw(canvas) {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) throw new Error("キャンバスを初期化できませんでした");
	const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const plane = width * height;
	const tensor = new Float32Array(3 * plane);
	for (let i = 0; i < plane; i++) {
		const o = i * 4;
		tensor[i] = data[o] / 255;
		tensor[plane + i] = data[o + 1] / 255;
		tensor[2 * plane + i] = data[o + 2] / 255;
	}
	return tensor;
}
/** NudeNet: pad to square (bottom/right), then resize. */
function letterbox(source, srcW, srcH, size) {
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
	return {
		tensor: toNchw(input),
		xPad,
		yPad,
		width: srcW,
		height: srcH,
		size
	};
}
/** imgutils anime YOLO: stretch to square. */
function stretch(source, srcW, srcH, size) {
	const input = document.createElement("canvas");
	input.width = size;
	input.height = size;
	const ictx = input.getContext("2d", { willReadFrequently: true });
	if (!ictx) throw new Error("キャンバスを初期化できませんでした");
	ictx.drawImage(source, 0, 0, size, size);
	return {
		tensor: toNchw(input),
		xPad: 0,
		yPad: 0,
		width: srcW,
		height: srcH,
		size
	};
}
function postprocess(data, dims, mode, xPad, yPad, width, height, modelSize, scoreThreshold) {
	const spec = MODELS[mode];
	const squeezed = dims[0] === 1 ? dims.slice(1) : [...dims];
	const classCount = spec.labels.length;
	let numBoxes;
	let stride;
	let layout;
	if (squeezed.length === 2 && squeezed[0] === 4 + classCount) {
		stride = squeezed[1];
		numBoxes = stride;
		layout = "cn";
	} else if (squeezed.length === 2 && squeezed[1] === 4 + classCount) {
		numBoxes = squeezed[0];
		stride = squeezed[1];
		layout = "nc";
	} else throw new Error(`想定外の出力形状: [${dims.join(", ")}]`);
	const boxes = [];
	const scores = [];
	const classIds = [];
	const floor = Math.min(SCORE_FLOOR, scoreThreshold);
	const scaleX = (width + xPad) / modelSize;
	const scaleY = (height + yPad) / modelSize;
	for (let i = 0; i < numBoxes; i++) {
		let cx, cy, bw, bh;
		let best = 0;
		let classId = 0;
		if (layout === "cn") {
			cx = data[0 * numBoxes + i];
			cy = data[1 * numBoxes + i];
			bw = data[2 * numBoxes + i];
			bh = data[3 * numBoxes + i];
			for (let c = 0; c < classCount; c++) {
				const s = data[(4 + c) * numBoxes + i];
				if (s > best) {
					best = s;
					classId = c;
				}
			}
		} else {
			const base = i * stride;
			cx = data[base];
			cy = data[base + 1];
			bw = data[base + 2];
			bh = data[base + 3];
			for (let c = 0; c < classCount; c++) {
				const s = data[base + 4 + c];
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
		boxes.push({
			x,
			y,
			w,
			h
		});
		scores.push(best);
		classIds.push(classId);
	}
	const keep = nmsBoxes(boxes, scores, scoreThreshold, spec.nmsIou);
	const detections = [];
	for (const i of keep) {
		const raw = spec.labels[classIds[i]];
		const part = partFromRaw(mode, raw);
		if (!part) continue;
		detections.push({
			part,
			raw,
			score: scores[i],
			box: boxes[i]
		});
	}
	detections.sort((a, b) => b.score - a.score);
	return detections;
}
async function loadImageFile(file) {
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
async function detectAndCensor(image, options, onProgress) {
	const spec = MODELS[options.mode];
	const session = await getSession(options.mode, onProgress);
	const ort = await loadOrt();
	const prepared = options.mode === "photo" ? letterbox(image, image.width, image.height, spec.inputSize) : stretch(image, image.width, image.height, spec.inputSize);
	const inputName = session.inputNames[0] ?? "images";
	const tensor = new ort.Tensor("float32", prepared.tensor, [
		1,
		3,
		spec.inputSize,
		spec.inputSize
	]);
	const first = (await session.run({ [inputName]: tensor }))[session.outputNames[0] ?? "output0"];
	if (!first) throw new Error("モデル出力が空です");
	const data = first.data;
	if (!(data instanceof Float32Array)) throw new Error("モデル出力の型が不正です");
	const detections = postprocess(data, first.dims, options.mode, prepared.xPad, prepared.yPad, prepared.width, prepared.height, prepared.size, options.scoreThreshold);
	const canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("キャンバスを初期化できませんでした");
	ctx.drawImage(image, 0, 0);
	const selected = new Set(options.parts);
	const mosaicked = detections.filter((d) => selected.has(d.part));
	for (const det of mosaicked) applyMosaic(ctx, expandBox(det.box, options.expand, canvas.width, canvas.height), {
		style: options.style,
		shape: options.shape,
		blockSize: options.blockSize
	});
	if (options.showBoxes) for (const det of detections) drawDebugBox(ctx, expandBox(det.box, options.expand, canvas.width, canvas.height), det.raw, det.score);
	const blob = await new Promise((resolve, reject) => {
		canvas.toBlob((out) => {
			if (!out) {
				reject(/* @__PURE__ */ new Error("画像の書き出しに失敗しました"));
				return;
			}
			resolve(out);
		}, "image/png", 1);
	});
	return {
		detections,
		mosaicked,
		outputUrl: URL.createObjectURL(blob),
		blob,
		width: canvas.width,
		height: canvas.height
	};
}
var CRC_TABLE = (() => {
	const table = /* @__PURE__ */ new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
		table[i] = c >>> 0;
	}
	return table;
})();
function crc32(data) {
	let c = 4294967295;
	for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 255] ^ c >>> 8;
	return (c ^ 4294967295) >>> 0;
}
function dosDateTime(date) {
	return {
		time: date.getSeconds() >> 1 | date.getMinutes() << 5 | date.getHours() << 11,
		date: date.getDate() | date.getMonth() + 1 << 5 | date.getFullYear() - 1980 << 9
	};
}
function u16(n) {
	const b = /* @__PURE__ */ new Uint8Array(2);
	b[0] = n & 255;
	b[1] = n >>> 8 & 255;
	return b;
}
function u32(n) {
	const b = /* @__PURE__ */ new Uint8Array(4);
	b[0] = n & 255;
	b[1] = n >>> 8 & 255;
	b[2] = n >>> 16 & 255;
	b[3] = n >>> 24 & 255;
	return b;
}
function safeZipPath(name) {
	return name.replaceAll("\\", "/").replace(/^\/+/, "").replaceAll(/\.\.\//g, "").replaceAll(/^\.\//g, "");
}
async function zipBlobs(entries) {
	const now = dosDateTime(/* @__PURE__ */ new Date());
	const chunks = [];
	const centrals = [];
	let offset = 0;
	for (const entry of entries) {
		const path = safeZipPath(entry.path) || "image.png";
		const name = new TextEncoder().encode(path);
		const data = new Uint8Array(await entry.blob.arrayBuffer());
		const crc = crc32(data);
		const local = [
			u32(67324752),
			u16(20),
			u16(2048),
			u16(0),
			u16(now.time),
			u16(now.date),
			u32(crc),
			u32(data.length),
			u32(data.length),
			u16(name.length),
			u16(0),
			name,
			data
		];
		const localSize = 30 + name.length + data.length;
		for (const part of local) chunks.push(part);
		const central = [
			u32(33639248),
			u16(20),
			u16(20),
			u16(2048),
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
			name
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
	chunks.push(u32(101010256), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(centralSize), u32(centralStart), u16(0));
	return new Blob(chunks, { type: "application/zip" });
}
function Comparison({ beforeUrl, afterUrl, alt = "処理結果" }) {
	const [pos, setPos] = (0, import_react.useState)(.52);
	const frameRef = (0, import_react.useRef)(null);
	const move = (clientX) => {
		const el = frameRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const next = (clientX - rect.left) / rect.width;
		setPos(Math.max(.04, Math.min(.96, next)));
	};
	const onPointerDown = (e) => {
		e.currentTarget.setPointerCapture(e.pointerId);
		move(e.clientX);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: frameRef,
		className: "relative w-full cursor-ew-resize overflow-hidden rounded-md bg-surface-2 select-none",
		onPointerDown,
		onPointerMove: (e) => {
			if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e.clientX);
		},
		role: "slider",
		"aria-label": "前後比較",
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-valuenow": Math.round(pos * 100),
		tabIndex: 0,
		onKeyDown: (e) => {
			if (e.key === "ArrowLeft") setPos((p) => Math.max(.04, p - .04));
			if (e.key === "ArrowRight") setPos((p) => Math.min(.96, p + .04));
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: afterUrl,
				alt,
				className: "block w-full",
				draggable: false
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: beforeUrl,
				alt: "元画像",
				draggable: false,
				className: "absolute inset-0 size-full object-cover",
				style: { clipPath: `inset(0 ${(1 - pos) * 100}% 0 0)` }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-y-0 z-10 w-px bg-fg",
				style: { left: `${pos * 100}%` },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg text-xs font-medium tracking-wide text-fg",
					children: "比較"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pointer-events-none absolute top-3 left-3 rounded-full bg-bg/80 px-2.5 py-1 text-xs font-medium tracking-wide text-muted",
				children: "元"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pointer-events-none absolute top-3 right-3 rounded-full bg-bg/80 px-2.5 py-1 text-xs font-medium tracking-wide text-muted",
				children: "処理後"
			})
		]
	});
}
var ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp";
function Dropzone({ count, previewUrl, disabled, onFiles }) {
	const filesRef = (0, import_react.useRef)(null);
	const folderRef = (0, import_react.useRef)(null);
	const [over, setOver] = (0, import_react.useState)(false);
	const takeList = (0, import_react.useCallback)((list) => {
		if (disabled) return;
		const files = list ? [...list] : [];
		if (!files.length) return;
		onFiles(files);
	}, [disabled, onFiles]);
	const onDrop = async (e) => {
		e.preventDefault();
		setOver(false);
		if (disabled) return;
		try {
			const files = await collectFromDataTransfer(e.dataTransfer);
			takeList(files);
		} catch {
			takeList(e.dataTransfer.files);
		}
	};
	const onFilesChange = (e) => {
		takeList(e.target.files ?? void 0);
		e.target.value = "";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			id: "veil-files",
			ref: filesRef,
			type: "file",
			accept: ACCEPT,
			multiple: true,
			className: "sr-only",
			onChange: onFilesChange,
			disabled
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			id: "veil-folder",
			ref: folderRef,
			type: "file",
			multiple: true,
			className: "sr-only",
			onChange: onFilesChange,
			disabled,
			webkitdirectory: "",
			directory: ""
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			onDragEnter: (e) => {
				e.preventDefault();
				setOver(true);
			},
			onDragOver: (e) => {
				e.preventDefault();
				setOver(true);
			},
			onDragLeave: () => setOver(false),
			onDrop: (e) => void onDrop(e),
			className: cn("relative flex min-h-36 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed px-4 py-5 text-center transition-colors duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)]", over ? "border-accent bg-accent-soft" : "border-border-strong bg-surface", disabled && "opacity-50"),
			children: count > 0 && previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: previewUrl,
				alt: "",
				className: "absolute inset-0 size-full object-cover opacity-30"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 rounded-md bg-bg/80 px-3 py-2 backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm font-medium text-fg",
					children: [count, " 枚を読み込み済み"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: "ドロップで追加できます"
				})]
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex size-11 items-center justify-center rounded-md border border-border bg-surface-2 text-fg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
						className: "size-5",
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm font-medium text-fg",
					children: "画像やフォルダをドロップ"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: "JPEG / PNG / WebP ・ 複数枚・貼り付け可"
				})
			] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-2 grid grid-cols-2 gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "secondary",
				size: "sm",
				disabled,
				onClick: () => filesRef.current?.click(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {}), "画像を追加"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "secondary",
				size: "sm",
				disabled,
				onClick: () => folderRef.current?.click(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {}), "フォルダ"]
			})]
		})
	] });
}
var STATUS_JA = {
	queued: "待機",
	running: "処理中",
	done: "完了",
	error: "失敗"
};
function QueueList({ items, selectedId, disabled, onSelect }) {
	if (items.length < 2) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mt-4 max-h-64 overflow-auto rounded-lg border border-border bg-surface",
		children: items.map((item) => {
			const active = item.id === selectedId;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "border-b border-border last:border-b-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: disabled && !active,
					onClick: () => onSelect(item.id),
					className: cn("flex w-full min-h-11 items-center gap-3 px-3 py-2 text-left", active ? "bg-surface-2" : "hover:bg-surface-2/60"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: item.outputUrl ?? item.sourceUrl,
							alt: "",
							className: "size-11 shrink-0 rounded-sm object-cover"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm",
								children: item.file.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 block text-xs text-muted",
								children: item.status === "done" ? item.mosaicked > 0 ? `${item.mosaicked} 箇所にモザイク` : "検出なし" : item.status === "error" ? item.error ?? STATUS_JA.error : STATUS_JA[item.status]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("shrink-0 font-mono text-[11px]", item.status === "done" ? "text-accent" : item.status === "error" ? "text-danger" : item.status === "running" ? "text-fg" : "text-subtle"),
							children: STATUS_JA[item.status]
						})
					]
				})
			}, item.id);
		})
	});
}
function VeilApp() {
	const [items, setItems] = (0, import_react.useState)([]);
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [progressLabel, setProgressLabel] = (0, import_react.useState)("");
	const [modelReady, setModelReady] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [view, setView] = (0, import_react.useState)("compare");
	const [mode, setMode] = (0, import_react.useState)("illust");
	const [parts, setParts] = (0, import_react.useState)(DEFAULT_PARTS);
	const [threshold, setThreshold] = (0, import_react.useState)(.28);
	const [expand, setExpand] = (0, import_react.useState)(1.45);
	const [blockSize, setBlockSize] = (0, import_react.useState)(18);
	const [style, setStyle] = (0, import_react.useState)("pixel");
	const [shape, setShape] = (0, import_react.useState)("ellipse");
	const [showBoxes, setShowBoxes] = (0, import_react.useState)(false);
	const seqRef = (0, import_react.useRef)(0);
	const abortRef = (0, import_react.useRef)(false);
	const itemsRef = (0, import_react.useRef)(items);
	itemsRef.current = items;
	const selected = items.find((it) => it.id === selectedId) ?? items[0] ?? null;
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		setModelReady(false);
		setProgress(0);
		setProgressLabel(mode === "illust" ? "イラスト用モデルを読み込み中" : "実写用モデルを読み込み中");
		warmupDetector(mode, (ratio) => {
			if (!cancelled) setProgress(Math.round(ratio * 100));
		}).then(() => {
			if (!cancelled) {
				setModelReady(true);
				setProgress(100);
			}
		}).catch((err) => {
			if (!cancelled) setError(err instanceof Error ? err.message : "検出モデルの読み込みに失敗しました");
		});
		return () => {
			cancelled = true;
		};
	}, [mode]);
	(0, import_react.useEffect)(() => {
		return () => {
			for (const it of itemsRef.current) {
				URL.revokeObjectURL(it.sourceUrl);
				if (it.outputUrl) URL.revokeObjectURL(it.outputUrl);
			}
		};
	}, []);
	const addFiles = (0, import_react.useCallback)((incoming) => {
		const images = filterImages(incoming);
		if (!images.length) {
			setError("画像ファイルが見つかりませんでした");
			return;
		}
		const prev = itemsRef.current;
		const have = new Set(prev.map((p) => fileKey(p.file)));
		const { files, truncated } = capFiles(images.filter((f) => !have.has(fileKey(f))), prev.length);
		if (truncated) setError("一度に扱えるのは 200 枚までです。超えた分は読み込んでいません。");
		else setError(null);
		if (!files.length) return;
		const added = files.map((file) => {
			seqRef.current += 1;
			return {
				id: `img-${seqRef.current}`,
				file,
				relPath: file.webkitRelativePath || file.name,
				sourceUrl: URL.createObjectURL(file),
				status: "queued",
				mosaicked: 0,
				detections: 0,
				hits: []
			};
		});
		const next = [...prev, ...added];
		setItems(next);
		setSelectedId((cur) => cur ?? next[0]?.id ?? null);
	}, []);
	(0, import_react.useEffect)(() => {
		const onPaste = (e) => {
			const files = [...e.clipboardData?.items ?? []].filter((it) => it.type.startsWith("image/")).map((it) => it.getAsFile()).filter((f) => !!f);
			if (files.length) {
				e.preventDefault();
				addFiles(files);
			}
		};
		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	}, [addFiles]);
	const run = (0, import_react.useCallback)(async () => {
		if (!items.length) {
			setError("先に画像を読み込んでください");
			return;
		}
		if (parts.length === 0) {
			setError("モザイク対象を1つ以上選んでください");
			return;
		}
		abortRef.current = false;
		setBusy(true);
		setError(null);
		const snapshot = itemsRef.current;
		const total = snapshot.length;
		try {
			for (let i = 0; i < snapshot.length; i++) {
				if (abortRef.current) break;
				const item = snapshot[i];
				setSelectedId(item.id);
				setView("compare");
				setProgress(Math.round(i / total * 100));
				setProgressLabel(`${i + 1} / ${total}　${item.file.name}`);
				setItems((prev) => prev.map((it) => it.id === item.id ? {
					...it,
					status: "running",
					error: void 0
				} : it));
				try {
					const bitmap = await loadImageFile(item.file);
					const next = await detectAndCensor(bitmap, {
						mode,
						parts,
						scoreThreshold: threshold,
						expand,
						blockSize,
						style,
						shape,
						showBoxes
					}, (ratio) => {
						setProgress(Math.round((i + ratio) / total * 100));
					});
					bitmap.close();
					setItems((prev) => prev.map((it) => {
						if (it.id !== item.id) return it;
						if (it.outputUrl) URL.revokeObjectURL(it.outputUrl);
						return {
							...it,
							status: "done",
							mosaicked: next.mosaicked.length,
							detections: next.detections.length,
							hits: next.detections.map((d) => ({
								part: d.part,
								score: d.score
							})),
							outputUrl: next.outputUrl,
							blob: next.blob,
							width: next.width,
							height: next.height,
							error: void 0
						};
					}));
				} catch (err) {
					setItems((prev) => prev.map((it) => it.id === item.id ? {
						...it,
						status: "error",
						error: err instanceof Error ? err.message : "処理に失敗しました"
					} : it));
				}
				await new Promise((r) => setTimeout(r, 0));
			}
			setProgress(100);
			setProgressLabel(abortRef.current ? "中断しました" : "完了");
		} finally {
			setBusy(false);
		}
	}, [
		blockSize,
		expand,
		items.length,
		mode,
		parts,
		shape,
		showBoxes,
		style,
		threshold
	]);
	const togglePart = (id, on) => {
		setParts((prev) => {
			if (on) return prev.includes(id) ? prev : [...prev, id];
			return prev.filter((x) => x !== id);
		});
	};
	const changeMode = (next) => {
		if (next === mode || busy) return;
		setMode(next);
		setParts(DEFAULT_PARTS);
		setError(null);
		setThreshold(next === "illust" ? .28 : .25);
		setExpand(next === "illust" ? 1.45 : 1.35);
		setItems((prev) => prev.map((it) => {
			if (it.outputUrl) URL.revokeObjectURL(it.outputUrl);
			return {
				...it,
				status: "queued",
				mosaicked: 0,
				detections: 0,
				hits: [],
				outputUrl: void 0,
				blob: void 0,
				error: void 0
			};
		}));
	};
	const clear = () => {
		abortRef.current = true;
		for (const it of items) {
			URL.revokeObjectURL(it.sourceUrl);
			if (it.outputUrl) URL.revokeObjectURL(it.outputUrl);
		}
		setItems([]);
		setSelectedId(null);
		setError(null);
		setProgress(0);
	};
	const download = async () => {
		const done = items.filter((it) => it.status === "done" && it.blob);
		if (!done.length) return;
		if (done.length === 1) {
			const it = done[0];
			const a = document.createElement("a");
			a.href = it.outputUrl;
			a.download = `${it.file.name.replace(/\.[^.]+$/, "") || "image"}_mosaic.png`;
			a.click();
			return;
		}
		const zip = await zipBlobs(done.map((it) => ({
			path: mosaicZipPath(it.relPath),
			blob: it.blob
		})));
		const url = URL.createObjectURL(zip);
		const a = document.createElement("a");
		a.href = url;
		a.download = "veil_mosaic.zip";
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 4e3);
	};
	const extras = MODELS[mode].extras;
	const doneCount = items.filter((it) => it.status === "done").length;
	const mosaicCount = items.reduce((n, it) => n + it.mosaicked, 0);
	const resultSummary = (0, import_react.useMemo)(() => {
		if (!selected) return null;
		if (selected.status === "error") return selected.error ?? "処理に失敗しました";
		if (selected.status !== "done") return null;
		if (selected.mosaicked === 0) return selected.detections === 0 ? "指定部位は検出されませんでした" : "検出はありますが、選択中の対象はありません";
		return `${selected.mosaicked} 箇所にモザイクを適用`;
	}, [selected]);
	const stageSrc = view === "before" ? selected?.sourceUrl : view === "after" ? selected?.outputUrl : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs tracking-widest text-accent",
					children: "VEIL"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-0.5 text-lg font-semibold tracking-tight",
					children: "ヴェール"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hidden max-w-sm text-right text-xs leading-relaxed text-muted sm:block",
					children: "フォルダごと一括で局部をモザイク。画像は端末内だけで処理します。"
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:py-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-5 lg:sticky lg:top-6 lg:col-span-4 lg:self-start",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-wide text-muted",
							children: "入力"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
								label: "検出モデル",
								value: mode,
								options: [{
									id: "illust",
									name: "イラスト"
								}, {
									id: "photo",
									name: "実写"
								}],
								onChange: changeMode
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dropzone, {
								count: items.length,
								previewUrl: selected?.sourceUrl,
								disabled: busy,
								onFiles: addFiles
							})
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
						className: "rounded-lg border border-border bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
								className: "px-1 text-xs font-medium tracking-wide text-muted",
								children: "モザイク対象"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "flex flex-col gap-1",
								children: ["female", "male"].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
										checked: parts.includes(id),
										onCheckedChange: (v) => togglePart(id, v === true)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm",
										children: PART_JA[id]
									})]
								}) }, id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 mb-1 text-xs font-medium tracking-wide text-subtle",
								children: "任意"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "flex flex-col gap-1",
								children: extras.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
										checked: parts.includes(id),
										onCheckedChange: (v) => togglePart(id, v === true)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-muted",
										children: PART_JA[id]
									})]
								}) }, id))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium tracking-wide text-muted",
								children: "パラメータ"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
								label: "信頼度",
								value: `${Math.round(threshold * 100)}%`,
								min: .15,
								max: .7,
								step: .01,
								current: threshold,
								onChange: setThreshold
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
								label: "範囲の拡大",
								value: `${expand.toFixed(2)}×`,
								min: 1,
								max: 2.2,
								step: .05,
								current: expand,
								onChange: setExpand
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRow, {
								label: "モザイク粗さ",
								value: `${blockSize}px`,
								min: 8,
								max: 48,
								step: 1,
								current: blockSize,
								onChange: setBlockSize
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
									label: "種類",
									value: style,
									options: [{
										id: "pixel",
										name: "ピクセル"
									}, {
										id: "blur",
										name: "ぼかし"
									}],
									onChange: setStyle
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
									label: "形状",
									value: shape,
									options: [{
										id: "ellipse",
										name: "楕円"
									}, {
										id: "rect",
										name: "矩形"
									}],
									onChange: setShape
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-4 flex min-h-11 items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm",
									children: "検出枠を重ねる"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: showBoxes,
									onCheckedChange: setShowBoxes
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "lg",
								onClick: () => void run(),
								disabled: busy || items.length === 0,
								children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }), "処理中"] }) : items.length > 1 ? `${items.length} 枚を処理` : "モザイクを実行"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									onClick: () => {
										abortRef.current = true;
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, {}), "中断"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									onClick: clear,
									disabled: items.length === 0,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, {}), "クリア"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									onClick: () => void download(),
									disabled: busy || doneCount === 0,
									children: [doneCount > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), doneCount > 1 ? "ZIPで保存" : "保存"]
								})]
							}),
							(busy || !modelReady && !error) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { value: busy ? Math.max(progress, 8) : progress }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-muted",
									children: busy ? progressLabel || "検出を実行しています" : progressLabel || "検出モデルを読み込み中"
								})]
							}),
							error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-danger",
								children: error
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "min-w-0 lg:col-span-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs font-medium tracking-wide text-muted",
							children: ["出力", items.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-2 font-mono text-subtle",
								children: [
									doneCount,
									"/",
									items.length,
									mosaicCount > 0 ? ` · ${mosaicCount} 箇所` : ""
								]
							}) : null]
						}), selected?.status === "done" && selected.outputUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex rounded-full border border-border bg-surface p-0.5",
							children: [
								["compare", "比較"],
								["after", "処理後"],
								["before", "元"]
							].map(([id, name]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setView(id),
								className: view === id ? "h-8 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground" : "h-8 rounded-full px-3 text-xs font-medium text-muted",
								children: name
							}, id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "overflow-hidden rounded-lg border border-border bg-surface",
						children: [!selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-h-72 flex-col items-center justify-center gap-3 px-6 py-16 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex size-11 items-center justify-center rounded-md border border-border bg-surface-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
										className: "size-5 text-accent",
										strokeWidth: 1.75
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: "画像やフォルダを読み込むと、ここに結果が出ます"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "max-w-sm text-xs leading-relaxed text-muted",
									children: "ブラウザの制限でパス入力はできません。「フォルダ」ボタンか、フォルダのドロップでまとめて渡せます。処理は端末内だけです。"
								})
							]
						}), selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-h-stage overflow-auto",
							children: [
								selected.status === "done" && selected.outputUrl && view === "compare" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comparison, {
									beforeUrl: selected.sourceUrl,
									afterUrl: selected.outputUrl
								}),
								selected.status === "done" && stageSrc && view !== "compare" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: stageSrc,
									alt: view === "after" ? "処理後" : "元画像",
									className: "block w-full"
								}),
								selected.status !== "done" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: selected.sourceUrl,
									alt: "入力画像",
									className: "block w-full"
								})
							]
						})]
					}),
					selected?.status === "done" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-lg border border-border bg-surface p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: resultSummary
							}), selected.width && selected.height ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-mono text-xs text-muted tabular-nums",
								children: [
									selected.width,
									" × ",
									selected.height
								]
							}) : null]
						}), selected.hits.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 flex flex-wrap gap-2",
							children: selected.hits.map((hit, i) => {
								const on = parts.includes(hit.part);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: on ? "accent" : "muted",
									children: [PART_JA[hit.part], /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "ml-1.5 font-mono",
										children: [Math.round(hit.score * 100), "%"]
									})]
								}) }, `${hit.part}-${i}`);
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-muted",
							children: "閾値を下げると検出しやすくなります。イラストは「イラスト」モデル、写真は「実写」モデルを選んでください。"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueueList, {
						items,
						selectedId: selected?.id ?? null,
						onSelect: setSelectedId
					})
				]
			})]
		})]
	});
}
function SliderRow({ label, value, min, max, step, current, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-xs text-muted tabular-nums",
				children: value
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
			min,
			max,
			step,
			value: [current],
			onValueChange: (v) => onChange(v[0] ?? current)
		})]
	});
}
function Seg({ label, value, options, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-1.5 text-xs text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-2 rounded-md border border-border bg-bg p-0.5",
		children: options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onChange(opt.id),
			className: value === opt.id ? "h-9 rounded-sm bg-surface-2 text-xs font-medium text-fg" : "h-9 rounded-sm text-xs font-medium text-muted",
			children: opt.name
		}, opt.id))
	})] });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VeilApp, {});
}
//#endregion
export { Home as component };
