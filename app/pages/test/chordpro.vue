<script setup lang="ts">
const { songs, getSongById } = useSongsStore();

const { parseChordPro } = useChordProParser();

const selectedSongId = ref('');
const source = ref('');

const parsedSong = computed(() => parseChordPro(source.value));

watch(
  () => songs.value,
  (list) => {
    if (list.length === 0) {
      selectedSongId.value = '';
      source.value = '';
      return;
    }

    if (!selectedSongId.value) {
      const firstSong = list[0];

      if (!firstSong) {
        return;
      }

      selectedSongId.value = firstSong.id;
      source.value = firstSong.chordPro;
    }
  },
  { immediate: true }
);

function loadSong(songId: string): void {
  const selected = getSongById(songId);

  if (!selected) {
    return;
  }

  selectedSongId.value = selected.id;
  source.value = selected.chordPro;
}

function clearSource(): void {
  selectedSongId.value = '';
  source.value = '';
}
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
        Test Lab
      </p>
      <h1 class="text-3xl font-semibold tracking-tight text-zinc-50">ChordPro Source Playground</h1>
      <p class="max-w-3xl text-sm text-zinc-300">
        Use this page to test parsing behavior with songs loaded from your current library.
      </p>
    </header>

    <UCard class="border border-zinc-800 bg-zinc-900/70" variant="subtle">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-lg font-semibold text-zinc-100">Load Library Songs</h2>
          <UButton color="neutral" variant="outline" icon="i-lucide-eraser" @click="clearSource">
            Clear
          </UButton>
        </div>
      </template>

      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="song in songs"
          :key="song.id"
          :color="selectedSongId === song.id ? 'primary' : 'neutral'"
          :variant="selectedSongId === song.id ? 'solid' : 'outline'"
          size="sm"
          @click="loadSong(song.id)"
        >
          {{ song.title }}
        </UButton>
      </div>
    </UCard>

    <div class="grid gap-5 xl:grid-cols-[minmax(300px,0.9fr)_minmax(420px,1.1fr)]">
      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="subtle">
        <template #header>
          <h2 class="text-lg font-semibold text-zinc-100">ChordPro Source</h2>
        </template>

        <UTextarea
          v-model="source"
          :rows="20"
          :maxrows="40"
          autoresize
          color="neutral"
          variant="outline"
          placeholder="Paste ChordPro source here"
          class="w-full"
        />
      </UCard>

      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="soft">
        <template #header>
          <h2 class="text-lg font-semibold text-zinc-100">Rendered Preview</h2>
        </template>

        <ChordProRenderer :song="parsedSong" />
      </UCard>
    </div>
  </section>
</template>
