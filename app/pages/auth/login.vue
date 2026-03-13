<script setup lang="ts">
import type { AuthFormField } from '@nuxt/ui';

interface LoginState {
  email: string;
  password: string;
}

interface FormIssue {
  name: string;
  message: string;
}

const { login, logout, currentUser, isReady, isBusy, authError } = useAuthStore();

const statusMessage = ref('');

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'you@example.com',
    required: true,
    icon: 'i-lucide-mail',
    autocomplete: 'email'
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Enter password',
    required: true,
    icon: 'i-lucide-lock',
    autocomplete: 'current-password'
  }
];

function validate(state: Partial<LoginState>): FormIssue[] {
  const issues: FormIssue[] = [];

  const email = String(state.email ?? '').trim();
  const password = String(state.password ?? '');

  if (!email) {
    issues.push({ name: 'email', message: 'Email is required.' });
  } else if (!/.+@.+\..+/.test(email)) {
    issues.push({ name: 'email', message: 'Email format is invalid.' });
  }

  if (!password.trim()) {
    issues.push({ name: 'password', message: 'Password is required.' });
  }

  return issues;
}

async function submitForm(event: { data: LoginState }): Promise<void> {
  statusMessage.value = '';

  try {
    await login(event.data.email, event.data.password);
    statusMessage.value = 'Signed in successfully.';
    await navigateTo('/songs');
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'Unable to sign in.';
  }
}

async function handleSignOut(): Promise<void> {
  statusMessage.value = '';

  try {
    await logout();
    statusMessage.value = 'Signed out.';
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'Unable to sign out.';
  }
}
</script>

<template>
  <section class="space-y-6">
    <div v-if="!isReady" class="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">
      Initializing authentication...
    </div>

    <UAuthForm
      v-else
      title="Login"
      description="Sign in with your Firebase Authentication email and password."
      icon="i-lucide-log-in"
      class="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"
      :fields="fields"
      :validate="validate"
      :loading="isBusy"
      :submit="{ label: 'Sign In', icon: 'i-lucide-log-in', color: 'primary', block: true }"
      @submit="submitForm"
    >
      <template #footer>
        <div class="space-y-3">
          <p class="text-sm text-zinc-300">
            <span v-if="currentUser">Signed in as {{ currentUser.email ?? currentUser.uid }}.</span>
            <span v-else>Not signed in.</span>
          </p>

          <p v-if="statusMessage" class="text-sm text-zinc-200">
            {{ statusMessage }}
          </p>
          <p v-else-if="authError" class="text-sm text-rose-300">
            {{ authError }}
          </p>

          <div class="flex flex-wrap gap-2">
            <UButton to="/auth/create-user" color="neutral" variant="outline" icon="i-lucide-user-plus">
              Create User
            </UButton>
            <UButton
              v-if="currentUser"
              color="neutral"
              variant="outline"
              icon="i-lucide-log-out"
              :loading="isBusy"
              @click="handleSignOut"
            >
              Sign out
            </UButton>
          </div>
        </div>
      </template>
    </UAuthForm>
  </section>
</template>
