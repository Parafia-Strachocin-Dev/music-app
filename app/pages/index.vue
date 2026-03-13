<script setup lang="ts">
interface SongSegment {
  chord: string;
  lyric: string;
}

type SongLine =
  | { type: 'lyric'; id: number; segments: SongSegment[] }
  | { type: 'comment'; id: number; text: string }
  | { type: 'blank'; id: number };

interface ParsedSong {
  meta: {
    title: string;
    artist: string;
    key: string;
    tempo: string;
  };
  lines: SongLine[];
}

const EXAMPLE_SONG = `{title: Wlazł kotek na płotek}
{artist: Tradycyjna}
{key: C}
{tempo: 120}

{comment: Zwrotka 1}
[C]Wlazł kotek na [G]płotek i [C]mruga,
[C]ładna to pios[G]enka, nie[C]długa.
[C]Nie długa, nie [G]krótka, lecz [C]w sam raz,
[C]zaśpiewaj ko[G]teczku jesz[C]cze raz.

{comment: Zwrotka 2}
[C]Wlazł kocurek [G]na murek i [C]stęka,
[C]że go bardzo [G]boli ta [C]ręka.
[C]Coś tam sobie [G]mruczy pod [C]nosem,
[C]cienkim, pisk[G]liwym swym [C]głosem.`;

const source = ref(EXAMPLE_SONG);

const parsedSong = computed(() => parseChordPro(source.value));

const lyricLineCount = computed(
  () => parsedSong.value.lines.filter((line) => line.type === 'lyric').length
);

function loadExample() {
  source.value = EXAMPLE_SONG;
}

function clearSource() {
  source.value = '';
}

function parseChordPro(input: string): ParsedSong {
  const directivePattern = /^\{([a-zA-Z][\w-]*)\s*:\s*(.*?)\s*\}$/;
  const lines = input.replace(/\r\n/g, '\n').split('\n');

  const song: ParsedSong = {
    meta: {
      title: '',
      artist: '',
      key: '',
      tempo: ''
    },
    lines: []
  };

  let lineId = 0;

  for (const originalLine of lines) {
    const trimmed = originalLine.trim();

    if (!trimmed) {
      song.lines.push({ type: 'blank', id: lineId++ });
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
        song.meta.title = value;
        continue;
      }

      if (name === 'artist') {
        song.meta.artist = value;
        continue;
      }

      if (name === 'key') {
        song.meta.key = value;
        continue;
      }

      if (name === 'tempo') {
        song.meta.tempo = value;
        continue;
      }

      if (name === 'comment') {
        song.lines.push({ type: 'comment', id: lineId++, text: value });
      }

      continue;
    }

    song.lines.push({
      type: 'lyric',
      id: lineId++,
      segments: parseLyricSegments(originalLine)
    });
  }

  return song;
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
</script>

<template>
  <main class="chordpro-app">
    <section class="hero">
      <p class="eyebrow">ChordPro Viewer</p>
      <h1>Render chords exactly where singers need them.</h1>
      <p class="hero-text">
        Paste any ChordPro song and preview it instantly with chords above lyrics,
        section comments, and song metadata.
      </p>
    </section>

    <section class="workspace-grid">
      <UCard class="workspace-card" variant="subtle">
        <template #header>
          <div class="panel-header">
            <div>
              <h2>ChordPro Source</h2>
              <p class="panel-subtitle">Edit your raw song text here.</p>
            </div>

            <div class="actions">
              <UButton
                icon="i-lucide-refresh-cw"
                color="neutral"
                variant="outline"
                @click="loadExample"
              >
                Load Example
              </UButton>
              <UButton
                icon="i-lucide-eraser"
                color="neutral"
                variant="soft"
                @click="clearSource"
              >
                Clear
              </UButton>
            </div>
          </div>
        </template>

        <UTextarea
          v-model="source"
          class="source-input"
          :rows="18"
          :maxrows="40"
          autoresize
          color="neutral"
          variant="outline"
          placeholder="Paste a ChordPro song here..."
        />
      </UCard>

      <UCard class="workspace-card" variant="soft">
        <template #header>
          <div class="preview-header">
            <div>
              <h2 class="song-title">{{ parsedSong.meta.title || 'Untitled Song' }}</h2>
              <p v-if="parsedSong.meta.artist" class="song-artist">
                {{ parsedSong.meta.artist }}
              </p>
            </div>

            <div class="meta-row">
              <UBadge v-if="parsedSong.meta.key" color="secondary" variant="subtle">
                Key: {{ parsedSong.meta.key }}
              </UBadge>
              <UBadge v-if="parsedSong.meta.tempo" color="primary" variant="subtle">
                Tempo: {{ parsedSong.meta.tempo }} BPM
              </UBadge>
              <UBadge color="neutral" variant="outline">
                {{ lyricLineCount }} lyric lines
              </UBadge>
            </div>
          </div>
        </template>

        <div class="song-sheet">
          <template v-for="line in parsedSong.lines" :key="line.id">
            <p v-if="line.type === 'comment'" class="section-label">
              {{ line.text }}
            </p>

            <div v-else-if="line.type === 'lyric'" class="song-line">
              <span
                v-for="(segment, segmentIndex) in line.segments"
                :key="`${line.id}-${segmentIndex}`"
                class="song-segment"
              >
                <span class="segment-chord">{{ segment.chord || ' ' }}</span>
                <span class="segment-lyric">{{ segment.lyric || ' ' }}</span>
              </span>
            </div>

            <div v-else class="line-gap" aria-hidden="true" />
          </template>
        </div>
      </UCard>
    </section>
  </main>
</template>

<style scoped>
.chordpro-app {
  --base-deep: #0e1623;
  --base-mid: #152640;
  --base-sea: #0f3d37;
  --glow-gold: #f2a74b;
  --glow-mint: #30c79b;
  --sheet-bg: #f8f2e8;
  --sheet-text: #1b1409;

  min-height: 100vh;
  padding: clamp(1rem, 2.2vw, 2rem);
  background:
    radial-gradient(circle at 85% 10%, rgb(242 167 75 / 24%), transparent 33%),
    radial-gradient(circle at 10% 15%, rgb(48 199 155 / 24%), transparent 38%),
    linear-gradient(140deg, var(--base-deep), var(--base-mid) 50%, var(--base-sea));
  color: #f8f5ef;
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', sans-serif;
}

.hero {
  margin: 0 auto;
  max-width: 1000px;
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--glow-mint) 80%, white);
}

.hero h1 {
  margin: 0.5rem 0 0;
  font-size: clamp(1.8rem, 4vw, 3rem);
  line-height: 1.1;
  max-width: 20ch;
  font-family: 'Rockwell', 'Cambria', 'Georgia', serif;
}

.hero-text {
  margin-top: 0.8rem;
  max-width: 62ch;
  color: rgb(248 245 239 / 82%);
}

.workspace-grid {
  margin: 1.3rem auto 0;
  max-width: 1240px;
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

.workspace-card {
  border: 1px solid rgb(255 255 255 / 10%);
  backdrop-filter: blur(4px);
  box-shadow: 0 14px 24px rgb(0 0 0 / 28%);
}

.panel-header,
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.panel-header h2,
.preview-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-family: 'Rockwell', 'Cambria', 'Georgia', serif;
}

.panel-subtitle {
  margin: 0.2rem 0 0;
  color: rgb(248 245 239 / 76%);
  font-size: 0.92rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.source-input {
  width: 100%;
}

.source-input :deep(textarea) {
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.45;
  letter-spacing: 0.01em;
}

.song-title {
  margin: 0;
  font-size: clamp(1.2rem, 2.5vw, 1.9rem);
  color: color-mix(in srgb, var(--glow-gold) 70%, white);
}

.song-artist {
  margin: 0.24rem 0 0;
  color: rgb(248 245 239 / 80%);
}

.meta-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.song-sheet {
  margin-top: 0.3rem;
  border-radius: 0.9rem;
  padding: 1rem;
  overflow-x: auto;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--sheet-bg) 96%, white), var(--sheet-bg));
  color: var(--sheet-text);
  border: 1px solid rgb(0 0 0 / 8%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 35%);
}

.section-label {
  margin: 0.8rem 0 0.3rem;
  color: #754c12;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.song-line {
  white-space: nowrap;
  min-height: 2.2rem;
}

.song-segment {
  display: inline-grid;
  grid-template-rows: 1.05rem auto;
  min-width: 1ch;
}

.segment-chord {
  color: #087458;
  font-size: 0.83rem;
  line-height: 1;
  font-weight: 700;
  white-space: pre;
  font-family: 'Courier New', Courier, monospace;
}

.segment-lyric {
  color: var(--sheet-text);
  white-space: pre;
  font-size: 1.08rem;
  line-height: 1.35;
  font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
}

.line-gap {
  height: 0.55rem;
}

@media (min-width: 1100px) {
  .workspace-grid {
    grid-template-columns: minmax(330px, 0.92fr) minmax(400px, 1.08fr);
  }
}
</style>
