<script setup lang="ts">
import type { MassSongSlot } from '~/types/chordpro';

const { getSongById, isLoading } = useSongsStore();
const { getUserById } = useUsersStore();
const { sessions, loadMassSessions, massSongSlots } = useSessionsStore();

const route = useRoute();
const { parseChordPro, transposeParsedSong } = useChordProParser();
const { textPreferences, updateTextPreferences, resetTextPreferences, metadataSyncError } = useAuthStore();

const songId = computed(() => String(route.params.id ?? ''));
const song = computed(() => getSongById(songId.value));
const owner = computed(() => (song.value ? getUserById(song.value.ownerId) : undefined));
const transposeSteps = ref(0);
const lyricFontSizePx = computed(() => textPreferences.value.lyricFontSizePx);
const chordFontSizePx = computed(() => textPreferences.value.chordFontSizePx);

const LYRIC_FONT_MIN = 12;
const LYRIC_FONT_MAX = 36;
const CHORD_FONT_MIN = 10;
const CHORD_FONT_MAX = 28;
const LYRIC_FONT_DEFAULT = 17;
const CHORD_FONT_DEFAULT = 12;

const parsedSong = computed(() => (song.value ? parseChordPro(song.value.chordPro) : null));
const renderedSong = computed(() =>
  parsedSong.value ? transposeParsedSong(parsedSong.value, transposeSteps.value) : null
);

const massSlotLabels: Record<MassSongSlot, string> = {
  entrance: 'Entrance',
  offering: 'Offering',
  communion: 'Communion',
  communion2: 'Communion 2',
  exit: 'Exit'
};

interface MassSongEntry {
  slot: MassSongSlot;
  songId: string;
}

const massSessionId = computed(() => {
  const value = route.query.sessionId;

  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
});

const massSlotFromQuery = computed<MassSongSlot | null>(() => {
  const value = route.query.slot;
  const slot = Array.isArray(value) ? value[0] : value;

  if (slot && typeof slot === 'string' && massSongSlots.includes(slot as MassSongSlot)) {
    return slot as MassSongSlot;
  }

  return null;
});

const activeMassSession = computed(() => {
  if (!massSessionId.value) {
    return null;
  }

  return sessions.value.find((session) => session.id === massSessionId.value) ?? null;
});

const massSongEntries = computed<MassSongEntry[]>(() => {
  const session = activeMassSession.value;

  if (!session) {
    return [];
  }

  return massSongSlots
    .map((slot) => {
      return {
        slot,
        songId: session.songs[slot]
      };
    })
    .filter((entry) => entry.songId.length > 0);
});

const currentMassSongIndex = computed(() => {
  if (massSongEntries.value.length === 0) {
    return -1;
  }

  if (massSlotFromQuery.value) {
    const preciseIndex = massSongEntries.value.findIndex((entry) => {
      return entry.songId === songId.value && entry.slot === massSlotFromQuery.value;
    });

    if (preciseIndex !== -1) {
      return preciseIndex;
    }
  }

  return massSongEntries.value.findIndex((entry) => entry.songId === songId.value);
});

const currentMassSongEntry = computed(() => {
  const index = currentMassSongIndex.value;

  if (index === -1) {
    return null;
  }

  return massSongEntries.value[index] ?? null;
});

const previousMassSongEntry = computed(() => {
  const index = currentMassSongIndex.value;

  if (index <= 0) {
    return null;
  }

  return massSongEntries.value[index - 1] ?? null;
});

const nextMassSongEntry = computed(() => {
  const index = currentMassSongIndex.value;

  if (index === -1 || index >= massSongEntries.value.length - 1) {
    return null;
  }

  return massSongEntries.value[index + 1] ?? null;
});

const hasMassSongNavigation = computed(() => {
  return activeMassSession.value !== null && currentMassSongIndex.value !== -1;
});

function massSongRoute(entry: MassSongEntry) {
  return {
    path: `/songs/${entry.songId}`,
    query: {
      sessionId: massSessionId.value,
      slot: entry.slot
    }
  };
}

const transposeSummary = computed(() => {
  if (transposeSteps.value === 0) {
    return 'Original key';
  }

  const sign = transposeSteps.value > 0 ? '+' : '';
  const unit = Math.abs(transposeSteps.value) === 1 ? 'semitone' : 'semitones';

  return `${sign}${transposeSteps.value} ${unit}`;
});

const fontSizeSummary = computed(() => {
  return `Lyrics ${lyricFontSizePx.value}px · Chords ${chordFontSizePx.value}px`;
});

const canResetFontSize = computed(() => {
  return (
    lyricFontSizePx.value !== LYRIC_FONT_DEFAULT || chordFontSizePx.value !== CHORD_FONT_DEFAULT
  );
});

watch(songId, () => {
  transposeSteps.value = 0;
});

watch(
  massSessionId,
  (value) => {
    if (value) {
      void loadMassSessions();
    }
  },
  { immediate: true }
);

function shiftTranspose(delta: number): void {
  const next = transposeSteps.value + delta;

  if (next > 11) {
    transposeSteps.value = -11;
    return;
  }

  if (next < -11) {
    transposeSteps.value = 11;
    return;
  }

  transposeSteps.value = next;
}

function shiftLyricFontSize(delta: number): void {
  updateTextPreferences({
    lyricFontSizePx: lyricFontSizePx.value + delta
  });
}

function shiftChordFontSize(delta: number): void {
  updateTextPreferences({
    chordFontSizePx: chordFontSizePx.value + delta
  });
}

function resetFontSize(): void {
  resetTextPreferences();
}

function resetTranspose(): void {
  transposeSteps.value = 0;
}
</script>

<template>
  <section class="space-y-6">
    <div v-if="isLoading && !song" class="space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-50">Loading song...</h1>
      <p class="text-sm text-zinc-300">
        Reading song data from Firestore.
      </p>
      <UButton to="/songs" color="neutral" variant="outline" icon="i-lucide-arrow-left">
        Back To Songs
      </UButton>
    </div>

    <div v-else-if="!song || !renderedSong" class="space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-50">Song not found</h1>
      <p class="text-sm text-zinc-300">
        The requested song does not exist in the current song library.
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

      <div
        v-if="hasMassSongNavigation"
        class="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
              MASS Set Navigation
            </p>
            <p class="text-sm text-zinc-200">
              {{ activeMassSession?.title }} ·
              {{ massSlotLabels[currentMassSongEntry!.slot] }} ·
              {{ currentMassSongIndex + 1 }} / {{ massSongEntries.length }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="previousMassSongEntry"
              :to="massSongRoute(previousMassSongEntry)"
              color="neutral"
              variant="outline"
              icon="i-lucide-arrow-left"
            >
              Previous
            </UButton>
            <UButton
              v-else
              color="neutral"
              variant="outline"
              icon="i-lucide-arrow-left"
              disabled
            >
              Previous
            </UButton>

            <UButton
              v-if="nextMassSongEntry"
              :to="massSongRoute(nextMassSongEntry)"
              color="primary"
              icon="i-lucide-arrow-right"
              trailing
            >
              Next
            </UButton>
            <UButton
              v-else
              color="primary"
              icon="i-lucide-arrow-right"
              trailing
              disabled
            >
              Next
            </UButton>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs">
          <NuxtLink
            v-for="entry in massSongEntries"
            :key="`${entry.slot}-${entry.songId}`"
            :to="massSongRoute(entry)"
            class="rounded-full border px-2.5 py-1 transition"
            :class="
              currentMassSongEntry?.slot === entry.slot && currentMassSongEntry?.songId === entry.songId
                ? 'border-emerald-300/50 bg-emerald-500/10 text-emerald-200'
                : 'border-zinc-700 bg-zinc-950/60 text-zinc-300 hover:border-zinc-500'
            "
          >
            {{ massSlotLabels[entry.slot] }}
          </NuxtLink>
        </div>
      </div>

      <div class="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
              Transpose Chords
            </p>
            <p class="text-sm text-zinc-300">
              {{ transposeSummary }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-minus"
              @click="shiftTranspose(-1)"
            >
              Down
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-plus"
              @click="shiftTranspose(1)"
            >
              Up
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-rotate-ccw"
              :disabled="transposeSteps === 0"
              @click="resetTranspose"
            >
              Reset
            </UButton>
          </div>
        </div>

        <div class="space-y-3 border-t border-zinc-800 pt-4">
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
              Text Size
            </p>
            <p class="text-sm text-zinc-300">
              {{ fontSizeSummary }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950/70 px-2 py-1">
              <span class="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Lyrics</span>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-minus"
                :disabled="lyricFontSizePx <= LYRIC_FONT_MIN"
                @click="shiftLyricFontSize(-1)"
              />
              <span class="min-w-12 text-center text-sm text-zinc-100">{{ lyricFontSizePx }}px</span>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-plus"
                :disabled="lyricFontSizePx >= LYRIC_FONT_MAX"
                @click="shiftLyricFontSize(1)"
              />
            </div>

            <div class="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950/70 px-2 py-1">
              <span class="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Chords</span>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-minus"
                :disabled="chordFontSizePx <= CHORD_FONT_MIN"
                @click="shiftChordFontSize(-1)"
              />
              <span class="min-w-12 text-center text-sm text-zinc-100">{{ chordFontSizePx }}px</span>
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-plus"
                :disabled="chordFontSizePx >= CHORD_FONT_MAX"
                @click="shiftChordFontSize(1)"
              />
            </div>

            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-rotate-ccw"
              :disabled="!canResetFontSize"
              @click="resetFontSize"
            >
              Reset Text Size
            </UButton>
          </div>

          <p v-if="metadataSyncError" class="text-xs text-rose-300">
            {{ metadataSyncError }}
          </p>
        </div>
      </div>

      <ChordProRenderer
        :song="renderedSong"
        :lyric-font-size-px="lyricFontSizePx"
        :chord-font-size-px="chordFontSizePx"
      />
    </template>
  </section>
</template>
