import { users as userSeeds } from '~/data/users';
import type { UserProfile } from '~/types/chordpro';

export interface UserInput {
  name: string;
  email: string;
  role: UserProfile['role'];
  instrument: string;
  location: string;
  bio: string;
}

function cloneUser(user: UserProfile): UserProfile {
  return { ...user };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildUniqueUserId(base: string, existingIds: Set<string>): string {
  if (!existingIds.has(base)) {
    return base;
  }

  let counter = 2;

  while (existingIds.has(`${base}-${counter}`)) {
    counter += 1;
  }

  return `${base}-${counter}`;
}

export function useUsersStore() {
  const users = useState<UserProfile[]>('users-store', () => userSeeds.map(cloneUser));

  function getUserById(id: string): UserProfile | undefined {
    return users.value.find((user) => user.id === id);
  }

  function createUser(input: UserInput): UserProfile {
    const existingIds = new Set(users.value.map((user) => user.id));
    const base = slugify(input.name) || `user-${users.value.length + 1}`;

    const newUser: UserProfile = {
      id: buildUniqueUserId(`u-${base}`, existingIds),
      name: input.name.trim(),
      email: input.email.trim(),
      role: input.role,
      instrument: input.instrument.trim(),
      location: input.location.trim(),
      bio: input.bio.trim()
    };

    users.value = [newUser, ...users.value];
    return newUser;
  }

  function updateUser(id: string, input: UserInput): UserProfile | null {
    const index = users.value.findIndex((user) => user.id === id);

    if (index === -1) {
      return null;
    }

    const current = users.value[index];

    if (!current) {
      return null;
    }

    const updated: UserProfile = {
      ...current,
      name: input.name.trim(),
      email: input.email.trim(),
      role: input.role,
      instrument: input.instrument.trim(),
      location: input.location.trim(),
      bio: input.bio.trim()
    };

    users.value = users.value.map((user, currentIndex) => {
      if (currentIndex === index) {
        return updated;
      }

      return user;
    });

    return updated;
  }

  return {
    users,
    getUserById,
    createUser,
    updateUser
  };
}
