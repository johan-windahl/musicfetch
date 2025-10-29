export type SpotifyPlaylist = {
    id: string;
    name: string;
    imageUrl: string | null;
    ownerName: string;
    trackCount: number;
    spotifyUrl: string;
};

export type SpotifyTrack = {
    name: string;
    artists: string[];
    album: string;
    isrc?: string;
    spotifyUrl: string;
};

type SpotifyApiError = Error & { status?: number; retryAfter?: number };

type SpotifyPlaylistResponse = {
    items: Array<{
        id: string;
        name: string;
        images?: Array<{ url: string }>;
        owner?: { display_name?: string };
        tracks?: { total: number };
        external_urls?: { spotify: string };
    }>;
    total: number;
    limit: number;
    offset: number;
};

export async function fetchUserPlaylists(options: {
    accessToken: string;
    limit?: number;
    offset?: number;
}): Promise<{ items: SpotifyPlaylist[]; total: number; limit: number; offset: number }> {
    const { accessToken, limit = 50, offset = 0 } = options;
    const url = new URL("https://api.spotify.com/v1/me/playlists");
    url.searchParams.set("limit", String(Math.min(50, Math.max(1, limit))));
    url.searchParams.set("offset", String(Math.max(0, offset)));

    const res = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
    });

    if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after") || "1";
        const err: SpotifyApiError = new Error(`Rate limited by Spotify. Retry after ${retryAfter}s`);
        err.status = 429;
        err.retryAfter = Number(retryAfter);
        throw err;
    }

    if (!res.ok) {
        const text = await res.text();
        const err: SpotifyApiError = new Error(`Spotify API error ${res.status}: ${text}`);
        err.status = res.status;
        throw err;
    }

    const data = (await res.json()) as SpotifyPlaylistResponse;

    const items: SpotifyPlaylist[] = data.items.map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.images?.[0]?.url ?? null,
        ownerName: p.owner?.display_name ?? "Unknown",
        trackCount: p.tracks?.total ?? 0,
        spotifyUrl: p.external_urls?.spotify ?? `https://open.spotify.com/playlist/${p.id}`,
    }));

    return { items, total: data.total, limit: data.limit, offset: data.offset };
}

type SpotifyPlaylistTracksResponse = {
    items: Array<{
        track: {
            name: string;
            artists: Array<{ name: string }>;
            album: { name: string };
            external_ids?: { isrc?: string };
            external_urls: { spotify: string };
        } | null;
    }>;
    next: string | null;
};

export async function fetchPlaylistTracks(options: {
    accessToken: string;
    playlistId: string;
}): Promise<SpotifyTrack[]> {
    const { accessToken, playlistId } = options;
    const tracks: SpotifyTrack[] = [];
    let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    while (nextUrl) {
        const res = await fetch(nextUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
        });

        if (res.status === 429) {
            const retryAfter = res.headers.get("retry-after") || "1";
            const err: SpotifyApiError = new Error(`Rate limited by Spotify. Retry after ${retryAfter}s`);
            err.status = 429;
            err.retryAfter = Number(retryAfter);
            throw err;
        }

        if (!res.ok) {
            const text = await res.text();
            const err: SpotifyApiError = new Error(`Spotify API error ${res.status}: ${text}`);
            err.status = res.status;
            throw err;
        }

        const data = (await res.json()) as SpotifyPlaylistTracksResponse;

        for (const item of data.items) {
            if (item.track) {
                tracks.push({
                    name: item.track.name,
                    artists: item.track.artists.map((a) => a.name),
                    album: item.track.album.name,
                    isrc: item.track.external_ids?.isrc,
                    spotifyUrl: item.track.external_urls.spotify,
                });
            }
        }

        nextUrl = data.next;
    }

    return tracks;
}


