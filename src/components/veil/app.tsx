import { Download, Eraser, FolderOpen, LoaderCircle, ShieldCheck, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { capFiles, fileKey, filterImages, mosaicZipPath } from "@/lib/nudenet/collect";
import {
  detectAndCensor,
  loadImageFile,
  warmupDetector,
} from "@/lib/nudenet/detect";
import {
  DEFAULT_PARTS,
  MODELS,
  PART_JA,
  type DetectorMode,
  type PartId,
} from "@/lib/nudenet/labels";
import type { MosaicShape, MosaicStyle } from "@/lib/nudenet/mosaic";
import { zipBlobs } from "@/lib/zip";
import { Comparison } from "./comparison";
import { Dropzone } from "./dropzone";
import { QueueList, type QueueItem } from "./queue";

type ViewMode = "after" | "compare" | "before";

export function VeilApp() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("compare");
  const [mode, setMode] = useState<DetectorMode>("illust");

  const [parts, setParts] = useState<PartId[]>(DEFAULT_PARTS);
  const [threshold, setThreshold] = useState(0.28);
  const [expand, setExpand] = useState(1.45);
  const [blockSize, setBlockSize] = useState(18);
  const [style, setStyle] = useState<MosaicStyle>("pixel");
  const [shape, setShape] = useState<MosaicShape>("ellipse");
  const [showBoxes, setShowBoxes] = useState(false);

  const seqRef = useRef(0);
  const abortRef = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const selected = items.find((it) => it.id === selectedId) ?? items[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    setModelReady(false);
    setProgress(0);
    setProgressLabel(
      mode === "illust" ? "イラスト用モデルを読み込み中" : "実写用モデルを読み込み中",
    );
    warmupDetector(mode, (ratio) => {
      if (!cancelled) setProgress(Math.round(ratio * 100));
    })
      .then(() => {
        if (!cancelled) {
          setModelReady(true);
          setProgress(100);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "検出モデルの読み込みに失敗しました");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    return () => {
      for (const it of itemsRef.current) {
        URL.revokeObjectURL(it.sourceUrl);
        if (it.outputUrl) URL.revokeObjectURL(it.outputUrl);
      }
    };
  }, []);

  const addFiles = useCallback((incoming: File[]) => {
    const images = filterImages(incoming);
    if (!images.length) {
      setError("画像ファイルが見つかりませんでした");
      return;
    }
    const prev = itemsRef.current;
    const have = new Set(prev.map((p) => fileKey(p.file)));
    const fresh = images.filter((f) => !have.has(fileKey(f)));
    const { files, truncated } = capFiles(fresh, prev.length);
    if (truncated) {
      setError("一度に扱えるのは 200 枚までです。超えた分は読み込んでいません。");
    } else {
      setError(null);
    }
    if (!files.length) return;
    const added: QueueItem[] = files.map((file) => {
      seqRef.current += 1;
      return {
        id: `img-${seqRef.current}`,
        file,
        relPath: file.webkitRelativePath || file.name,
        sourceUrl: URL.createObjectURL(file),
        status: "queued",
        mosaicked: 0,
        detections: 0,
        hits: [],
      };
    });
    const next = [...prev, ...added];
    setItems(next);
    setSelectedId((cur) => cur ?? next[0]?.id ?? null);
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = [...(e.clipboardData?.items ?? [])]
        .filter((it) => it.type.startsWith("image/"))
        .map((it) => it.getAsFile())
        .filter((f): f is File => !!f);
      if (files.length) {
        e.preventDefault();
        addFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const run = useCallback(async () => {
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
        const item = snapshot[i]!;
        setSelectedId(item.id);
        setView("compare");
        setProgress(Math.round((i / total) * 100));
        setProgressLabel(`${i + 1} / ${total}　${item.file.name}`);
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: "running", error: undefined } : it)),
        );
        try {
          const bitmap = await loadImageFile(item.file);
          const next = await detectAndCensor(
            bitmap,
            {
              mode,
              parts,
              scoreThreshold: threshold,
              expand,
              blockSize,
              style,
              shape,
              showBoxes,
            },
            (ratio) => {
              setProgress(Math.round(((i + ratio) / total) * 100));
            },
          );
          bitmap.close();
          setItems((prev) =>
            prev.map((it) => {
              if (it.id !== item.id) return it;
              if (it.outputUrl) URL.revokeObjectURL(it.outputUrl);
              return {
                ...it,
                status: "done",
                mosaicked: next.mosaicked.length,
                detections: next.detections.length,
                hits: next.detections.map((d) => ({ part: d.part, score: d.score })),
                outputUrl: next.outputUrl,
                blob: next.blob,
                width: next.width,
                height: next.height,
                error: undefined,
              };
            }),
          );
        } catch (err) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: "error",
                    error: err instanceof Error ? err.message : "処理に失敗しました",
                  }
                : it,
            ),
          );
        }
        await new Promise((r) => setTimeout(r, 0));
      }
      setProgress(100);
      setProgressLabel(abortRef.current ? "中断しました" : "完了");
    } finally {
      setBusy(false);
    }
  }, [blockSize, expand, items.length, mode, parts, shape, showBoxes, style, threshold]);

  const togglePart = (id: PartId, on: boolean) => {
    setParts((prev) => {
      if (on) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const changeMode = (next: DetectorMode) => {
    if (next === mode || busy) return;
    setMode(next);
    setParts(DEFAULT_PARTS);
    setError(null);
    setThreshold(next === "illust" ? 0.28 : 0.25);
    setExpand(next === "illust" ? 1.45 : 1.35);
    setItems((prev) =>
      prev.map((it) => {
        if (it.outputUrl) URL.revokeObjectURL(it.outputUrl);
        return {
          ...it,
          status: "queued",
          mosaicked: 0,
          detections: 0,
          hits: [],
          outputUrl: undefined,
          blob: undefined,
          error: undefined,
        };
      }),
    );
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
      const it = done[0]!;
      const a = document.createElement("a");
      a.href = it.outputUrl!;
      const base = it.file.name.replace(/\.[^.]+$/, "") || "image";
      a.download = `${base}_mosaic.png`;
      a.click();
      return;
    }
    const zip = await zipBlobs(
      done.map((it) => ({ path: mosaicZipPath(it.relPath), blob: it.blob! })),
    );
    const url = URL.createObjectURL(zip);
    const a = document.createElement("a");
    a.href = url;
    a.download = "veil_mosaic.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const extras = MODELS[mode].extras;
  const doneCount = items.filter((it) => it.status === "done").length;
  const mosaicCount = items.reduce((n, it) => n + it.mosaicked, 0);

  const resultSummary = useMemo(() => {
    if (!selected) return null;
    if (selected.status === "error") return selected.error ?? "処理に失敗しました";
    if (selected.status !== "done") return null;
    if (selected.mosaicked === 0) {
      return selected.detections === 0
        ? "指定部位は検出されませんでした"
        : "検出はありますが、選択中の対象はありません";
    }
    return `${selected.mosaicked} 箇所にモザイクを適用`;
  }, [selected]);

  const stageSrc =
    view === "before"
      ? selected?.sourceUrl
      : view === "after"
        ? selected?.outputUrl
        : null;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-mono text-xs tracking-widest text-accent">VEIL</p>
            <h1 className="mt-0.5 text-lg font-semibold tracking-tight">ヴェール</h1>
          </div>
          <p className="hidden max-w-sm text-right text-xs leading-relaxed text-muted sm:block">
            フォルダごと一括で局部をモザイク。画像は端末内だけで処理します。
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:py-8">
        <section className="flex flex-col gap-5 lg:sticky lg:top-6 lg:col-span-4 lg:self-start">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted">入力</p>
            <div className="mt-2">
              <Seg
                label="検出モデル"
                value={mode}
                options={[
                  { id: "illust", name: "イラスト" },
                  { id: "photo", name: "実写" },
                ]}
                onChange={changeMode}
              />
            </div>
            <div className="mt-3">
              <Dropzone
                count={items.length}
                previewUrl={selected?.sourceUrl}
                disabled={busy}
                onFiles={addFiles}
              />
            </div>
          </div>

          <fieldset className="rounded-lg border border-border bg-surface p-4">
            <legend className="px-1 text-xs font-medium tracking-wide text-muted">
              モザイク対象
            </legend>
            <ul className="flex flex-col gap-1">
              {(["female", "male"] as const).map((id) => (
                <li key={id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-1">
                    <Checkbox
                      checked={parts.includes(id)}
                      onCheckedChange={(v) => togglePart(id, v === true)}
                    />
                    <span className="text-sm">{PART_JA[id]}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-3 mb-1 text-xs font-medium tracking-wide text-subtle">
              任意
            </p>
            <ul className="flex flex-col gap-1">
              {extras.map((id) => (
                <li key={id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-1">
                    <Checkbox
                      checked={parts.includes(id)}
                      onCheckedChange={(v) => togglePart(id, v === true)}
                    />
                    <span className="text-sm text-muted">{PART_JA[id]}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-medium tracking-wide text-muted">パラメータ</p>
            <SliderRow
              label="信頼度"
              value={`${Math.round(threshold * 100)}%`}
              min={0.15}
              max={0.7}
              step={0.01}
              current={threshold}
              onChange={setThreshold}
            />
            <SliderRow
              label="範囲の拡大"
              value={`${expand.toFixed(2)}×`}
              min={1}
              max={2.2}
              step={0.05}
              current={expand}
              onChange={setExpand}
            />
            <SliderRow
              label="モザイク粗さ"
              value={`${blockSize}px`}
              min={8}
              max={48}
              step={1}
              current={blockSize}
              onChange={setBlockSize}
            />

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Seg
                label="種類"
                value={style}
                options={[
                  { id: "pixel", name: "ピクセル" },
                  { id: "blur", name: "ぼかし" },
                ]}
                onChange={setStyle}
              />
              <Seg
                label="形状"
                value={shape}
                options={[
                  { id: "ellipse", name: "楕円" },
                  { id: "rect", name: "矩形" },
                ]}
                onChange={setShape}
              />
            </div>

            <label className="mt-4 flex min-h-11 items-center justify-between gap-3">
              <span className="text-sm">検出枠を重ねる</span>
              <Switch checked={showBoxes} onCheckedChange={setShowBoxes} />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={() => void run()} disabled={busy || items.length === 0}>
              {busy ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  処理中
                </>
              ) : items.length > 1 ? (
                `${items.length} 枚を処理`
              ) : (
                "モザイクを実行"
              )}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {busy ? (
                <Button variant="secondary" onClick={() => { abortRef.current = true; }}>
                  <Square />
                  中断
                </Button>
              ) : (
                <Button variant="secondary" onClick={clear} disabled={items.length === 0}>
                  <Eraser />
                  クリア
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => void download()}
                disabled={busy || doneCount === 0}
              >
                {doneCount > 1 ? <FolderOpen /> : <Download />}
                {doneCount > 1 ? "ZIPで保存" : "保存"}
              </Button>
            </div>
            {(busy || (!modelReady && !error)) && (
              <div className="mt-1">
                <Progress value={busy ? Math.max(progress, 8) : progress} />
                <p className="mt-2 text-xs text-muted">
                  {busy
                    ? progressLabel || "検出を実行しています"
                    : progressLabel || "検出モデルを読み込み中"}
                </p>
              </div>
            )}
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        </section>

        <section className="min-w-0 lg:col-span-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <p className="text-xs font-medium tracking-wide text-muted">
              出力
              {items.length > 0 ? (
                <span className="ml-2 font-mono text-subtle">
                  {doneCount}/{items.length}
                  {mosaicCount > 0 ? ` · ${mosaicCount} 箇所` : ""}
                </span>
              ) : null}
            </p>
            {selected?.status === "done" && selected.outputUrl && (
              <div className="flex rounded-full border border-border bg-surface p-0.5">
                {(
                  [
                    ["compare", "比較"],
                    ["after", "処理後"],
                    ["before", "元"],
                  ] as const
                ).map(([id, name]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    className={
                      view === id
                        ? "h-8 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground"
                        : "h-8 rounded-full px-3 text-xs font-medium text-muted"
                    }
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {!selected && (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <span className="flex size-11 items-center justify-center rounded-md border border-border bg-surface-2">
                  <ShieldCheck className="size-5 text-accent" strokeWidth={1.75} />
                </span>
                <p className="text-sm font-medium">画像やフォルダを読み込むと、ここに結果が出ます</p>
                <p className="max-w-sm text-xs leading-relaxed text-muted">
                  ブラウザの制限でパス入力はできません。「フォルダ」ボタンか、フォルダのドロップでまとめて渡せます。処理は端末内だけです。
                </p>
              </div>
            )}

            {selected && (
              <div className="max-h-stage overflow-auto">
                {selected.status === "done" && selected.outputUrl && view === "compare" && (
                  <Comparison beforeUrl={selected.sourceUrl} afterUrl={selected.outputUrl} />
                )}
                {selected.status === "done" && stageSrc && view !== "compare" && (
                  <img
                    src={stageSrc}
                    alt={view === "after" ? "処理後" : "元画像"}
                    className="block w-full"
                  />
                )}
                {selected.status !== "done" && (
                  <img src={selected.sourceUrl} alt="入力画像" className="block w-full" />
                )}
              </div>
            )}
          </div>

          {selected?.status === "done" && (
            <div className="mt-4 rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{resultSummary}</p>
                {selected.width && selected.height ? (
                  <p className="font-mono text-xs text-muted tabular-nums">
                    {selected.width} × {selected.height}
                  </p>
                ) : null}
              </div>
              {selected.hits.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {selected.hits.map((hit, i) => {
                    const on = parts.includes(hit.part);
                    return (
                      <li key={`${hit.part}-${i}`}>
                        <Badge variant={on ? "accent" : "muted"}>
                          {PART_JA[hit.part]}
                          <span className="ml-1.5 font-mono">
                            {Math.round(hit.score * 100)}%
                          </span>
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted">
                  閾値を下げると検出しやすくなります。イラストは「イラスト」モデル、写真は「実写」モデルを選んでください。
                </p>
              )}
            </div>
          )}

          <QueueList
            items={items}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
          />
        </section>
      </main>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm">{label}</span>
        <span className="font-mono text-xs text-muted tabular-nums">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[current]}
        onValueChange={(v) => onChange(v[0] ?? current)}
      />
    </div>
  );
}

function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; name: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted">{label}</p>
      <div className="grid grid-cols-2 rounded-md border border-border bg-bg p-0.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={
              value === opt.id
                ? "h-9 rounded-sm bg-surface-2 text-xs font-medium text-fg"
                : "h-9 rounded-sm text-xs font-medium text-muted"
            }
          >
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  );
}
