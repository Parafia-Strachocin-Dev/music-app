<script setup lang="ts">
import type { UserInput } from '~/composables/useUsersStore';
import type { UserProfile } from '~/types/chordpro';

const { createUser } = useUsersStore();

const errorMessage = ref('');

const form = reactive({
  name: '',
  email: '',
  role: 'viewer' as UserProfile['role'],
  instrument: '',
  location: '',
  bio: ''
});

async function submitForm(): Promise<void> {
  errorMessage.value = '';

  if (!form.name.trim() || !form.email.trim() || !form.instrument.trim() || !form.location.trim()) {
    errorMessage.value = 'Please fill name, email, instrument and location.';
    return;
  }

  const payload: UserInput = {
    name: form.name,
    email: form.email,
    role: form.role,
    instrument: form.instrument,
    location: form.location,
    bio: form.bio
  };

  const created = createUser(payload);
  await navigateTo(`/users/${created.id}`);
}
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
        User Form
      </p>
      <h1 class="text-3xl font-semibold tracking-tight text-zinc-50">Create User</h1>
      <p class="max-w-2xl text-sm text-zinc-300">
        Basic local-only user creation for this app session.
      </p>
    </header>

    <UCard class="border border-zinc-800 bg-zinc-900/70" variant="soft">
      <form class="space-y-4" @submit.prevent="submitForm">
        <div class="grid gap-4 md:grid-cols-2">
          <label class="space-y-1 text-sm text-zinc-200">
            <span>Name</span>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            >
          </label>

          <label class="space-y-1 text-sm text-zinc-200">
            <span>Email</span>
            <input
              v-model="form.email"
              type="email"
              required
              class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            >
          </label>

          <label class="space-y-1 text-sm text-zinc-200">
            <span>Role</span>
            <select
              v-model="form.role"
              class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            >
              <option value="admin">admin</option>
              <option value="editor">editor</option>
              <option value="viewer">viewer</option>
            </select>
          </label>

          <label class="space-y-1 text-sm text-zinc-200">
            <span>Instrument</span>
            <input
              v-model="form.instrument"
              type="text"
              required
              class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            >
          </label>

          <label class="space-y-1 text-sm text-zinc-200 md:col-span-2">
            <span>Location</span>
            <input
              v-model="form.location"
              type="text"
              required
              class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
            >
          </label>
        </div>

        <label class="space-y-1 text-sm text-zinc-200">
          <span>Bio</span>
          <UTextarea
            v-model="form.bio"
            :rows="6"
            :maxrows="16"
            autoresize
            color="neutral"
            variant="outline"
            class="w-full"
            placeholder="Short profile description"
          />
        </label>

        <p v-if="errorMessage" class="text-sm text-rose-300">
          {{ errorMessage }}
        </p>

        <div class="flex flex-wrap gap-2">
          <UButton type="submit" color="primary" icon="i-lucide-save">
            Create User
          </UButton>
          <UButton to="/users" color="neutral" variant="outline" icon="i-lucide-x">
            Cancel
          </UButton>
        </div>
      </form>
    </UCard>
  </section>
</template>
