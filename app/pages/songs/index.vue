<script setup lang="ts">
const { songs, isLoading, isFirestoreConnected, syncError, loadSongs } = useSongsStore();
const { users, getUserById } = useUsersStore();

const searchTerm = ref('');
const selectedKey = ref('all');
const selectedOwnerId = ref('all');
const selectedTag = ref('all');

interface SongCardItem {
  id: string;
  ownerId: string;
  title: string;
  artist: string;
  key: string;
  tempo: number;
  createdAt: string;
  tags: string[];
  ownerName: string;
  preview: string;
}

function extractPreview(chordPro: string): string {
  const compact = chordPro
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('{'))
    .join(' ')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (compact.length <= 150) {
    return compact;
  }

  return `${compact.slice(0, 147)}...`;
}

const keyOptions = computed(() => {
  return [...new Set(songs.value.map((song) => song.key))].sort((left, right) => {
    return left.localeCompare(right);
  });
});

const ownerOptions = computed(() => {
  return [...users.value].sort((left, right) => {
    return left.name.localeCompare(right.name);
  });
});

const tagOptions = computed(() => {
  return [...new Set(songs.value.flatMap((song) => song.tags))].sort((left, right) => {
    return left.localeCompare(right);
  });
});

const filteredSongs = computed(() => {
  const query = searchTerm.value.trim().toLowerCase();

  return songs.value
    .filter((song) => {
      if (selectedKey.value !== 'all' && song.key !== selectedKey.value) {
        return false;
      }

      if (selectedOwnerId.value !== 'all' && song.ownerId !== selectedOwnerId.value) {
        return false;
      }

      if (selectedTag.value !== 'all' && !song.tags.includes(selectedTag.value)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        song.title,
        song.artist,
        song.key,
        song.tags.join(' '),
        extractPreview(song.chordPro)
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
});

const hasActiveFilters = computed(() => {
  return (
    searchTerm.value.trim().length > 0 ||
    selectedKey.value !== 'all' ||
    selectedOwnerId.value !== 'all' ||
    selectedTag.value !== 'all'
  );
});

function resetFilters(): void {
  searchTerm.value = '';
  selectedKey.value = 'all';
  selectedOwnerId.value = 'all';
  selectedTag.value = 'all';
}

const songCards = computed<SongCardItem[]>(() => {
  return filteredSongs.value.map((song) => {
    return {
      id: song.id,
      ownerId: song.ownerId,
      title: song.title,
      artist: song.artist,
      key: song.key,
      tempo: song.tempo,
      createdAt: song.createdAt,
      tags: song.tags,
      ownerName: getUserById(song.ownerId)?.name ?? 'Unknown User',
      preview: extractPreview(song.chordPro)
    };
  });
});

const syncSummary = computed(() => {
  if (isLoading.value) {
    return 'Loading songs from Firestore...';
  }

  if (syncError.value) {
    return `Firestore sync issue: ${syncError.value}`;
  }

  if (isFirestoreConnected.value) {
    return 'Connected to Firestore.';
  }

  return 'Firestore is not configured. Using local fallback songs.';
});

async function retrySync(): Promise<void> {
  await loadSongs({ force: true });
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
          Song Library
        </p>
        <h1 class="text-3xl font-semibold tracking-tight text-zinc-50">
          Browse ChordPro Songs
        </h1>
        <p class="max-w-2xl text-sm text-zinc-300">
          Choose a song to open the rendered detail view. Use the test lab when you need to
          inspect raw source side by side.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton to="/songs/new" icon="i-lucide-circle-plus" color="primary" variant="solid">
          New Song
        </UButton>
        <UButton to="/test/chordpro" icon="i-lucide-flask-conical" color="neutral" variant="outline">
          Open Test Lab
        </UButton>
      </div>
    </header>

    <div class="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-200">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p>{{ syncSummary }}</p>
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-refresh-cw"
          :loading="isLoading"
          @click="retrySync"
        >
          Retry Sync
        </UButton>
      </div>
    </div>

    <UCard class="border border-zinc-800 bg-zinc-900/70" variant="soft">
      <template #header>
        <h2 class="text-lg font-semibold text-zinc-100">Search And Filters</h2>
      </template>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label class="space-y-1 text-sm text-zinc-200">
          <span class="text-xs uppercase tracking-[0.12em] text-zinc-400">Search</span>
          <input
            v-model="searchTerm"
            type="text"
            class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            placeholder="Title, artist, tag or lyrics"
          >
        </label>

        <label class="space-y-1 text-sm text-zinc-200">
          <span class="text-xs uppercase tracking-[0.12em] text-zinc-400">Key</span>
          <select
            v-model="selectedKey"
            class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
          >
            <option value="all">All keys</option>
            <option v-for="keyValue in keyOptions" :key="keyValue" :value="keyValue">
              {{ keyValue }}
            </option>
          </select>
        </label>

        <label class="space-y-1 text-sm text-zinc-200">
          <span class="text-xs uppercase tracking-[0.12em] text-zinc-400">Owner</span>
          <select
            v-model="selectedOwnerId"
            class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
          >
            <option value="all">All owners</option>
            <option v-for="user in ownerOptions" :key="user.id" :value="user.id">
              {{ user.name }}
            </option>
          </select>
        </label>

        <label class="space-y-1 text-sm text-zinc-200">
          <span class="text-xs uppercase tracking-[0.12em] text-zinc-400">Tag</span>
          <select
            v-model="selectedTag"
            class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
          >
            <option value="all">All tags</option>
            <option v-for="tag in tagOptions" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
        </label>
      </div>

      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-300">
          <p>Showing {{ songCards.length }} song(s)</p>
          <UButton
            v-if="hasActiveFilters"
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-rotate-ccw"
            @click="resetFilters"
          >
            Reset Filters
          </UButton>
        </div>
      </template>
    </UCard>

    <div v-if="songCards.length > 0" class="grid gap-4 lg:grid-cols-2">
      <UCard
        v-for="song in songCards"
        :key="song.id"
        class="border border-zinc-800 bg-zinc-900/70"
        variant="subtle"
      >
        <template #header>
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-semibold text-zinc-100">{{ song.title }}</h2>
              <UBadge color="secondary" variant="soft">{{ song.key }}</UBadge>
              <UBadge color="primary" variant="soft">{{ song.tempo }} BPM</UBadge>
            </div>
            <p class="text-sm text-zinc-300">
              {{ song.artist }} · by {{ song.ownerName }} · added {{ song.createdAt }}
            </p>
          </div>
        </template>

        <p class="text-sm leading-6 text-zinc-300">
          {{ song.preview }}
        </p>

        <div class="mt-4 flex flex-wrap gap-2">
          <UBadge
            v-for="tag in song.tags"
            :key="`${song.id}-${tag}`"
            color="neutral"
            variant="outline"
            size="sm"
          >
            {{ tag }}
          </UBadge>
        </div>

        <template #footer>
          <div class="flex flex-wrap gap-2">
            <UButton :to="`/songs/${song.id}`" icon="i-lucide-music-3" color="primary">
              Open Song
            </UButton>
            <UButton
              :to="`/songs/edit/${song.id}`"
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil-line"
            >
              Edit
            </UButton>
            <UButton
              :to="`/users/${song.ownerId}`"
              color="neutral"
              variant="ghost"
              icon="i-lucide-user-round"
            >
              View Author
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <UCard v-else class="border border-zinc-800 bg-zinc-900/70" variant="soft">
      <p class="text-sm text-zinc-300">
        No songs match your current filters.
      </p>
    </UCard>
  </section>
</template>
