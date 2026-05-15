import { create } from 'zustand';

export interface SavedSong {
  id: string;
  fileName: string;
  timestamp: number;
}

interface SongLibraryState {
  songs: SavedSong[];
  addSong: (fileName: string, fileBlob: Blob) => Promise<void>;
  removeSong: (id: string) => Promise<void>;
  getSongBlob: (id: string) => Promise<Blob | null>;
  loadSongs: () => Promise<void>;
}

let db: IDBDatabase | null = null;

const initDB = async (): Promise<IDBDatabase> => {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('piano-hero-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains('songs')) {
        database.createObjectStore('songs', { keyPath: 'id' });
      }
    };
  });
};

export const useSongLibraryStore = create<SongLibraryState>((set) => ({
  songs: [],

  addSong: async (fileName, fileBlob) => {
    const database = await initDB();
    const id = Date.now().toString();
    const song: SavedSong = { id, fileName, timestamp: Date.now() };

    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('songs', 'readwrite');
      const store = tx.objectStore('songs');
      const songData = { ...song, fileBlob };
      store.put(songData);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    set((state) => ({
      songs: [...state.songs, song].sort((a, b) => b.timestamp - a.timestamp),
    }));
  },

  removeSong: async (id) => {
    const database = await initDB();

    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('songs', 'readwrite');
      const store = tx.objectStore('songs');
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    set((state) => ({
      songs: state.songs.filter((s) => s.id !== id),
    }));
  },

  getSongBlob: async (id) => {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const tx = database.transaction('songs', 'readonly');
      const store = tx.objectStore('songs');
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(request.result?.fileBlob ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  },

  loadSongs: async () => {
    const database = await initDB();

    return new Promise<void>((resolve, reject) => {
      const tx = database.transaction('songs', 'readonly');
      const store = tx.objectStore('songs');
      const request = store.getAll();

      request.onsuccess = () => {
        const songs: SavedSong[] = request.result
          .map(({ id, fileName, timestamp }: any) => ({ id, fileName, timestamp }))
          .sort((a, b) => b.timestamp - a.timestamp);
        set({ songs });
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  },
}));
