<script setup lang="ts">
import type { SongInput } from '~/composables/useSongsStore';

const route = useRoute();
const { users } = useUsersStore();
const { getSongById, updateSong } = useSongsStore();

const errorMessage = ref('');
const songId = computed(() => String(route.params.id ?? ''));
const song = computed(() => getSongById(songId.value));

const form = reactive({
  title: '',
  artist: '',
  key: '',
  tempo: 120,
  ownerId: '',
  createdAt: new Date().toISOString().slice(0, 10),
  tagsText: '',
  chordPro: ''
});

watch(
  song,
  (value) => {
    if (!value) {
      return;
    }

    form.title = value.title;
    form.artist = value.artist;
    form.key = value.key;
    form.tempo = value.tempo;
    form.ownerId = value.ownerId;
    form.createdAt = value.createdAt;
    form.tagsText = value.tags.join(', ');
    form.chordPro = value.chordPro;
  },
  { immediate: true }
);

watch(
  () => users.value,
  (list) => {
    if (!form.ownerId && list.length > 0) {
      const firstUser = list[0];

      if (firstUser) {
        form.ownerId = firstUser.id;
      }
    }
  },
  { immediate: true }
);

function parseTags(tagsText: string): string[] {
  return tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

async function submitForm(): Promise<void> {
  if (!song.value) {
    return;
  }

  errorMessage.value = '';

  if (!form.title.trim() || !form.artist.trim() || !form.key.trim() || !form.ownerId) {
    errorMessage.value = 'Please fill title, artist, key and owner.';
    return;
  }

  const payload: SongInput = {
    title: form.title,
    artist: form.artist,
    key: form.key,
    tempo: Number(form.tempo),
    ownerId: form.ownerId,
    createdAt: form.createdAt,
    tags: parseTags(form.tagsText),
    chordPro: form.chordPro
  };

  const updated = updateSong(song.value.id, payload);

  if (!updated) {
    errorMessage.value = 'Unable to update song.';
    return;
  }

  await navigateTo(`/songs/${updated.id}`);
}
</script>

<template>
  <section class="space-y-6">
    <div v-if="!song" class="space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-50">Song not found</h1>
      <p class="text-sm text-zinc-300">Cannot edit a song that does not exist.</p>
      <UButton to="/songs" color="neutral" variant="outline" icon="i-lucide-arrow-left">
        Back To Songs
      </UButton>
    </div>

    <template v-else>
      <header class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
          Song Form
        </p>
        <h1 class="text-3xl font-semibold tracking-tight text-zinc-50">Edit Song</h1>
        <p class="max-w-2xl text-sm text-zinc-300">
          Changes are local-only and stay in memory for this running app session.
        </p>
      </header>

      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="soft">
        <form class="space-y-4" @submit.prevent="submitForm">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="space-y-1 text-sm text-zinc-200">
              <span>Title</span>
              <input
                v-model="form.title"
                type="text"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
              >
            </label>

            <label class="space-y-1 text-sm text-zinc-200">
              <span>Artist</span>
              <input
                v-model="form.artist"
                type="text"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
              >
            </label>

            <label class="space-y-1 text-sm text-zinc-200">
              <span>Key</span>
              <input
                v-model="form.key"
                type="text"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
              >
            </label>

            <label class="space-y-1 text-sm text-zinc-200">
              <span>Tempo (BPM)</span>
              <input
                v-model.number="form.tempo"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
              >
            </label>

            <label class="space-y-1 text-sm text-zinc-200">
              <span>Owner</span>
              <select
                v-model="form.ownerId"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
              >
                <option disabled value="">Select owner</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.name }}
                </option>
              </select>
            </label>

            <label class="space-y-1 text-sm text-zinc-200">
              <span>Created At</span>
              <input
                v-model="form.createdAt"
                type="date"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
              >
            </label>
          </div>

          <label class="space-y-1 text-sm text-zinc-200">
            <span>Tags (comma separated)</span>
            <input
              v-model="form.tagsText"
              type="text"
              class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            >
          </label>

          <label class="space-y-1 text-sm text-zinc-200">
            <span>ChordPro Source</span>
            <UTextarea
              v-model="form.chordPro"
              :rows="16"
              :maxrows="40"
              autoresize
              color="neutral"
              variant="outline"
              class="w-full"
              placeholder="Paste ChordPro source"
            />
          </label>

          <p v-if="errorMessage" class="text-sm text-rose-300">
            {{ errorMessage }}
          </p>

          <div class="flex flex-wrap gap-2">
            <UButton type="submit" color="primary" icon="i-lucide-save">
              Save Changes
            </UButton>
            <UButton :to="`/songs/${song.id}`" color="neutral" variant="outline" icon="i-lucide-x">
              Cancel
            </UButton>
          </div>
        </form>
      </UCard>
    </template>
  </section>
</template>
