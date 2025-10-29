# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MusicFetch is a Next.js 16 application that allows users to view their Spotify playlists via OAuth authentication. It's built with TypeScript, Tailwind CSS, and NextAuth.js for authentication. The project is in MVP stage with plans to add YouTube Music export functionality.

## Development Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Environment Setup

Required environment variables in `.env.local`:

- `SPOTIFY_CLIENT_ID` - From Spotify Developer Dashboard
- `SPOTIFY_CLIENT_SECRET` - From Spotify Developer Dashboard
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `NEXTAUTH_URL` - App URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`

### OAuth Setup

**Spotify**:
- Redirect URI: `{NEXTAUTH_URL}/api/auth/callback/spotify`
- Required scopes: `playlist-read-private`, `playlist-read-collaborative`, `user-read-email`

**Google/YouTube** (Custom OAuth, not via NextAuth):
- Redirect URI: `{NEXTAUTH_URL}/api/youtube/callback`
- Enable YouTube Data API v3 in Google Cloud Console
- Required scopes: YouTube API access for reading and managing playlists
- YouTube tokens are stored in localStorage on the client side

## Architecture

### Authentication Flow

**Spotify Authentication:**
- **NextAuth.js** handles Spotify OAuth
- JWT session strategy (no database)
- Token refresh logic in `lib/auth.ts:18-61` automatically renews expired Spotify access tokens
- Session extends to include `accessToken` and `error` fields via callbacks
- Access tokens stored in JWT, never exposed to browser

**YouTube Authentication (Separate from NextAuth):**
- Custom OAuth flow to avoid conflicts with Spotify session
- OAuth initiation: `app/api/youtube/auth/route.ts`
- OAuth callback: `app/api/youtube/callback/route.ts`
- YouTube tokens stored in localStorage via `YouTubeAuthProvider` context
- Users can be authenticated with both Spotify and YouTube simultaneously without session conflicts

### API Layer

- **Route handlers** in `app/api/` follow Next.js App Router conventions
- NextAuth route: `app/api/auth/[...nextauth]/route.ts` - handles Spotify OAuth flow
- Spotify playlists endpoint: `app/api/spotify/playlists/route.ts` - fetches user playlists with pagination and rate limit handling
- YouTube OAuth routes:
  - `app/api/youtube/auth/route.ts` - initiates YouTube OAuth flow
  - `app/api/youtube/callback/route.ts` - handles OAuth callback and returns tokens to client
- YouTube export endpoint: `app/api/youtube/export/route.ts` - handles playlist export workflow, receives YouTube token from client
- Spotify API routes use `getToken()` from `next-auth/jwt` for authentication
- YouTube export accepts YouTube access token in request body from client

### Data Flow

1. User authenticates via Spotify OAuth (NextAuth provider)
2. `lib/auth.ts` JWT callback stores access/refresh tokens
3. Server components call `getServerSession()` to get authenticated session
4. `lib/spotify.ts:fetchUserPlaylists()` makes Spotify Web API calls with access token
5. Components render playlist data

### Key Libraries

- `lib/auth.ts` - NextAuth configuration for Spotify, token refresh logic, type extensions
- `lib/spotify.ts` - Spotify Web API integration, playlist and track fetching with error handling
- `lib/youtube.ts` - YouTube Data API v3 integration, playlist creation, video search, and playlist management

### Client-Side Context Providers

- `components/SessionProvider.tsx` - NextAuth session provider wrapper
- `components/YouTubeAuthProvider.tsx` - React context for managing YouTube OAuth tokens in localStorage, provides `useYouTubeAuth()` hook

### Type Extensions

The codebase extends NextAuth types to include Spotify-specific fields:

- `ExtendedToken` (JWT) includes `accessToken`, `refreshToken`, `expiresAt`, `tokenType`, `scope`, `error`
- `ExtendedSession` includes `accessToken` and `error` fields
- Type assertions used to work with extended session/token types

### Error Handling

- Spotify rate limiting (429) handled with `Retry-After` header propagation
- Token refresh failures set `error` field in session
- API errors typed with `SpotifyApiError` interface including `status` and `retryAfter`

### Image Configuration

Next.js configured to allow Spotify CDN images: `**.spotifycdn.com` and `**.scdn.co`

## Coding guidelines

### Typing

- Never use any

## YouTube Export Workflow

The app supports exporting Spotify playlists to YouTube Music using a dual-authentication system:

### Authentication Architecture

To avoid session conflicts, the app uses:
1. **NextAuth for Spotify** - Server-side JWT session
2. **Custom OAuth for YouTube** - Client-side localStorage tokens

This allows users to maintain both authentications simultaneously without one overwriting the other.

### Export Flow

1. User must first sign in with Spotify (via NextAuth)
2. User clicks "Connect YouTube" button (triggers custom OAuth flow)
3. User is redirected to Google OAuth consent screen
4. After approval, redirected back with tokens in URL fragment
5. `YouTubeAuthProvider` extracts and stores tokens in localStorage
6. User selects playlists and clicks "Create in YouTube Music"
7. Client sends YouTube access token along with playlist IDs to export API
8. For each selected playlist:
   - Fetch all tracks from Spotify API (using server-side Spotify token)
   - Create a new playlist in YouTube (using client-provided YouTube token)
   - For each track:
     - Search YouTube using ISRC if available
     - Fallback to searching by "track name + artists"
     - Add found video to the YouTube playlist
     - Handle failures gracefully with summary
9. Display success/failure summary with track counts

**Important considerations**:
- YouTube tokens stored in localStorage (cleared on logout/disconnect)
- YouTube Data API has daily quota limits (10,000 units/day by default)
- Each playlist creation costs 50 units, each search costs 100 units, each insert costs 50 units
- Large playlists may hit quota limits quickly
- Small delays (100ms) added between requests to avoid rate limiting
- Failed tracks are collected and reported to user
- Spotify session persists independently of YouTube connection
