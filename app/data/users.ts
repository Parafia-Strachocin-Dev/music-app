import type { UserProfile } from '~/types/chordpro';

export const users: UserProfile[] = [
  {
    id: 'u-lena-frost',
    name: 'Lena Frost',
    email: 'lena@chordapp.local',
    role: 'editor',
    instrument: 'Acoustic Guitar',
    location: 'Gdansk, Poland',
    bio: 'Writes mellow city-folk songs and collects unusual chord voicings.'
  },
  {
    id: 'u-milo-hart',
    name: 'Milo Hart',
    email: 'milo@chordapp.local',
    role: 'admin',
    instrument: 'Piano',
    location: 'Wroclaw, Poland',
    bio: 'Keeps the song library clean and loves cinematic pop progressions.'
  },
  {
    id: 'u-anya-vale',
    name: 'Anya Vale',
    email: 'anya@chordapp.local',
    role: 'viewer',
    instrument: 'Ukulele',
    location: 'Krakow, Poland',
    bio: 'Tests arrangements for beginner singers and classroom sessions.'
  }
];

export function getUserById(id: string): UserProfile | undefined {
  return users.find((user) => user.id === id);
}