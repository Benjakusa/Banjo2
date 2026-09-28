import React, { useRef, useState } from 'react';
import { CloudArrowUp, FileEarmarkMusic, Image, X } from 'react-bootstrap-icons';

interface Props {
  accept: string;
  label: string;
  hint?: string;
  /** Text on the empty-state button, before "or drag it here". */
  cta?: string;
  icon?: 'audio' | 'image';
  file: File | null;
  onFile: (file: File | null) => void;
  onPreview?: (dataUrl: string | null) => void;
  error?: string | null;
  required?: boolean;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * A real file target: click to open the system picker, or drag a file onto
 * it. The native input stays in the DOM (hidden) so keyboard and assistive
 * tech still get a proper labelled control.
 */
export const FileDropzone: React.FC<Props> = ({
  accept,
  label,
  hint,
  cta = 'Choose a file',
  icon = 'audio',
  file,
  onFile,
  onPreview,
  error,
  required,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const Icon = icon === 'audio' ? FileEarmarkMusic : Image;

  const accept_ = (incoming: File | undefined | null) => {
    if (!incoming) return;
    onFile(incoming);

    if (onPreview) {
      const reader = new FileReader();
      reader.onload = () => onPreview(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => onPreview(null);
      reader.readAsDataURL(incoming);
    }
  };

  const clear = () => {
    onFile(null);
    onPreview?.(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 font-medium text-ink">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
        {required ? (
          <span className="text-ink-60">required</span>
        ) : (
          <span className="text-ink-60">optional</span>
        )}
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          accept_(e.dataTransfer.files?.[0]);
        }}
        className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
          isDragging ? 'border-brand bg-ink-06' : 'border-ink-12 bg-ink-06'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => accept_(e.target.files?.[0])}
          className="sr-only"
          aria-label={label}
        />

        {file ? (
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="flex min-w-0 items-center gap-2.5">
              <Icon className="h-5 w-5 shrink-0 text-brand" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                <p className="font-mono text-[11px] text-ink-60">
                  {formatSize(file.size)} · {file.type || 'unknown type'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-full border border-ink-12 px-2.5 py-1 text-[11px] text-ink transition-colors hover:bg-ink-12"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={clear}
                aria-label={`Remove ${file.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-60 transition-colors hover:bg-ink-12 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-1.5"
          >
            <CloudArrowUp className="mx-auto h-6 w-6 text-brand" />
            <span className="text-sm font-medium text-ink">
              {isDragging ? 'Drop the file here' : `${cta} or drag it here`}
            </span>
            {hint && <span className="text-[11px] text-ink-60">{hint}</span>}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-[11px] text-ink-60">{error}</p>}
    </div>
  );
};

export default FileDropzone;
