<script setup lang="ts">
const { getSongById } = useSongsStore();
const { getUserById } = useUsersStore();

const route = useRoute();
const { parseChordPro } = useChordProParser();

const songId = computed(() => String(route.params.id ?? ''));
const song = computed(() => getSongById(songId.value));
const owner = computed(() => (song.value ? getUserById(song.value.ownerId) : undefined));
const parsedSong = computed(() => (song.value ? parseChordPro(song.value.chordPro) : null));
</script>

<template>
  <section class="space-y-6">
    <div v-if="!song || !parsedSong" class="space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-50">Song not found</h1>
      <p class="text-sm text-zinc-300">
        The requested song does not exist in the local seed data.
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

      <ChordProRenderer :song="parsedSong" />
    </template>
  </section>
</template>
