<script setup lang="ts">
const { getSongById, isLoading } = useSongsStore();
const { getUserById } = useUsersStore();

const route = useRoute();
const { parseChordPro, transposeParsedSong } = useChordProParser();

const songId = computed(() => String(route.params.id ?? ''));
const song = computed(() => getSongById(songId.value));
const owner = computed(() => (song.value ? getUserById(song.value.ownerId) : undefined));
const transposeSteps = ref(0);

const parsedSong = computed(() => (song.value ? parseChordPro(song.value.chordPro) : null));
const renderedSong = computed(() =>
  parsedSong.value ? transposeParsedSong(parsedSong.value, transposeSteps.value) : null
);

const transposeSummary = computed(() => {
  if (transposeSteps.value === 0) {
    return 'Original key';
  }

  const sign = transposeSteps.value > 0 ? '+' : '';
  const unit = Math.abs(transposeSteps.value) === 1 ? 'semitone' : 'semitones';

  return `${sign}${transposeSteps.value} ${unit}`;
});

watch(songId, () => {
  transposeSteps.value = 0;
});

function shiftTranspose(delta: number): void {
  const next = transposeSteps.value + delta;

  if (next > 11) {
    transposeSteps.value = -11;
    return;
  }

  if (next < -11) {
    transposeSteps.value = 11;
    return;
  }

  transposeSteps.value = next;
}

function resetTranspose(): void {
  transposeSteps.value = 0;
}
</script>

<template>
  <section class="space-y-6">
    <div v-if="isLoading && !song" class="space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-50">Loading song...</h1>
      <p class="text-sm text-zinc-300">
        Reading song data from Firestore.
      </p>
      <UButton to="/songs" color="neutral" variant="outline" icon="i-lucide-arrow-left">
        Back To Songs
      </UButton>
    </div>

    <div v-else-if="!song || !renderedSong" class="space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-50">Song not found</h1>
      <p class="text-sm text-zinc-300">
        The requested song does not exist in the current song library.
      </p>
      <UButton to="/songs" color="neutral" variant="outline" icon="i-lucide-arrow-left">
        Back To Songs
      </UButton>
    </div>

    <template v-else>
      <header class="space-y-3">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
          Song Detail
        </p>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <h1 class="text-3xl font-semibold tracking-tight text-zinc-50">
              {{ song.title }}
            </h1>
            <p class="text-sm text-zinc-300">
              {{ song.artist }} · {{ song.tempo }} BPM · Added {{ song.createdAt }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton to="/songs" color="neutral" variant="outline" icon="i-lucide-arrow-left">
              All Songs
            </UButton>
            <UButton
              :to="`/songs/edit/${song.id}`"
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil-line"
            >
              Edit Song
            </UButton>
            <UButton
              v-if="owner"
              :to="`/users/${owner.id}`"
              color="neutral"
              variant="ghost"
              icon="i-lucide-user-round"
            >
              {{ owner.name }}
            </UButton>
          </div>
        </div>
      </header>

      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3"
      >
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
            Transpose Chords
          </p>
          <p class="text-sm text-zinc-300">
            {{ transposeSummary }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-minus"
            @click="shiftTranspose(-1)"
          >
            Down
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-plus"
            @click="shiftTranspose(1)"
          >
            Up
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-rotate-ccw"
            :disabled="transposeSteps === 0"
            @click="resetTranspose"
          >
            Reset
          </UButton>
        </div>
      </div>

      <ChordProRenderer :song="renderedSong" />
    </template>
  </section>
</template>
