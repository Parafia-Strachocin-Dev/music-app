import { songs as songSeeds } from '~/data/songs';
import type { SongRecord } from '~/types/chordpro';

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

export function useSongsStore() {
  const songs = useState<SongRecord[]>('songs-store', () => songSeeds.map(cloneSong));

  function getSongById(id: string): SongRecord | undefined {
    return songs.value.find((song) => song.id === id);
  }

  function createSong(input: SongInput): SongRecord {
    const existingIds = new Set(songs.value.map((song) => song.id));
    const baseId = slugify(input.title) || `song-${songs.value.length + 1}`;

    const newSong: SongRecord = {
      id: buildUniqueSongId(baseId, existingIds),
      title: input.title.trim(),
      artist: input.artist.trim(),
      key: input.key.trim(),
      tempo: Math.max(1, Math.round(input.tempo)),
      tags: normalizeTags(input.tags),
      ownerId: input.ownerId,
      createdAt: input.createdAt,
      chordPro: input.chordPro
    };

    songs.value = [newSong, ...songs.value];
    return newSong;
  }

  function updateSong(id: string, input: SongInput): SongRecord | null {
    const index = songs.value.findIndex((song) => song.id === id);

    if (index === -1) {
      return null;
    }

    const current = songs.value[index];

    if (!current) {
      return null;
    }

    const updated: SongRecord = {
      ...current,
      title: input.title.trim(),
      artist: input.artist.trim(),
      key: input.key.trim(),
      tempo: Math.max(1, Math.round(input.tempo)),
      tags: normalizeTags(input.tags),
      ownerId: input.ownerId,
      createdAt: input.createdAt,
      chordPro: input.chordPro
    };

    songs.value = songs.value.map((song, currentIndex) => {
      if (currentIndex === index) {
        return updated;
      }

      return song;
    });

    return updated;
  }

  return {
    songs,
    getSongById,
    createSong,
    updateSong
  };
}
