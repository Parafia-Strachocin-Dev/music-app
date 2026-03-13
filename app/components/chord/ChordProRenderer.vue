<script setup lang="ts">
import type { ParsedSong } from '~/types/chordpro';

const props = withDefaults(
  defineProps<{
    song: ParsedSong;
    showMeta?: boolean;
  }>(),
  {
    showMeta: true
  }
);

const { countLyricLines } = useChordProParser();

const lyricLineCount = computed(() => countLyricLines(props.song));
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

        <div v-else-if="line.type === 'lyric'" class="min-h-9 whitespace-nowrap">
          <span
            v-for="(segment, segmentIndex) in line.segments"
            :key="`${line.id}-${segmentIndex}`"
            class="inline-grid min-w-[1ch] grid-rows-[1.1rem_auto] align-top"
          >
            <span class="whitespace-pre font-mono text-xs font-semibold text-emerald-700">
              {{ segment.chord || ' ' }}
            </span>
            <span class="whitespace-pre font-serif text-[1.05rem] leading-6 text-stone-900">
              {{ segment.lyric || ' ' }}
            </span>
          </span>
        </div>

        <div v-else class="h-2" aria-hidden="true" />
      </template>
    </div>
  </section>
</template>
