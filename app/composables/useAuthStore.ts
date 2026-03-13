import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface TextPreferences {
  lyricFontSizePx: number;
  chordFontSizePx: number;
}

const LYRIC_FONT_MIN = 12;
const LYRIC_FONT_MAX = 36;
const CHORD_FONT_MIN = 10;
const CHORD_FONT_MAX = 28;

const DEFAULT_TEXT_PREFERENCES: TextPreferences = {
  lyricFontSizePx: 17,
  chordFontSizePx: 12
};

let authListenerCleanup: (() => void) | null = null;
let metadataRequestToken = 0;
let pendingMetadataSaveTimeout: ReturnType<typeof setTimeout> | null = null;

function cloneTextPreferences(preferences: TextPreferences): TextPreferences {
  return {
    lyricFontSizePx: preferences.lyricFontSizePx,
    chordFontSizePx: preferences.chordFontSizePx
  };
}

function clampFontSize(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function hasValidTextPreferences(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const source = value as Partial<Record<keyof TextPreferences, unknown>>;

  const hasValidLyrics =
    typeof source.lyricFontSizePx === 'number' &&
    Number.isFinite(source.lyricFontSizePx) &&
    source.lyricFontSizePx >= LYRIC_FONT_MIN &&
    source.lyricFontSizePx <= LYRIC_FONT_MAX;

  const hasValidChords =
    typeof source.chordFontSizePx === 'number' &&
    Number.isFinite(source.chordFontSizePx) &&
    source.chordFontSizePx >= CHORD_FONT_MIN &&
    source.chordFontSizePx <= CHORD_FONT_MAX;

  return hasValidLyrics && hasValidChords;
}

function normalizeTextPreferences(value: unknown): TextPreferences {
  const source =
    value && typeof value === 'object'
      ? (value as Partial<Record<keyof TextPreferences, unknown>>)
      : {};

  return {
    lyricFontSizePx: clampFontSize(
      source.lyricFontSizePx,
      LYRIC_FONT_MIN,
      LYRIC_FONT_MAX,
      DEFAULT_TEXT_PREFERENCES.lyricFontSizePx
    ),
    chordFontSizePx: clampFontSize(
      source.chordFontSizePx,
      CHORD_FONT_MIN,
      CHORD_FONT_MAX,
      DEFAULT_TEXT_PREFERENCES.chordFontSizePx
    )
  };
}

function areTextPreferencesEqual(left: TextPreferences, right: TextPreferences): boolean {
  return (
    left.lyricFontSizePx === right.lyricFontSizePx &&
    left.chordFontSizePx === right.chordFontSizePx
  );
}

function bindAuthListener(
  auth: Auth | null,
  rawUser: Ref<User | null | undefined>,
  isInitialized: Ref<boolean>,
  onUserChanged: (user: User | null) => void
): void {
  if (!import.meta.client || !auth) {
    rawUser.value = null;
    isInitialized.value = true;
    onUserChanged(null);
    return;
  }

  if (authListenerCleanup) {
    return;
  }

  authListenerCleanup = onAuthStateChanged(
    auth,
    (user) => {
      rawUser.value = user;
      isInitialized.value = true;
      onUserChanged(user);
    },
    () => {
      rawUser.value = null;
      isInitialized.value = true;
      onUserChanged(null);
    }
  );
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function toAuthErrorMessage(error: unknown, fallback: string): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled for this Firebase project. Enable it in Authentication settings.';
    case 'auth/email-already-in-use':
      return 'This email address is already in use.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Allow popups and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled before completion.';
    case 'auth/cancelled-popup-request':
      return 'A sign-in popup is already open. Complete or close it and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Firebase Authentication. Add it in Firebase Authentication settings.';
    default:
      break;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export function useAuthStore() {
  const auth = import.meta.client ? getAuth(useFirebaseApp()) : null;
  const firestoreDb = import.meta.client ? useFirestore() : null;
  const rawUser = useState<User | null | undefined>('auth-raw-user', () => undefined);
  const isInitialized = useState<boolean>('auth-is-initialized', () => false);
  const textPreferences = useState<TextPreferences>('auth-text-preferences', () => {
    return cloneTextPreferences(DEFAULT_TEXT_PREFERENCES);
  });
  const isMetadataSyncing = useState<boolean>('auth-metadata-syncing', () => false);
  const metadataSyncError = useState<string | null>('auth-metadata-sync-error', () => null);

  async function writeUserMetadata(
    user: User,
    preferences: TextPreferences,
    options: { includeCreatedAt?: boolean; merge?: boolean } = {}
  ): Promise<void> {
    if (!firestoreDb) {
      return;
    }

    const nowIso = new Date().toISOString();
    const payload: Record<string, unknown> = {
      email: user.email ?? null,
      metadata: {
        textPreferences: cloneTextPreferences(preferences)
      },
      updatedAt: nowIso
    };

    if (options.includeCreatedAt) {
      payload.createdAt = nowIso;
    }

    const userRef = doc(firestoreDb, 'users', user.uid);

    if (options.merge === false) {
      await setDoc(userRef, payload);
      return;
    }

    await setDoc(userRef, payload, { merge: true });
  }

  async function syncUserMetadata(user: User, token: number): Promise<void> {
    const fallbackPreferences = cloneTextPreferences(DEFAULT_TEXT_PREFERENCES);

    textPreferences.value = fallbackPreferences;
    metadataSyncError.value = null;

    if (!firestoreDb) {
      return;
    }

    isMetadataSyncing.value = true;

    try {
      const userRef = doc(firestoreDb, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      if (token !== metadataRequestToken) {
        return;
      }

      if (!snapshot.exists()) {
        await writeUserMetadata(user, fallbackPreferences, { includeCreatedAt: true, merge: false });

        if (token === metadataRequestToken) {
          textPreferences.value = fallbackPreferences;
        }

        return;
      }

      const data = snapshot.data();
      const metadataSource =
        data.metadata && typeof data.metadata === 'object'
          ? (data.metadata as { textPreferences?: unknown })
          : null;

      const normalizedPreferences = normalizeTextPreferences(metadataSource?.textPreferences);

      textPreferences.value = normalizedPreferences;

      const emailFromDoc =
        typeof data.email === 'string' || data.email === null ? data.email : null;

      if (
        !hasValidTextPreferences(metadataSource?.textPreferences) ||
        emailFromDoc !== (user.email ?? null)
      ) {
        await writeUserMetadata(user, normalizedPreferences);
      }
    } catch (error) {
      if (token !== metadataRequestToken) {
        return;
      }

      textPreferences.value = cloneTextPreferences(DEFAULT_TEXT_PREFERENCES);
      metadataSyncError.value = toErrorMessage(error, 'Unable to sync user metadata from Firestore.');
    } finally {
      if (token === metadataRequestToken) {
        isMetadataSyncing.value = false;
      }
    }
  }

  async function persistTextPreferencesNow(): Promise<void> {
    const user = rawUser.value;

    if (!firestoreDb || !user) {
      return;
    }

    isMetadataSyncing.value = true;
    metadataSyncError.value = null;

    try {
      await writeUserMetadata(user, textPreferences.value);
    } catch (error) {
      metadataSyncError.value = toErrorMessage(error, 'Unable to save user metadata.');
    } finally {
      isMetadataSyncing.value = false;
    }
  }

  function scheduleMetadataSave(): void {
    if (!import.meta.client) {
      return;
    }

    if (pendingMetadataSaveTimeout) {
      clearTimeout(pendingMetadataSaveTimeout);
    }

    pendingMetadataSaveTimeout = setTimeout(() => {
      pendingMetadataSaveTimeout = null;
      void persistTextPreferencesNow();
    }, 250);
  }

  bindAuthListener(auth, rawUser, isInitialized, (user) => {
    metadataRequestToken += 1;
    const token = metadataRequestToken;

    if (pendingMetadataSaveTimeout) {
      clearTimeout(pendingMetadataSaveTimeout);
      pendingMetadataSaveTimeout = null;
    }

    if (!user) {
      textPreferences.value = cloneTextPreferences(DEFAULT_TEXT_PREFERENCES);
      isMetadataSyncing.value = false;
      metadataSyncError.value = null;
      return;
    }

    void syncUserMetadata(user, token);
  });

  const currentUser = computed<AuthUser | null>(() => {
    const user = rawUser.value;

    if (!user) {
      return null;
    }

    return {
      uid: user.uid,
      email: user.email
    };
  });
  const isReady = computed<boolean>(() => isInitialized.value);
  const isBusy = useState<boolean>('auth-busy', () => false);
  const authError = useState<string | null>('auth-error', () => null);

  function updateTextPreferences(input: Partial<TextPreferences>): void {
    const next: TextPreferences = {
      lyricFontSizePx: clampFontSize(
        input.lyricFontSizePx ?? textPreferences.value.lyricFontSizePx,
        LYRIC_FONT_MIN,
        LYRIC_FONT_MAX,
        DEFAULT_TEXT_PREFERENCES.lyricFontSizePx
      ),
      chordFontSizePx: clampFontSize(
        input.chordFontSizePx ?? textPreferences.value.chordFontSizePx,
        CHORD_FONT_MIN,
        CHORD_FONT_MAX,
        DEFAULT_TEXT_PREFERENCES.chordFontSizePx
      )
    };

    if (areTextPreferencesEqual(next, textPreferences.value)) {
      return;
    }

    textPreferences.value = next;
    metadataSyncError.value = null;
    scheduleMetadataSave();
  }

  function resetTextPreferences(): void {
    updateTextPreferences(cloneTextPreferences(DEFAULT_TEXT_PREFERENCES));
  }

  async function login(email: string, password: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth is not configured for this app.');
    }

    isBusy.value = true;
    authError.value = null;

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      const message = toAuthErrorMessage(error, 'Unable to sign in.');
      authError.value = message;
      throw new Error(message);
    } finally {
      isBusy.value = false;
    }
  }

  async function loginWithGoogle(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth is not configured for this app.');
    }

    isBusy.value = true;
    authError.value = null;

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      await signInWithPopup(auth, provider);
    } catch (error) {
      const message = toAuthErrorMessage(error, 'Unable to sign in with Google.');
      authError.value = message;
      throw new Error(message);
    } finally {
      isBusy.value = false;
    }
  }

  async function createUserAccount(email: string, password: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth is not configured for this app.');
    }

    isBusy.value = true;
    authError.value = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const defaults = cloneTextPreferences(DEFAULT_TEXT_PREFERENCES);

      textPreferences.value = defaults;

      try {
        await writeUserMetadata(userCredential.user, defaults, {
          includeCreatedAt: true,
          merge: false
        });
      } catch (error) {
        metadataSyncError.value = toErrorMessage(
          error,
          'User account was created, but user metadata could not be initialized in Firestore.'
        );
      }
    } catch (error) {
      const message = toAuthErrorMessage(error, 'Unable to create account.');
      authError.value = message;
      throw new Error(message);
    } finally {
      isBusy.value = false;
    }
  }

  async function logout(): Promise<void> {
    if (!auth) {
      return;
    }

    isBusy.value = true;
    authError.value = null;

    try {
      await signOut(auth);
    } catch (error) {
      const message = toAuthErrorMessage(error, 'Unable to sign out.');
      authError.value = message;
      throw new Error(message);
    } finally {
      isBusy.value = false;
    }
  }

  return {
    currentUser,
    isReady,
    isBusy,
    authError,
    textPreferences,
    isMetadataSyncing,
    metadataSyncError,
    login,
    loginWithGoogle,
    createUserAccount,
    logout,
    updateTextPreferences,
    resetTextPreferences
  };
}
