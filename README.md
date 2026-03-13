# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Firestore Setup (Songs)

This app stores songs in Cloud Firestore collection `songs`.

1. Enable billing on your Firebase project (required by Firestore database creation).
2. Create the default Firestore database:

```bash
firebase firestore:databases:create "(default)" --location europe-central2 --project uwielbiajmy-go-14d48
```

3. Deploy Firestore rules and indexes:

```bash
firebase deploy --only firestore --project uwielbiajmy-go-14d48
```

4. Set Firebase web config in `.env`:

```bash
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=uwielbiajmy-go-14d48
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
```

When Firestore is configured, songs are loaded from Firestore and writes are persisted there.
If Firestore is not configured or unavailable, the app falls back to local seed songs.

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
