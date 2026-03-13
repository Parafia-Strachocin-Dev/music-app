<script setup lang="ts">
const { songs } = useSongsStore();
const { users } = useUsersStore();

const recentSongs = computed(() => {
  return [...songs.value]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 3);
});

const averageTempo = computed(() => {
  if (songs.value.length === 0) {
    return 0;
  }

  const totalTempo = songs.value.reduce((sum, song) => sum + song.tempo, 0);
  return Math.round(totalTempo / songs.value.length);
});
</script>

<template>
  <section class="space-y-8">
    <header
      class="rounded-3xl border border-emerald-300/20 bg-[linear-gradient(120deg,rgba(16,185,129,0.2),rgba(59,130,246,0.08),rgba(245,158,11,0.18))] p-6 shadow-lg shadow-black/20 sm:p-8"
    >
      <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        <img
          src="/icon.png"
          alt="Uwielbiajmy GO! logo"
          class="h-16 w-16 rounded-2xl border border-emerald-200/30 bg-zinc-950/70 p-2 shadow-md shadow-black/30 sm:h-20 sm:w-20"
        >

        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
            Uwielbiajmy GO!
          </p>
          <h1 class="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-zinc-50">
            Song app for Christian musicians.
          </h1>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-zinc-200/85">
            Uwielbiajmy GO! helps worship teams organize songs with chords, open clean charts fast,
            and prepare music together for prayer meetings, services, and community gatherings.
          </p>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap gap-2">
        <UButton to="/songs" icon="i-lucide-library-big" color="primary">
          Open Songs
        </UButton>
        <UButton to="/mass" icon="i-lucide-list-music" color="secondary" variant="soft">
          Plan Mass
        </UButton>
        <UButton to="/users" icon="i-lucide-users" color="neutral" variant="outline">
          Browse Users
        </UButton>
        <UButton to="/test/chordpro" icon="i-lucide-flask-conical" color="neutral" variant="soft">
          ChordPro Test Lab
        </UButton>
      </div>
    </header>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="subtle">
        <p class="text-xs uppercase tracking-[0.14em] text-zinc-400">Songs</p>
        <p class="mt-2 text-3xl font-semibold text-zinc-50">{{ songs.length }}</p>
      </UCard>

      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="subtle">
        <p class="text-xs uppercase tracking-[0.14em] text-zinc-400">Users</p>
        <p class="mt-2 text-3xl font-semibold text-zinc-50">{{ users.length }}</p>
      </UCard>

      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="subtle">
        <p class="text-xs uppercase tracking-[0.14em] text-zinc-400">Average Tempo</p>
        <p class="mt-2 text-3xl font-semibold text-zinc-50">{{ averageTempo }} BPM</p>
      </UCard>

      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="subtle">
        <p class="text-xs uppercase tracking-[0.14em] text-zinc-400">Parser Route</p>
        <NuxtLink to="/test/chordpro" class="mt-2 inline-block text-lg font-semibold text-emerald-300">
          /test/chordpro
        </NuxtLink>
      </UCard>
    </section>

    <section class="grid gap-5 xl:grid-cols-2">
      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="soft">
        <template #header>
          <h2 class="text-xl font-semibold text-zinc-100">Recent Songs</h2>
        </template>

        <ul class="space-y-3">
          <li
            v-for="song in recentSongs"
            :key="song.id"
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2"
          >
            <div>
              <p class="font-medium text-zinc-100">{{ song.title }}</p>
              <p class="text-xs text-zinc-400">{{ song.artist }} · {{ song.key }} · {{ song.tempo }} BPM</p>
            </div>
            <UButton :to="`/songs/${song.id}`" color="neutral" variant="outline" size="sm">
              Open
            </UButton>
          </li>
        </ul>
      </UCard>

      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="soft">
        <template #header>
          <h2 class="text-xl font-semibold text-zinc-100">Core Routes</h2>
        </template>

        <div class="space-y-3 text-sm text-zinc-300">
          <p>
            Songs list: <NuxtLink class="text-emerald-300 underline-offset-4 hover:underline" to="/songs">/songs</NuxtLink>
          </p>
          <p>
            Mass planner: <NuxtLink class="text-emerald-300 underline-offset-4 hover:underline" to="/mass">/mass</NuxtLink>
          </p>
          <p>
            Song detail: <span class="text-zinc-100">/songs/[id]</span> (rendered text only)
          </p>
          <p>
            Users list: <NuxtLink class="text-emerald-300 underline-offset-4 hover:underline" to="/users">/users</NuxtLink>
          </p>
          <p>
            User detail: <span class="text-zinc-100">/users/[id]</span>
          </p>
          <p>
            Source/preview lab: <NuxtLink class="text-emerald-300 underline-offset-4 hover:underline" to="/test/chordpro">/test/chordpro</NuxtLink>
          </p>
        </div>
      </UCard>
    </section>
  </section>
</template>
