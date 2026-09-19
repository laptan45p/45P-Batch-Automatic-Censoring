import type { PartId } from "@/lib/nudenet/labels";
import { cn } from "@/lib/utils";

export type QueueStatus = "queued" | "running" | "done" | "error";

export type QueueHit = {
  part: PartId;
  score: number;
};

export type QueueItem = {
  id: string;
  file: File;
  relPath: string;
  sourceUrl: string;
  status: QueueStatus;
  mosaicked: number;
  detections: number;
  hits: QueueHit[];
  outputUrl?: string;
  blob?: Blob;
  error?: string;
  width?: number;
  height?: number;
};

const STATUS_JA: Record<QueueStatus, string> = {
  queued: "待機",
  running: "処理中",
  done: "完了",
  error: "失敗",
};

export function QueueList({
  items,
  selectedId,
  disabled,
  onSelect,
}: {
  items: QueueItem[];
  selectedId: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
}) {
  if (items.length < 2) return null;
  return (
    <ul className="mt-4 max-h-64 overflow-auto rounded-lg border border-border bg-surface">
      {items.map((item) => {
        const active = item.id === selectedId;
        return (
          <li key={item.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              disabled={disabled && !active}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex w-full min-h-11 items-center gap-3 px-3 py-2 text-left",
                active ? "bg-surface-2" : "hover:bg-surface-2/60",
              )}
            >
              <img
                src={item.outputUrl ?? item.sourceUrl}
                alt=""
                className="size-11 shrink-0 rounded-sm object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{item.file.name}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {item.status === "done"
                    ? item.mosaicked > 0
                      ? `${item.mosaicked} 箇所にモザイク`
                      : "検出なし"
                    : item.status === "error"
                      ? (item.error ?? STATUS_JA.error)
                      : STATUS_JA[item.status]}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 font-mono text-[11px]",
                  item.status === "done"
                    ? "text-accent"
                    : item.status === "error"
                      ? "text-danger"
                      : item.status === "running"
                        ? "text-fg"
                        : "text-subtle",
                )}
              >
                {STATUS_JA[item.status]}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
