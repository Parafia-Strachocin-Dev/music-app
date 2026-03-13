<script setup lang="ts">
import type { MassSessionInput } from '~/composables/useSessionsStore';
import type { MassSongSelection, MassSongSlot, SessionRecord } from '~/types/chordpro';

interface SlotConfig {
  key: MassSongSlot;
  label: string;
  hint: string;
}

const slotLabels: Record<MassSongSlot, string> = {
  entrance: 'Entrance',
  offering: 'Offering',
  communion: 'Communion',
  communion2: 'Communion 2',
  exit: 'Exit'
};

const slotHints: Record<MassSongSlot, string> = {
  entrance: 'Song for opening procession.',
  offering: 'Song during preparation of the gifts.',
  communion: 'Primary communion song.',
  communion2: 'Optional second communion song.',
  exit: 'Final sending song.'
};

const { songs, isLoading: isSongsLoading, loadSongs } = useSongsStore();
const {
  sessions,
  isLoading: isSessionsLoading,
  isFirestoreConnected,
  syncError,
  loadMassSessions,
  createMassSession,
  updateMassSession,
  createEmptyMassSongs,
  massSongSlots
} = useSessionsStore();

const selectedSessionId = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

const form = reactive<{
  title: string;
  date: string;
  songs: MassSongSelection;
}>({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  songs: createEmptyMassSongs()
});

const slotConfigs = computed<SlotConfig[]>(() => {
  return massSongSlots.map((slot) => {
    return {
      key: slot,
      label: slotLabels[slot],
      hint: slotHints[slot]
    };
  });
});

const selectedSession = computed(() => {
  return sessions.value.find((session) => session.id === selectedSessionId.value) ?? null;
});

const hasSelectedSession = computed(() => selectedSession.value !== null);

const isBusy = computed(() => {
  return isSubmitting.value || isSongsLoading.value || isSessionsLoading.value;
});

const syncSummary = computed(() => {
  if (isSessionsLoading.value) {
    return 'Loading MASS sessions from Firestore...';
  }

  if (syncError.value) {
    return `Firestore sync issue: ${syncError.value}`;
  }

  if (isFirestoreConnected.value) {
    return 'Connected to Firestore.';
  }

  return 'Firestore is not configured. Sessions stay local to this browser.';
});

const songLabelById = computed<Record<string, string>>(() => {
  return songs.value.reduce<Record<string, string>>((labels, song) => {
    labels[song.id] = `${song.title} · ${song.artist}`;
    return labels;
  }, {});
});

function getSongLabel(songId: string): string {
  if (!songId) {
    return 'Not selected';
  }

  return songLabelById.value[songId] ?? `Unknown song (${songId})`;
}

function formatDateLabel(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.valueOf())) {
    return value;
  }

  return parsed.toLocaleDateString();
}

function resetForm(): void {
  selectedSessionId.value = '';
  errorMessage.value = '';
  form.title = '';
  form.date = new Date().toISOString().slice(0, 10);
  form.songs = createEmptyMassSongs();
}

function applySessionToForm(session: SessionRecord): void {
  selectedSessionId.value = session.id;
  errorMessage.value = '';
  form.title = session.title;
  form.date = session.date;
  form.songs = {
    entrance: session.songs.entrance,
    offering: session.songs.offering,
    communion: session.songs.communion,
    communion2: session.songs.communion2,
    exit: session.songs.exit
  };
}

function selectSession(session: SessionRecord): void {
  applySessionToForm(session);
}

function toMassSessionInput(): MassSessionInput {
  return {
    title: form.title,
    date: form.date,
    songs: {
      entrance: form.songs.entrance,
      offering: form.songs.offering,
      communion: form.songs.communion,
      communion2: form.songs.communion2,
      exit: form.songs.exit
    }
  };
}

async function saveSession(): Promise<void> {
  errorMessage.value = '';

  if (!form.date.trim()) {
    errorMessage.value = 'Please choose the Mass date.';
    return;
  }

  isSubmitting.value = true;

  try {
    if (selectedSession.value) {
      const updated = await updateMassSession(selectedSession.value.id, toMassSessionInput());

      if (!updated) {
        errorMessage.value = 'Unable to update MASS session.';
        return;
      }

      applySessionToForm(updated);
    } else {
      const created = await createMassSession(toMassSessionInput());
      applySessionToForm(created);
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to save MASS session.';
  } finally {
    isSubmitting.value = false;
  }
}

async function retrySync(): Promise<void> {
  await Promise.all([loadSongs({ force: true }), loadMassSessions({ force: true })]);
}

onMounted(async () => {
  await Promise.all([loadSongs(), loadMassSessions()]);
});
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
          Liturgy Planner
        </p>
        <h1 class="text-3xl font-semibold tracking-tight text-zinc-50">
          Holy Mass Song Sessions
        </h1>
        <p class="max-w-2xl text-sm text-zinc-300">
          Build and manage MASS sessions in Firestore. Each session can assign songs for entrance,
          offering, communion, communion 2 and exit.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          :loading="isBusy"
          @click="retrySync"
        >
          Refresh Data
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-file-plus"
          @click="resetForm"
        >
          New Session
        </UButton>
      </div>
    </header>

    <div class="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-200">
      {{ syncSummary }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="soft">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-lg font-semibold text-zinc-100">MASS Sessions</h2>
            <UBadge color="neutral" variant="outline">
              {{ sessions.length }}
            </UBadge>
          </div>
        </template>

        <div v-if="sessions.length > 0" class="space-y-3">
          <div
            v-for="session in sessions"
            :key="session.id"
            class="w-full space-y-2 rounded-xl border px-3 py-3 text-left transition"
            :class="
              selectedSessionId === session.id
                ? 'border-emerald-400/60 bg-emerald-500/10 ring-1 ring-emerald-400/30'
                : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/80'
            "
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                class="text-left"
                @click="selectSession(session)"
              >
                <p class="font-medium text-zinc-100">{{ session.title }}</p>
                <p class="text-xs text-zinc-400">
                  {{ formatDateLabel(session.date) }}
                </p>
              </button>
              <UBadge color="primary" variant="soft">MASS</UBadge>
            </div>

            <ul class="space-y-1 text-xs text-zinc-300">
              <li
                v-for="slot in slotConfigs"
                :key="`${session.id}-${slot.key}`"
                class="flex flex-wrap items-center gap-1"
              >
                <span>{{ slot.label }}:</span>
                <NuxtLink
                  v-if="session.songs[slot.key]"
                  :to="{
                    path: `/songs/${session.songs[slot.key]}`,
                    query: { sessionId: session.id, slot: slot.key }
                  }"
                  class="text-emerald-300 underline-offset-4 hover:underline"
                >
                  {{ getSongLabel(session.songs[slot.key]) }}
                </NuxtLink>
                <span v-else class="text-zinc-500">Not selected</span>
              </li>
            </ul>
          </div>
        </div>

        <p v-else class="text-sm text-zinc-300">
          No MASS sessions yet. Create one to assign songs to liturgy slots.
        </p>
      </UCard>

      <UCard class="border border-zinc-800 bg-zinc-900/70" variant="soft">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold text-zinc-100">
              {{ hasSelectedSession ? 'Edit MASS Session' : 'Create MASS Session' }}
            </h2>
            <UBadge color="primary" variant="soft">Type: MASS</UBadge>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="saveSession">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="space-y-1 text-sm text-zinc-200">
              <span>Session Title</span>
              <input
                v-model="form.title"
                type="text"
                placeholder="Sunday Morning Mass"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
              >
            </label>

            <label class="space-y-1 text-sm text-zinc-200">
              <span>Mass Date</span>
              <input
                v-model="form.date"
                type="date"
                required
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
              >
            </label>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label v-for="slot in slotConfigs" :key="slot.key" class="space-y-1 text-sm text-zinc-200">
              <span>{{ slot.label }}</span>
              <select
                v-model="form.songs[slot.key]"
                class="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-zinc-100 outline-none ring-emerald-400 transition focus:ring-2"
              >
                <option value="">Not selected</option>
                <option v-for="song in songs" :key="`${slot.key}-${song.id}`" :value="song.id">
                  {{ song.title }} · {{ song.artist }}
                </option>
              </select>
              <p class="text-xs text-zinc-400">{{ slot.hint }}</p>
              <NuxtLink
                v-if="form.songs[slot.key]"
                :to="
                  hasSelectedSession
                    ? {
                        path: `/songs/${form.songs[slot.key]}`,
                        query: { sessionId: selectedSessionId, slot: slot.key }
                      }
                    : `/songs/${form.songs[slot.key]}`
                "
                class="inline-flex text-xs font-medium text-emerald-300 underline-offset-4 hover:underline"
              >
                Open selected song
              </NuxtLink>
            </label>
          </div>

          <p v-if="errorMessage" class="text-sm text-rose-300">
            {{ errorMessage }}
          </p>

          <div class="flex flex-wrap gap-2">
            <UButton
              type="submit"
              color="primary"
              icon="i-lucide-save"
              :loading="isSubmitting"
            >
              {{ hasSelectedSession ? 'Save MASS Session' : 'Create MASS Session' }}
            </UButton>
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              icon="i-lucide-plus"
              @click="resetForm"
            >
              Clear Form
            </UButton>
          </div>
        </form>
      </UCard>
    </div>
  </section>
</template>
