import type { MassSongSelection, MassSongSlot, SessionRecord } from '~/types/chordpro';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';

export interface MassSessionInput {
  title: string;
  date: string;
  songs: MassSongSelection;
}

const MASS_SONG_SLOTS: MassSongSlot[] = ['entrance', 'offering', 'communion', 'communion2', 'exit'];

function createEmptyMassSongs(): MassSongSelection {
  return {
    entrance: '',
    offering: '',
    communion: '',
    communion2: '',
    exit: ''
  };
}

function cloneMassSongs(songs: MassSongSelection): MassSongSelection {
  return {
    entrance: songs.entrance,
    offering: songs.offering,
    communion: songs.communion,
    communion2: songs.communion2,
    exit: songs.exit
  };
}

function sortSessionsByCreatedAtDesc(items: SessionRecord[]): SessionRecord[] {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function normalizeDate(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeSongId(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  return '';
}

function normalizeSessionTitle(value: string, date: string): string {
  const trimmed = value.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  return `Holy Mass ${date}`;
}

function normalizeMassSongs(value: unknown): MassSongSelection {
  const source =
    value && typeof value === 'object'
      ? (value as Partial<Record<MassSongSlot, unknown>>)
      : createEmptyMassSongs();

  return {
    entrance: normalizeSongId(source.entrance),
    offering: normalizeSongId(source.offering),
    communion: normalizeSongId(source.communion),
    communion2: normalizeSongId(source.communion2),
    exit: normalizeSongId(source.exit)
  };
}

function buildUniqueSessionId(base: string, existingIds: Set<string>): string {
  if (!existingIds.has(base)) {
    return base;
  }

  let counter = 2;

  while (existingIds.has(`${base}-${counter}`)) {
    counter += 1;
  }

  return `${base}-${counter}`;
}

function toSessionRecord(snapshot: QueryDocumentSnapshot<DocumentData>): SessionRecord {
  const data = snapshot.data();
  const date = typeof data.date === 'string' ? normalizeDate(data.date) : new Date().toISOString().slice(0, 10);
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString();

  return {
    id: snapshot.id,
    type: 'MASS',
    title: normalizeSessionTitle(typeof data.title === 'string' ? data.title : '', date),
    date,
    songs: normalizeMassSongs(data.songs),
    createdAt,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : createdAt
  };
}

function toSessionDocument(session: SessionRecord) {
  return {
    type: 'MASS',
    title: session.title,
    date: session.date,
    songs: cloneMassSongs(session.songs),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export function useSessionsStore() {
  const firestoreDb = import.meta.client ? useFirestore() : null;
  const sessions = useState<SessionRecord[]>('sessions-store', () => []);
  const isLoading = useState<boolean>('sessions-store-loading', () => false);
  const hasLoaded = useState<boolean>('sessions-store-loaded', () => false);
  const isFirestoreConnected = useState<boolean>('sessions-store-firestore-connected', () => false);
  const syncError = useState<string | null>('sessions-store-sync-error', () => null);

  async function loadMassSessions(options: { force?: boolean } = {}): Promise<void> {
    const shouldForce = options.force ?? false;

    if (isLoading.value) {
      return;
    }

    if (!shouldForce && hasLoaded.value) {
      return;
    }

    if (!firestoreDb) {
      hasLoaded.value = true;
      isFirestoreConnected.value = false;
      return;
    }

    isLoading.value = true;

    try {
      const sessionsCollection = collection(firestoreDb, 'sessions');
      const sessionsSnapshot = await getDocs(query(sessionsCollection, orderBy('createdAt', 'desc')));

      sessions.value = sortSessionsByCreatedAtDesc(
        sessionsSnapshot.docs
          .filter((snapshot) => snapshot.data().type === 'MASS')
          .map(toSessionRecord)
      );

      isFirestoreConnected.value = true;
      syncError.value = null;
    } catch (error) {
      isFirestoreConnected.value = false;
      syncError.value = toErrorMessage(error, 'Unable to sync MASS sessions from Firestore.');
    } finally {
      isLoading.value = false;
      hasLoaded.value = true;
    }
  }

  function getSessionById(id: string): SessionRecord | undefined {
    return sessions.value.find((session) => session.id === id);
  }

  async function createMassSession(input: MassSessionInput): Promise<SessionRecord> {
    const previousSessions = [...sessions.value];
    const date = normalizeDate(input.date);
    const title = normalizeSessionTitle(input.title, date);
    const existingIds = new Set(sessions.value.map((session) => session.id));
    const baseId = `mass-${date}-${slugify(title) || 'session'}`;
    const nowIso = new Date().toISOString();

    const newSession: SessionRecord = {
      id: buildUniqueSessionId(baseId, existingIds),
      type: 'MASS',
      title,
      date,
      songs: normalizeMassSongs(input.songs),
      createdAt: nowIso,
      updatedAt: nowIso
    };

    sessions.value = sortSessionsByCreatedAtDesc([newSession, ...sessions.value]);

    if (!firestoreDb) {
      return newSession;
    }

    try {
      await setDoc(doc(firestoreDb, 'sessions', newSession.id), toSessionDocument(newSession));
      isFirestoreConnected.value = true;
      syncError.value = null;
    } catch (error) {
      sessions.value = previousSessions;
      isFirestoreConnected.value = false;

      const message = toErrorMessage(error, 'Unable to create MASS session in Firestore.');
      syncError.value = message;
      throw new Error(message);
    }

    return newSession;
  }

  async function updateMassSession(id: string, input: MassSessionInput): Promise<SessionRecord | null> {
    const index = sessions.value.findIndex((session) => session.id === id);

    if (index === -1) {
      return null;
    }

    const previousSessions = [...sessions.value];
    const current = sessions.value[index];

    if (!current) {
      return null;
    }

    const date = normalizeDate(input.date);
    const updated: SessionRecord = {
      ...current,
      title: normalizeSessionTitle(input.title, date),
      date,
      songs: normalizeMassSongs(input.songs),
      updatedAt: new Date().toISOString()
    };

    sessions.value = sortSessionsByCreatedAtDesc(
      sessions.value.map((session, currentIndex) => {
        if (currentIndex === index) {
          return updated;
        }

        return session;
      })
    );

    if (!firestoreDb) {
      return updated;
    }

    try {
      await setDoc(doc(firestoreDb, 'sessions', id), toSessionDocument(updated));
      isFirestoreConnected.value = true;
      syncError.value = null;
    } catch (error) {
      sessions.value = previousSessions;
      isFirestoreConnected.value = false;

      const message = toErrorMessage(error, 'Unable to update MASS session in Firestore.');
      syncError.value = message;
      throw new Error(message);
    }

    return updated;
  }

  if (import.meta.client && !hasLoaded.value && !isLoading.value) {
    void loadMassSessions();
  }

  return {
    sessions,
    isLoading,
    isFirestoreConnected,
    syncError,
    loadMassSessions,
    getSessionById,
    createMassSession,
    updateMassSession,
    createEmptyMassSongs,
    massSongSlots: MASS_SONG_SLOTS
  };
}
