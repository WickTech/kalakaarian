import { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface Props {
  accept?: string[];
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
}

export function UploadDropzone({
  accept,
  multiple = false,
  disabled = false,
  onFiles,
  label = 'Drop files or tap to upload',
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const acceptAttr = accept?.join(',');

  const open = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  const handle = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFiles(Array.from(files));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={open}
      onKeyDown={onKey}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (disabled) return;
        handle(e.dataTransfer.files);
      }}
      aria-label={label}
      aria-disabled={disabled}
      className={[
        'relative rounded-2xl border-2 border-dashed transition-all p-6 text-center cursor-pointer select-none',
        disabled
          ? 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
          : over
            ? 'border-purple-400/60 bg-purple-500/10'
            : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]',
      ].join(' ')}
    >
      <div className="flex flex-col items-center gap-2">
        <UploadCloud className="w-6 h-6 text-purple-300" />
        <p className="text-sm text-chalk">{label}</p>
        {hint && <p className="text-[11px] text-chalk-faint">{hint}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={acceptAttr}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  );
}
