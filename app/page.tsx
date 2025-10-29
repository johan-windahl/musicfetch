import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LoginButton from "@/components/LoginButton";
import YouTubeConnectButton from "@/components/YouTubeConnectButton";
import PlaylistGrid from "@/components/PlaylistGrid";
import { fetchUserPlaylists, type SpotifyPlaylist } from "@/lib/spotify";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-center">
          <h1 className="mb-6 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Spotify Playlists Viewer</h1>
          <LoginButton signedIn={false} />
        </div>
      </div>
    );
  }

  // Get access token from session
  type ExtendedSession = typeof session & { accessToken?: string };
  const accessToken = (session as ExtendedSession).accessToken;

  let error: string | null = null;
  let playlists: SpotifyPlaylist[] = [];
  let needsSpotifyAuth = false;

  if (!accessToken) {
    needsSpotifyAuth = true;
    error = "Please sign in with Spotify to view your playlists.";
  } else {
    try {
      const data = await fetchUserPlaylists({ accessToken });
      playlists = data.items;
    } catch (err: unknown) {
      const apiError = err as { status?: number; retryAfter?: number; message?: string };
      if (apiError?.status === 429) {
        const retryAfter = apiError?.retryAfter ?? 1;
        error = `Rate limited by Spotify. Please try again in ${retryAfter}s.`;
      } else if (apiError?.status === 401) {
        error = "Your session has expired. Please sign in again.";
      } else {
        error = `Failed to load playlists: ${apiError?.message || "Unknown error"}`;
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Your Spotify Playlists</h1>
        <div className="flex gap-2">
          {accessToken && <YouTubeConnectButton />}
          <LoginButton signedIn={true} />
        </div>
      </div>
      {error && needsSpotifyAuth ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950 dark:text-yellow-200">
          <p className="mb-3">{error}</p>
          <LoginButton signedIn={false} />
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      ) : (
        <PlaylistGrid playlists={playlists} />
      )}
    </div>
  );
}
