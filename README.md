This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Set to your local or deployed URL (no trailing slash)
NEXTAUTH_URL=http://localhost:3000

# Generate a strong random secret (e.g. `openssl rand -base64 32`)
NEXTAUTH_SECRET=your_nextauth_secret
```

### Spotify App Setup

- Create a Spotify Developer app at `https://developer.spotify.com/dashboard`
- Add a Redirect URI: `http://localhost:3000/api/auth/callback/spotify`
- Copy the Client ID and Client Secret into `.env.local`
- Required scopes: `playlist-read-private playlist-read-collaborative user-read-email`

### Google/YouTube App Setup

- Create a Google Cloud project at `https://console.cloud.google.com/`
- Enable the YouTube Data API v3
- Create OAuth 2.0 credentials
- Add these Authorized redirect URIs:
  - `http://localhost:3000/api/youtube/callback`
  - `http://127.0.0.1:3000/api/youtube/callback`
- Copy the Client ID and Client Secret into `.env.local`
- Required scopes: YouTube API access for playlist creation and management

### Install Dependencies

Add NextAuth to the project:

```bash
npm install next-auth
```

If you use a different package manager, install the equivalent dependency.

## YouTube Music Export

The application now supports exporting Spotify playlists to YouTube Music:

- Sign in with both Spotify and Google accounts
- Select playlists you want to export
- Click "Create in YouTube Music" button
- The app will:
  1. Fetch all tracks from selected Spotify playlists
  2. Create corresponding playlists in YouTube Music
  3. Search for matching videos on YouTube (using ISRC when available)
  4. Add found videos to the new playlists
  5. Display a summary of successful and failed track imports

**Note**: YouTube Data API has quota limits. Large playlists may take time to export.
