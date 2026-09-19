import { useRef, useState, type PointerEvent } from "react";

type Props = {
  beforeUrl: string;
  afterUrl: string;
  alt?: string;
};

export function Comparison({ beforeUrl, afterUrl, alt = "処理結果" }: Props) {
  const [pos, setPos] = useState(0.52);
  const frameRef = useRef<HTMLDivElement>(null);

  const move = (clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = (clientX - rect.left) / rect.width;
    setPos(Math.max(0.04, Math.min(0.96, next)));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    move(e.clientX);
  };

  return (
    <div
      ref={frameRef}
      className="relative w-full cursor-ew-resize overflow-hidden rounded-md bg-surface-2 select-none"
      onPointerDown={onPointerDown}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e.clientX);
      }}
      role="slider"
      aria-label="前後比較"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos * 100)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPos((p) => Math.max(0.04, p - 0.04));
        if (e.key === "ArrowRight") setPos((p) => Math.min(0.96, p + 0.04));
      }}
    >
      <img src={afterUrl} alt={alt} className="block w-full" draggable={false} />
      <img
        src={beforeUrl}
        alt="元画像"
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${(1 - pos) * 100}% 0 0)` }}
      />
      <div
        className="absolute inset-y-0 z-10 w-px bg-fg"
        style={{ left: `${pos * 100}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg text-xs font-medium tracking-wide text-fg">
          比較
        </span>
      </div>
      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-bg/80 px-2.5 py-1 text-xs font-medium tracking-wide text-muted">
        元
      </span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-bg/80 px-2.5 py-1 text-xs font-medium tracking-wide text-muted">
        処理後
      </span>
    </div>
  );
}
