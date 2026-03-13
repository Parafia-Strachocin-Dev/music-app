import type { ParsedSong, SongSegment } from '~/types/chordpro';

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

export function useChordProParser() {
  return {
    parseChordPro,
    countLyricLines
  };
}
