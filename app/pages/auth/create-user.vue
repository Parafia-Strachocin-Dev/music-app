<script setup lang="ts">
import type { AuthFormField } from '@nuxt/ui';

interface CreateUserState {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormIssue {
  name: string;
  message: string;
}

const { createUserAccount, currentUser, isBusy, authError } = useAuthStore();

const statusMessage = ref('');

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'new.user@example.com',
    required: true,
    icon: 'i-lucide-mail',
    autocomplete: 'email'
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'At least 6 characters',
    required: true,
    icon: 'i-lucide-lock',
    autocomplete: 'new-password'
  },
  {
    name: 'confirmPassword',
    type: 'password',
    label: 'Confirm Password',
    placeholder: 'Repeat password',
    required: true,
    icon: 'i-lucide-lock-keyhole',
    autocomplete: 'new-password'
  }
];

function validate(state: Partial<CreateUserState>): FormIssue[] {
  const issues: FormIssue[] = [];

  const email = String(state.email ?? '').trim();
  const password = String(state.password ?? '');
  const confirmPassword = String(state.confirmPassword ?? '');

  if (!email) {
    issues.push({ name: 'email', message: 'Email is required.' });
  } else if (!/.+@.+\..+/.test(email)) {
    issues.push({ name: 'email', message: 'Email format is invalid.' });
  }

  if (password.length < 6) {
    issues.push({ name: 'password', message: 'Password must contain at least 6 characters.' });
  }

  if (confirmPassword !== password) {
    issues.push({ name: 'confirmPassword', message: 'Passwords do not match.' });
  }

  return issues;
}

async function submitForm(event: { data: CreateUserState }): Promise<void> {
  statusMessage.value = '';

  try {
    await createUserAccount(event.data.email, event.data.password);
    statusMessage.value = 'Account created successfully.';
    await navigateTo('/songs');
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : 'Unable to create account.';
  }
}
</script>

<template>
  <section class="space-y-6">
    <UAuthForm
      title="Create User"
      description="Create a new Firebase Authentication account."
      icon="i-lucide-user-plus"
      class="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"
      :fields="fields"
      :validate="validate"
      :loading="isBusy"
      :submit="{ label: 'Create Account', icon: 'i-lucide-user-plus', color: 'primary', block: true }"
      @submit="submitForm"
    >
      <template #footer>
        <div class="space-y-3">
          <p class="text-sm text-zinc-300">
            <span v-if="currentUser">Current user: {{ currentUser.email ?? currentUser.uid }}</span>
            <span v-else>Current user: not signed in.</span>
          </p>

          <p v-if="statusMessage" class="text-sm text-zinc-200">
            {{ statusMessage }}
          </p>
          <p v-else-if="authError" class="text-sm text-rose-300">
            {{ authError }}
          </p>

          <UButton to="/auth/login" color="neutral" variant="outline" icon="i-lucide-arrow-left">
            Back To Login
          </UButton>
        </div>
      </template>
    </UAuthForm>
  </section>
</template>
