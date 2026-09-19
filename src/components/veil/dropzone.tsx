import { FolderOpen, ImagePlus } from "lucide-react";
import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { collectFromDataTransfer } from "@/lib/nudenet/collect";
import { Button } from "@/components/ui/button";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp";

type Props = {
  count: number;
  previewUrl?: string | null;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
};

export function Dropzone({ count, previewUrl, disabled, onFiles }: Props) {
  const filesRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const takeList = useCallback(
    (list: File[] | FileList | undefined) => {
      if (disabled) return;
      const files = list ? [...list] : [];
      if (!files.length) return;
      onFiles(files);
    },
    [disabled, onFiles],
  );

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
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

  const onFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    takeList(e.target.files ?? undefined);
    e.target.value = "";
  };

  return (
    <div>
      <input
        id="veil-files"
        ref={filesRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={onFilesChange}
        disabled={disabled}
      />
      <input
        id="veil-folder"
        ref={folderRef}
        type="file"
        multiple
        className="sr-only"
        onChange={onFilesChange}
        disabled={disabled}
        {...{ webkitdirectory: "", directory: "" }}
      />
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => void onDrop(e)}
        className={cn(
          "relative flex min-h-36 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed px-4 py-5 text-center transition-colors duration-[var(--motion-fast)] ease-[var(--ease-smooth-out)]",
          over ? "border-accent bg-accent-soft" : "border-border-strong bg-surface",
          disabled && "opacity-50",
        )}
      >
        {count > 0 && previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-30"
            />
            <div className="relative z-10 rounded-md bg-bg/80 px-3 py-2 backdrop-blur-sm">
              <p className="text-sm font-medium text-fg">{count} 枚を読み込み済み</p>
              <p className="mt-1 text-xs text-muted">ドロップで追加できます</p>
            </div>
          </>
        ) : (
          <>
            <span className="flex size-11 items-center justify-center rounded-md border border-border bg-surface-2 text-fg">
              <ImagePlus className="size-5" strokeWidth={1.75} />
            </span>
            <p className="mt-3 text-sm font-medium text-fg">画像やフォルダをドロップ</p>
            <p className="mt-1 text-xs text-muted">JPEG / PNG / WebP ・ 複数枚・貼り付け可</p>
          </>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => filesRef.current?.click()}
        >
          <ImagePlus />
          画像を追加
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => folderRef.current?.click()}
        >
          <FolderOpen />
          フォルダ
        </Button>
      </div>
    </div>
  );
}
