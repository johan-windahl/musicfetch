import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { fetchUserPlaylists, fetchPlaylistTracks } from "@/lib/spotify";
import { createPlaylist, searchVideo, addVideoToPlaylist } from "@/lib/youtube";

type ExtendedJWT = JWT & {
    accessToken?: string;
    youtubeAccessToken?: string;
};

export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        const extendedToken = token as ExtendedJWT;

        if (!extendedToken || !extendedToken.accessToken) {
            return NextResponse.json({ error: "Unauthorized - No Spotify token" }, { status: 401 });
        }

        const body = await req.json();
        const { playlistIds, youtubeAccessToken } = body as { playlistIds: string[]; youtubeAccessToken: string };

        if (!youtubeAccessToken) {
            return NextResponse.json(
                { error: "Unauthorized - No YouTube token. Please connect YouTube." },
                { status: 401 }
            );
        }

        if (!playlistIds || !Array.isArray(playlistIds) || playlistIds.length === 0) {
            return NextResponse.json({ error: "No playlist IDs provided" }, { status: 400 });
        }

        // Fetch all playlists to get names
        const allPlaylists = await fetchUserPlaylists({
            accessToken: extendedToken.accessToken,
            limit: 50,
        });

        const results = [];

        for (const playlistId of playlistIds) {
            const playlist = allPlaylists.items.find((p) => p.id === playlistId);
            if (!playlist) {
                results.push({
                    playlistId,
                    success: false,
                    error: "Playlist not found",
                });
                continue;
            }

            try {
                // Fetch tracks from Spotify
                const tracks = await fetchPlaylistTracks({
                    accessToken: extendedToken.accessToken,
                    playlistId,
                });

                // Create YouTube playlist
                const youtubePlaylist = await createPlaylist({
                    accessToken: youtubeAccessToken,
                    title: playlist.name,
                    description: `Imported from Spotify - ${tracks.length} tracks`,
                });

                let addedCount = 0;
                let failedCount = 0;
                const failedTracks: string[] = [];

                // Search and add each track
                for (const track of tracks) {
                    try {
                        const query = `${track.name} ${track.artists.join(" ")}`;
                        const video = await searchVideo({
                            accessToken: youtubeAccessToken,
                            query,
                            isrc: track.isrc,
                        });

                        if (video) {
                            await addVideoToPlaylist({
                                accessToken: youtubeAccessToken,
                                playlistId: youtubePlaylist.id,
                                videoId: video.id,
                            });
                            addedCount++;
                        } else {
                            failedCount++;
                            failedTracks.push(`${track.name} - ${track.artists.join(", ")}`);
                        }

                        // Add small delay to avoid rate limiting
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    } catch (error) {
                        failedCount++;
                        failedTracks.push(`${track.name} - ${track.artists.join(", ")}`);
                    }
                }

                results.push({
                    playlistId,
                    playlistName: playlist.name,
                    youtubePlaylistId: youtubePlaylist.id,
                    success: true,
                    totalTracks: tracks.length,
                    addedCount,
                    failedCount,
                    failedTracks: failedTracks.slice(0, 10), // Limit to first 10 failed tracks
                });
            } catch (error) {
                const err = error as { message?: string };
                results.push({
                    playlistId,
                    playlistName: playlist.name,
                    success: false,
                    error: err.message || "Unknown error",
                });
            }
        }

        return NextResponse.json({ results }, { status: 200 });
    } catch (err: unknown) {
        const error = err as { status?: number; message?: string };
        const status = error?.status ?? 500;
        const message = error?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}
