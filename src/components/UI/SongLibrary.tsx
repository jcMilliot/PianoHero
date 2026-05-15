import { useEffect, useRef, useState } from 'react';
import { useSongLibraryStore } from '../../stores/songLibraryStore';

const SEARCH_SITES = [
  { label: 'BitMidi', url: (q: string) => `https://bitmidi.com/search?q=${encodeURIComponent(q)}` },
  { label: 'Mutopia', url: (q: string) => `https://www.mutopiaproject.org/cgibin/make-table.cgi?searchingfor=${encodeURIComponent(q)}` },
];

interface SongLibraryProps {
  onSelectSong: (fileName: string, fileBlob: Blob) => void;
}

export const SongLibrary = ({ onSelectSong }: SongLibraryProps) => {
  const songs = useSongLibraryStore((s) => s.songs);
  const addSong = useSongLibraryStore((s) => s.addSong);
  const removeSong = useSongLibraryStore((s) => s.removeSong);
  const getSongBlob = useSongLibraryStore((s) => s.getSongBlob);
  const loadSongs = useSongLibraryStore((s) => s.loadSongs);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSongs().then(() => setLoading(false));
  }, [loadSongs]);

  const handleSelectSong = async (id: string, fileName: string) => {
    const blob = await getSongBlob(id);
    if (blob) {
      onSelectSong(fileName, blob);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await addSong(file.name, file);
      onSelectSong(file.name, file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeSong(id);
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-bg-border bg-bg-base">
      <div className="border-b border-bg-border px-4 py-3">
        <h2 className="font-display text-sm tracking-wider text-hand-right">BIBLIOTHÈQUE</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-xs text-key-white/40">Chargement…</p>
        ) : songs.length === 0 ? (
          <p className="p-4 text-xs text-key-white/40">Aucune musique sauvegardée</p>
        ) : (
          <ul className="space-y-0.5 p-2">
            {songs.map((song) => (
              <li key={song.id}>
                <button
                  type="button"
                  onClick={() => handleSelectSong(song.id, song.fileName)}
                  className="group flex w-full items-center gap-2 rounded px-3 py-2 text-left
                             hover:bg-bg-surface transition"
                >
                  <span className="flex-1 truncate text-xs text-key-white/70 group-hover:text-key-white">
                    {song.fileName.replace(/\.midi?$/, '')}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDelete(song.id, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleDelete(song.id, e as any);
                    }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-[10px]
                               text-feedback-miss/50 hover:text-feedback-miss transition"
                    title="Supprimer"
                  >
                    ✕
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-bg-border p-3 space-y-2">
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-key-white/30">Rechercher en ligne</p>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                window.open(SEARCH_SITES[0].url(searchQuery.trim()), '_blank');
              }
            }}
            placeholder="Titre ou compositeur…"
            className="w-full rounded-md border border-bg-border bg-bg-base px-3 py-1.5 text-xs
                       text-key-white placeholder-key-white/30 outline-none
                       focus:border-hand-right/60 transition"
          />
          <div className="flex gap-1.5">
            {SEARCH_SITES.map((site) => (
              <button
                key={site.label}
                type="button"
                disabled={!searchQuery.trim()}
                onClick={() => window.open(site.url(searchQuery.trim()), '_blank')}
                className="flex-1 rounded border border-bg-border px-2 py-1 text-[10px]
                           text-key-white/50 hover:border-hand-right/40 hover:text-hand-right
                           transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {site.label} ↗
              </button>
            ))}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mid,.midi"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-lg border border-hand-right/40 px-4 py-2 text-xs font-display
                     text-hand-right hover:bg-hand-right/10 transition"
        >
          + Ajouter une musique
        </button>
      </div>
    </aside>
  );
};
