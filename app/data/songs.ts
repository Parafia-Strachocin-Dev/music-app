import type { SongRecord } from '~/types/chordpro';

export const songs: SongRecord[] = [
  {
    id: 'midnight-tram',
    title: 'Midnight Tram',
    artist: 'Lena Frost',
    key: 'Am',
    tempo: 96,
    tags: ['city-folk', 'evening'],
    ownerId: 'u-lena-frost',
    createdAt: '2026-02-10',
    chordPro: `{title: Midnight Tram}
{artist: Lena Frost}
{key: Am}
{tempo: 96}

{comment: Verse 1}
[Am]Streetlights melt on [F]rain-soaked tracks,
[C]silver sparks and [G]camera flashes.
[Am]Last train hums a [F]low refrain,
[C]calling every [E7]name.

{comment: Chorus}
[F]Ride with me through [C]neon weather,
[G]hold this midnight [Am]song together.
[F]If the city [C]drifts away,
[E7]we will still [Am]stay.`
  },
  {
    id: 'paper-kite-parade',
    title: 'Paper Kite Parade',
    artist: 'Milo Hart',
    key: 'D',
    tempo: 124,
    tags: ['pop', 'uplifting'],
    ownerId: 'u-milo-hart',
    createdAt: '2026-02-18',
    chordPro: `{title: Paper Kite Parade}
{artist: Milo Hart}
{key: D}
{tempo: 124}

{comment: Verse 1}
[D]Morning paints the [A]balcony gold,
[Bm]neighbors hum a [G]story told.
[D]Shoelaces loose and [A]headphones loud,
[Bm]we chase sparks across the [G]crowd.

{comment: Chorus}
[G]Paper kites over [D]station roofs,
[A]hearts in sync with [Bm]stomping boots.
[G]Skyline drums and [D]laughing rain,
[A]spin us back a[Bm]gain.`
  },
  {
    id: 'coffee-in-orbit',
    title: 'Coffee in Orbit',
    artist: 'Anya Vale',
    key: 'G',
    tempo: 88,
    tags: ['indie', 'acoustic'],
    ownerId: 'u-anya-vale',
    createdAt: '2026-03-01',
    chordPro: `{title: Coffee in Orbit}
{artist: Anya Vale}
{key: G}
{tempo: 88}

{comment: Verse 1}
[G]Kitchen clock at [D]six-oh-three,
[Em]steam writes poems [C]over tea.
[G]Tiny planets in a [D]porcelain spin,
[Em]morning lets the [C]light drift in.

{comment: Chorus}
[C]Coffee in orbit, [G]slow and bright,
[D]half-asleep but [Em]holding tight.
[C]One more page and [G]one more line,
[D]every day can [Em]rhyme.`
  }
];

export function getSongById(id: string): SongRecord | undefined {
  return songs.find((song) => song.id === id);
}
