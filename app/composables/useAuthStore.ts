import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User
} from 'firebase/auth';

export interface AuthUser {
  uid: string;
  email: string | null;
}

let authListenerCleanup: (() => void) | null = null;

function bindAuthListener(
  auth: Auth | null,
  rawUser: Ref<User | null | undefined>,
  isInitialized: Ref<boolean>
): void {
  if (!import.meta.client || !auth) {
    rawUser.value = null;
    isInitialized.value = true;
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
    },
    () => {
      rawUser.value = null;
      isInitialized.value = true;
    }
  );
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
      return 'Email/password sign-in is disabled for this Firebase project. Enable it in Authentication settings.';
    case 'auth/email-already-in-use':
      return 'This email address is already in use.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
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
  const rawUser = useState<User | null | undefined>('auth-raw-user', () => undefined);
  const isInitialized = useState<boolean>('auth-is-initialized', () => false);

  bindAuthListener(auth, rawUser, isInitialized);

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

  async function createUserAccount(email: string, password: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth is not configured for this app.');
    }

    isBusy.value = true;
    authError.value = null;

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
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
    login,
    createUserAccount,
    logout
  };
}
