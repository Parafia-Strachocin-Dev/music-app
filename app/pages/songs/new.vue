<script setup lang="ts">
import type { SongInput } from '~/composables/useSongsStore';

const { users } = useUsersStore();
const { createSong } = useSongsStore();

const errorMessage = ref('');
const isSubmitting = ref(false);

const form = reactive({
  title: '',
  artist: '',
  key: 'C',
  tempo: 120,
  ownerId: '',
  createdAt: new Date().toISOString().slice(0, 10),
  tagsText: '',
  chordPro: `{title: New Song}
{artist: Unknown Artist}
{key: C}
{tempo: 120}

{comment: Verse 1}
[C]Write your [G]lyrics [Am]here.`
});

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

  isSubmitting.value = true;

  try {
    const created = await createSong(payload);
    await navigateTo(`/songs/${created.id}`);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to create song.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
        Song Form
      </p>
      <h1 class="text-3xl font-semibold tracking-tight text-zinc-50">Create Song</h1>
      <p class="max-w-2xl text-sm text-zinc-300">
        This form saves songs to Firestore when Firebase is configured.
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
            placeholder="worship, acoustic"
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
          <UButton type="submit" color="primary" icon="i-lucide-save" :loading="isSubmitting">
            Create Song
          </UButton>
          <UButton to="/songs" color="neutral" variant="outline" icon="i-lucide-x">
            Cancel
          </UButton>
        </div>
      </form>
    </UCard>
  </section>
</template>
