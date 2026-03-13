export interface SongSegment {
  chord: string;
  lyric: string;
}

export type SongLine =
  | { type: 'lyric'; id: number; segments: SongSegment[] }
  | { type: 'comment'; id: number; text: string }
  | { type: 'blank'; id: number };

export interface SongMetadata {
  title: string;
  artist: string;
  key: string;
  tempo: string;
}

export interface ParsedSong {
  meta: SongMetadata;
  lines: SongLine[];
}

export interface SongRecord {
  id: string;
  title: string;
  artist: string;
  key: string;
  tempo: number;
  tags: string[];
  ownerId: string;
  createdAt: string;
  chordPro: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  instrument: string;
  location: string;
  bio: string;
}