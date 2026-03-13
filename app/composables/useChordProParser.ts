import type { ParsedSong, SongSegment } from '~/types/chordpro';

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_INDEX: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  'E#': 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11
};

const CHORD_ROOT_PATTERN = /(^|\/)([A-G](?:#|b)?)/g;

function normalizeSemitoneOffset(offset: number): number {
  if (!Number.isFinite(offset)) {
    return 0;
  }

  return ((Math.trunc(offset) % 12) + 12) % 12;
}

function inferFlatPreference(noteOrKey: string, fallback: boolean): boolean {
  if (noteOrKey.includes('b')) {
    return true;
  }

  if (noteOrKey.includes('#')) {
    return false;
  }

  return fallback;
}

function transposeNote(note: string, semitoneOffset: number, preferFlats: boolean): string {
  const noteIndex = NOTE_INDEX[note];

  if (noteIndex === undefined) {
    return note;
  }

  const transposedIndex = (noteIndex + semitoneOffset) % 12;
  const transposed = (preferFlats ? FLAT_NOTES : SHARP_NOTES)[transposedIndex];

  return transposed ?? note;
}

function transposeChordSymbol(chord: string, semitoneOffset: number, preferFlats = false): string {
  if (!chord) {
    return chord;
  }

  const normalizedOffset = normalizeSemitoneOffset(semitoneOffset);

  if (normalizedOffset === 0) {
    return chord;
  }

  return chord.replace(CHORD_ROOT_PATTERN, (_, prefix: string, note: string) => {
    const localFlatPreference = inferFlatPreference(note, preferFlats);
    return `${prefix}${transposeNote(note, normalizedOffset, localFlatPreference)}`;
  });
}

function parseLyricSegments(line: string): SongSegment[] {
  const segments: SongSegment[] = [];
  const chordPattern = /\[([^\]]+)\]/g;

  let lastIndex = 0;
  let pendingChord = '';
  let match: RegExpExecArray | null;

  while ((match = chordPattern.exec(line)) !== null) {
    const lyricChunk = line.slice(lastIndex, match.index);

    if (lyricChunk.length > 0 || pendingChord) {
      segments.push({
        chord: pendingChord,
        lyric: lyricChunk
      });
    }

    pendingChord = (match[1] ?? '').trim();
    lastIndex = chordPattern.lastIndex;
  }

  const tail = line.slice(lastIndex);

  if (tail.length > 0 || pendingChord || segments.length === 0) {
    segments.push({
      chord: pendingChord,
      lyric: tail
    });
  }

  return segments;
}

function parseChordPro(input: string): ParsedSong {
  const directivePattern = /^\{([a-zA-Z][\w-]*)\s*:\s*(.*?)\s*\}$/;
  const rows = input.replace(/\r\n/g, '\n').split('\n');

  const parsed: ParsedSong = {
    meta: {
      title: '',
      artist: '',
      key: '',
      tempo: ''
    },
    lines: []
  };

  let lineId = 0;

  for (const row of rows) {
    const trimmed = row.trim();

    if (!trimmed) {
      parsed.lines.push({ type: 'blank', id: lineId++ });
      continue;
    }

    const directive = trimmed.match(directivePattern);

    if (directive) {
      const rawName = directive[1];
      const rawValue = directive[2];

      if (!rawName) {
        continue;
      }

      const name = rawName.toLowerCase();
      const value = (rawValue ?? '').trim();

      if (name === 'title') {
        parsed.meta.title = value;
        continue;
      }

      if (name === 'artist') {
        parsed.meta.artist = value;
        continue;
      }

      if (name === 'key') {
        parsed.meta.key = value;
        continue;
      }

      if (name === 'tempo') {
        parsed.meta.tempo = value;
        continue;
      }

      if (name === 'comment') {
        parsed.lines.push({ type: 'comment', id: lineId++, text: value });
      }

      continue;
    }

    parsed.lines.push({
      type: 'lyric',
      id: lineId++,
      segments: parseLyricSegments(row)
    });
  }

  return parsed;
}

function countLyricLines(song: ParsedSong): number {
  return song.lines.filter((line) => line.type === 'lyric').length;
}

function transposeParsedSong(song: ParsedSong, semitoneOffset: number): ParsedSong {
  const normalizedOffset = normalizeSemitoneOffset(semitoneOffset);

  if (normalizedOffset === 0) {
    return song;
  }

  const preferFlats = inferFlatPreference(song.meta.key, false);

  return {
    meta: {
      ...song.meta,
      key: transposeChordSymbol(song.meta.key, normalizedOffset, preferFlats)
    },
    lines: song.lines.map((line) => {
      if (line.type !== 'lyric') {
        return line;
      }

      return {
        ...line,
        segments: line.segments.map((segment) => ({
          ...segment,
          chord: transposeChordSymbol(segment.chord, normalizedOffset, preferFlats)
        }))
      };
    })
  };
}

export function useChordProParser() {
  return {
    parseChordPro,
    countLyricLines,
    transposeParsedSong
  };
}
