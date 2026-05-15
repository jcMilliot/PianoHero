import { useCallback, useRef, useState } from 'react';

interface Props {
  onFile: (file: File) => void;
  parsing: boolean;
}

export const SongImporter = ({ onFile, parsing }: Props) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={`
        flex flex-col items-center justify-center gap-4
        rounded-2xl border-2 border-dashed p-12
        transition-colors
        ${dragActive ? 'border-hand-right bg-hand-right/10' : 'border-bg-border bg-bg-surface'}
      `}
    >
      <p className="font-display text-2xl text-key-white">
        {parsing ? 'Parsing…' : 'Dépose un fichier MIDI ici'}
      </p>
      <p className="text-sm text-key-white/60">ou</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg bg-hand-right/20 px-6 py-2 font-ui text-hand-right
                   hover:bg-hand-right/30 transition-colors"
      >
        Parcourir
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};
