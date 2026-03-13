<script setup lang="ts">
import type { ParsedSong } from '~/types/chordpro';

const props = withDefaults(
  defineProps<{
    song: ParsedSong;
    showMeta?: boolean;
    lyricFontSizePx?: number;
    chordFontSizePx?: number;
  }>(),
  {
    showMeta: true,
    lyricFontSizePx: 17,
    chordFontSizePx: 12
  }
);

const { countLyricLines } = useChordProParser();

const lyricLineCount = computed(() => countLyricLines(props.song));

const LYRIC_FONT_MIN = 12;
const LYRIC_FONT_MAX = 36;
const CHORD_FONT_MIN = 10;
const CHORD_FONT_MAX = 28;

function clampFontSize(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

const lyricFontSize = computed(() => {
  return clampFontSize(props.lyricFontSizePx, LYRIC_FONT_MIN, LYRIC_FONT_MAX);
});

const chordFontSize = computed(() => {
  return clampFontSize(props.chordFontSizePx, CHORD_FONT_MIN, CHORD_FONT_MAX);
});

const lyricLineHeight = computed(() => {
  return Math.round(lyricFontSize.value * 1.45);
});

const chordLineHeight = computed(() => {
  return Math.round(chordFontSize.value * 1.35);
});

const lyricRowStyle = computed(() => {
  return {
    minHeight: `${lyricLineHeight.value + chordLineHeight.value}px`
  };
});

const segmentStyle = computed(() => {
  return {
    gridTemplateRows: `${chordLineHeight.value}px auto`
  };
});

const chordStyle = computed(() => {
  return {
    fontSize: `${chordFontSize.value}px`,
    lineHeight: `${chordLineHeight.value}px`
  };
});

const lyricStyle = computed(() => {
  return {
    fontSize: `${lyricFontSize.value}px`,
    lineHeight: `${lyricLineHeight.value}px`
  };
});
</script>

<template>
  <section class="space-y-4">
    <div v-if="showMeta" class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <h2 class="text-2xl font-semibold tracking-tight text-zinc-100">
          {{ song.meta.title || 'Untitled Song' }}
        </h2>
        <p v-if="song.meta.artist" class="text-sm text-zinc-300">
          {{ song.meta.artist }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UBadge v-if="song.meta.key" color="secondary" variant="subtle">
          Key: {{ song.meta.key }}
        </UBadge>
        <UBadge v-if="song.meta.tempo" color="primary" variant="subtle">
          Tempo: {{ song.meta.tempo }} BPM
        </UBadge>
        <UBadge color="neutral" variant="outline">
          {{ lyricLineCount }} lyric lines
        </UBadge>
      </div>
    </div>

    <div
      class="overflow-x-auto rounded-2xl border border-amber-200/70 bg-amber-50/95 p-4 shadow-inner shadow-amber-100"
    >
      <template v-for="line in song.lines" :key="line.id">
        <p
          v-if="line.type === 'comment'"
          class="my-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700"
        >
          {{ line.text }}
        </p>

        <div v-else-if="line.type === 'lyric'" class="whitespace-nowrap" :style="lyricRowStyle">
          <span
            v-for="(segment, segmentIndex) in line.segments"
            :key="`${line.id}-${segmentIndex}`"
            class="inline-grid min-w-[1ch] align-top"
            :style="segmentStyle"
          >
            <span class="whitespace-pre font-mono font-semibold text-emerald-700" :style="chordStyle">
              {{ segment.chord || ' ' }}
            </span>
            <span class="whitespace-pre font-serif text-stone-900" :style="lyricStyle">
              {{ segment.lyric || ' ' }}
            </span>
          </span>
        </div>

        <div v-else class="h-2" aria-hidden="true" />
      </template>
    </div>
  </section>
</template>
