<script setup lang="ts">
const { songs } = useSongsStore();
const { users } = useUsersStore();

interface UserCardItem {
  id: string;
  name: string;
  role: string;
  email: string;
  instrument: string;
  location: string;
  songCount: number;
}

const userCards = computed<UserCardItem[]>(() => {
  return users.value.map((user) => {
    const songCount = songs.value.filter((song) => song.ownerId === user.id).length;

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      instrument: user.instrument,
      location: user.location,
      songCount
    };
  });
});
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
        People
      </p>
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="space-y-2">
          <h1 class="text-3xl font-semibold tracking-tight text-zinc-50">User Directory</h1>
          <p class="max-w-2xl text-sm text-zinc-300">
            Basic user profiles connected to the song library.
          </p>
        </div>
        <UButton to="/users/new" color="primary" icon="i-lucide-user-round-plus">
          New User
        </UButton>
      </div>
    </header>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <UCard
        v-for="user in userCards"
        :key="user.id"
        class="border border-zinc-800 bg-zinc-900/70"
        variant="subtle"
      >
        <template #header>
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-zinc-100">{{ user.name }}</h2>
            <p class="text-sm text-zinc-300">{{ user.email }}</p>
          </div>
        </template>

        <div class="space-y-2 text-sm text-zinc-300">
          <p>Role: {{ user.role }}</p>
          <p>Instrument: {{ user.instrument }}</p>
          <p>Location: {{ user.location }}</p>
          <p>Songs in library: {{ user.songCount }}</p>
        </div>

        <template #footer>
          <div class="flex flex-wrap gap-2">
            <UButton :to="`/users/${user.id}`" color="neutral" variant="outline" icon="i-lucide-user-round">
              Open Profile
            </UButton>
            <UButton
              :to="`/users/edit/${user.id}`"
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil-line"
            >
              Edit
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </section>
</template>
