<script setup lang="ts">
const { songs } = useSongsStore();
const { getUserById } = useUsersStore();

const route = useRoute();

const userId = computed(() => String(route.params.id ?? ''));
const user = computed(() => getUserById(userId.value));
const userSongs = computed(() => songs.value.filter((song) => song.ownerId === userId.value));
</script>

<template>
  <section class="space-y-6">
    <div v-if="!user" class="space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-50">User not found</h1>
      <p class="text-sm text-zinc-300">This profile does not exist in the current seed data.</p>
      <UButton to="/users" color="neutral" variant="outline" icon="i-lucide-arrow-left">
        Back To Users
      </UButton>
    </div>

    <template v-else>
      <header class="space-y-3">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
          User Profile
        </p>
        <h1 class="text-3xl font-semibold tracking-tight text-zinc-50">{{ user.name }}</h1>
        <p class="max-w-3xl text-sm leading-6 text-zinc-300">{{ user.bio }}</p>

        <div class="flex flex-wrap gap-2">
          <UButton :to="`/users/edit/${user.id}`" color="neutral" variant="outline" icon="i-lucide-pencil-line">
            Edit Profile
          </UButton>
          <UBadge color="neutral" variant="outline">{{ user.role }}</UBadge>
          <UBadge color="secondary" variant="soft">{{ user.instrument }}</UBadge>
          <UBadge color="primary" variant="soft">{{ user.location }}</UBadge>
          <UBadge color="neutral" variant="subtle">{{ user.email }}</UBadge>
        </div>
      </header>

      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="soft">
        <template #header>
          <h2 class="text-lg font-semibold text-zinc-100">Songs By {{ user.name }}</h2>
        </template>

        <div v-if="userSongs.length === 0" class="text-sm text-zinc-300">
          No songs assigned to this user yet.
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="song in userSongs"
            :key="song.id"
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2"
          >
            <div>
              <p class="font-medium text-zinc-100">{{ song.title }}</p>
              <p class="text-xs text-zinc-400">{{ song.artist }} · {{ song.tempo }} BPM</p>
            </div>
            <UButton :to="`/songs/${song.id}`" color="neutral" variant="outline" size="sm">
              Open Song
            </UButton>
          </li>
        </ul>
      </UCard>
    </template>
  </section>
</template>
