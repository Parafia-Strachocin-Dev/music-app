<script setup lang="ts">
const route = useRoute();

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Songs', to: '/songs' },
  { label: 'Users', to: '/users' },
  { label: 'Test Lab', to: '/test/chordpro' }
];

function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/';
  }

  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<template>
  <UApp>
    <div
      class="min-h-screen bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(251,191,36,0.14),transparent_26%),linear-gradient(155deg,#09090b_0%,#18181b_52%,#111827_100%)] text-zinc-100"
    >
      <header class="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <NuxtLink to="/" class="text-lg font-semibold tracking-wide text-zinc-50">
            ChordApp
          </NuxtLink>

          <nav class="flex flex-wrap items-center gap-2">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="rounded-full px-3 py-1.5 text-sm font-medium transition"
              :class="
                isActive(item.to)
                  ? 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-300/40'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
              "
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
