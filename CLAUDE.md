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
- `NEXTAUTH_URL` - App URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`

Spotify app must have redirect URI: `{NEXTAUTH_URL}/api/auth/callback/spotify`

Required OAuth scopes: `playlist-read-private`, `playlist-read-collaborative`, `user-read-email`

## Architecture

### Authentication Flow

- **NextAuth.js** handles OAuth with Spotify provider
- JWT session strategy (no database)
- Token refresh logic in `lib/auth.ts:18-61` automatically renews expired Spotify access tokens
- Session extends to include `accessToken` and `error` fields via callbacks
- Access tokens stored in JWT, never exposed to browser

### API Layer

- **Route handlers** in `app/api/` follow Next.js App Router conventions
- NextAuth route: `app/api/auth/[...nextauth]/route.ts` - handles OAuth flow
- Playlists endpoint: `app/api/spotify/playlists/route.ts` - fetches user playlists with pagination and rate limit handling
- All API routes use `getToken()` from `next-auth/jwt` for authentication

### Data Flow

1. User authenticates via Spotify OAuth (NextAuth provider)
2. `lib/auth.ts` JWT callback stores access/refresh tokens
3. Server components call `getServerSession()` to get authenticated session
4. `lib/spotify.ts:fetchUserPlaylists()` makes Spotify Web API calls with access token
5. Components render playlist data

### Key Libraries

- `lib/auth.ts` - NextAuth configuration, token refresh logic, type extensions
- `lib/spotify.ts` - Spotify Web API integration, playlist fetching with error handling

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

## Future Development

The README.md:70-76 outlines planned YouTube Music export feature requiring:

- Google OAuth provider addition to NextAuth
- YouTube Data API v3 integration
- Track matching logic (ISRC preferred, fallback to search)
- Quota management and rate limiting
