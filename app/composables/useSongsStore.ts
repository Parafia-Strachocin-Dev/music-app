import { songs as songSeeds } from '~/data/songs';
import type { SongRecord } from '~/types/chordpro';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';

export interface SongInput {
  title: string;
  artist: string;
  key: string;
  tempo: number;
  tags: string[];
  ownerId: string;
  createdAt: string;
  chordPro: string;
}

function cloneSong(song: SongRecord): SongRecord {
  return {
    ...song,
    tags: [...song.tags]
  };
}

function sortSongsByCreatedAtDesc(items: SongRecord[]): SongRecord[] {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function normalizeTags(tags: string[]): string[] {
  const cleaned = tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return [...new Set(cleaned)];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function normalizeTempo(value: unknown): number {
  return Math.max(1, Math.round(Number(value) || 0));
}

function normalizeDate(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  return new Date().toISOString().slice(0, 10);
}

function buildUniqueSongId(base: string, existingIds: Set<string>): string {
  if (!existingIds.has(base)) {
    return base;
  }

  let counter = 2;

  while (existingIds.has(`${base}-${counter}`)) {
    counter += 1;
  }

  return `${base}-${counter}`;
}

function toSongRecord(snapshot: QueryDocumentSnapshot<DocumentData>): SongRecord {
  const data = snapshot.data();

  const tags = Array.isArray(data.tags)
    ? normalizeTags(data.tags.filter((tag): tag is string => typeof tag === 'string'))
    : [];

  return {
    id: snapshot.id,
    title: typeof data.title === 'string' ? data.title.trim() : snapshot.id,
    artist: typeof data.artist === 'string' ? data.artist.trim() : 'Unknown Artist',
    key: typeof data.key === 'string' ? data.key.trim() : 'C',
    tempo: normalizeTempo(data.tempo),
    tags,
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : '',
    createdAt:
      typeof data.createdAt === 'string' ? normalizeDate(data.createdAt) : new Date().toISOString().slice(0, 10),
    chordPro: typeof data.chordPro === 'string' ? data.chordPro : ''
  };
}

function toSongDocument(song: SongRecord) {
  return {
    title: song.title,
    artist: song.artist,
    key: song.key,
    tempo: song.tempo,
    tags: song.tags,
    ownerId: song.ownerId,
    createdAt: song.createdAt,
    chordPro: song.chordPro
  };
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export function useSongsStore() {
  const firestoreDb = import.meta.client ? useFirestore() : null;
  const songs = useState<SongRecord[]>('songs-store', () => sortSongsByCreatedAtDesc(songSeeds.map(cloneSong)));
  const isLoading = useState<boolean>('songs-store-loading', () => false);
  const hasLoaded = useState<boolean>('songs-store-loaded', () => false);
  const isFirestoreConnected = useState<boolean>('songs-store-firestore-connected', () => false);
  const syncError = useState<string | null>('songs-store-sync-error', () => null);

  async function loadSongs(options: { force?: boolean } = {}): Promise<void> {
    const shouldForce = options.force ?? false;

    if (isLoading.value) {
      return;
    }

    if (!shouldForce && hasLoaded.value) {
      return;
    }

    if (!firestoreDb) {
      hasLoaded.value = true;
      isFirestoreConnected.value = false;
      return;
    }

    isLoading.value = true;

    try {
      const songsCollection = collection(firestoreDb, 'songs');
      const songsSnapshot = await getDocs(query(songsCollection, orderBy('createdAt', 'desc')));

      if (songsSnapshot.empty) {
        const seeds = sortSongsByCreatedAtDesc(songSeeds.map(cloneSong));

        await Promise.all(
          seeds.map((song) => {
            return setDoc(doc(firestoreDb, 'songs', song.id), toSongDocument(song));
          })
        );

        songs.value = seeds;
      } else {
        songs.value = songsSnapshot.docs.map(toSongRecord);
      }

      isFirestoreConnected.value = true;
      syncError.value = null;
    } catch (error) {
      isFirestoreConnected.value = false;
      syncError.value = toErrorMessage(error, 'Unable to sync songs from Firestore.');
    } finally {
      isLoading.value = false;
      hasLoaded.value = true;
    }
  }

  function getSongById(id: string): SongRecord | undefined {
    return songs.value.find((song) => song.id === id);
  }

  async function createSong(input: SongInput): Promise<SongRecord> {
    const existingIds = new Set(songs.value.map((song) => song.id));
    const baseId = slugify(input.title) || `song-${songs.value.length + 1}`;
    const previousSongs = [...songs.value];

    const newSong: SongRecord = {
      id: buildUniqueSongId(baseId, existingIds),
      title: input.title.trim(),
      artist: input.artist.trim(),
      key: input.key.trim(),
      tempo: normalizeTempo(input.tempo),
      tags: normalizeTags(input.tags),
      ownerId: input.ownerId,
      createdAt: normalizeDate(input.createdAt),
      chordPro: input.chordPro
    };

    songs.value = [newSong, ...songs.value];

    if (!firestoreDb) {
      return newSong;
    }

    try {
      await setDoc(doc(firestoreDb, 'songs', newSong.id), toSongDocument(newSong));
      isFirestoreConnected.value = true;
      syncError.value = null;
    } catch (error) {
      songs.value = previousSongs;
      isFirestoreConnected.value = false;

      const message = toErrorMessage(error, 'Unable to create song in Firestore.');
      syncError.value = message;
      throw new Error(message);
    }

    return newSong;
  }

  async function updateSong(id: string, input: SongInput): Promise<SongRecord | null> {
    const index = songs.value.findIndex((song) => song.id === id);

    if (index === -1) {
      return null;
    }

    const previousSongs = [...songs.value];

    const current = songs.value[index];

    if (!current) {
      return null;
    }

    const updated: SongRecord = {
      ...current,
      title: input.title.trim(),
      artist: input.artist.trim(),
      key: input.key.trim(),
      tempo: normalizeTempo(input.tempo),
      tags: normalizeTags(input.tags),
      ownerId: input.ownerId,
      createdAt: normalizeDate(input.createdAt),
      chordPro: input.chordPro
    };

    songs.value = songs.value.map((song, currentIndex) => {
      if (currentIndex === index) {
        return updated;
      }

      return song;
    });

    if (!firestoreDb) {
      return updated;
    }

    try {
      await setDoc(doc(firestoreDb, 'songs', id), toSongDocument(updated));
      isFirestoreConnected.value = true;
      syncError.value = null;
    } catch (error) {
      songs.value = previousSongs;
      isFirestoreConnected.value = false;

      const message = toErrorMessage(error, 'Unable to update song in Firestore.');
      syncError.value = message;
      throw new Error(message);
    }

    return updated;
  }

  if (import.meta.client && !hasLoaded.value && !isLoading.value) {
    void loadSongs();
  }

  return {
    songs,
    isLoading,
    isFirestoreConnected,
    syncError,
    loadSongs,
    getSongById,
    createSong,
    updateSong
  };
}
