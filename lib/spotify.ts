export type SpotifyPlaylist = {
    id: string;
    name: string;
    imageUrl: string | null;
    ownerName: string;
    trackCount: number;
    spotifyUrl: string;
};

export async function fetchUserPlaylists(options: {
    accessToken: string;
    limit?: number;
    offset?: number;
}): Promise<{ items: SpotifyPlaylist[]; total: number; limit: number; offset: number } & { _raw?: any }> {
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
        const err = new Error(`Rate limited by Spotify. Retry after ${retryAfter}s`);
        (err as any).status = 429;
        (err as any).retryAfter = Number(retryAfter);
        throw err;
    }

    if (!res.ok) {
        const text = await res.text();
        const err = new Error(`Spotify API error ${res.status}: ${text}`);
        (err as any).status = res.status;
        throw err;
    }

    const data = (await res.json()) as {
        items: any[];
        total: number;
        limit: number;
        offset: number;
    };

    const items: SpotifyPlaylist[] = data.items.map((p: any) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.images?.[0]?.url ?? null,
        ownerName: p.owner?.display_name ?? "Unknown",
        trackCount: p.tracks?.total ?? 0,
        spotifyUrl: p.external_urls?.spotify ?? `https://open.spotify.com/playlist/${p.id}`,
    }));

    return { items, total: data.total, limit: data.limit, offset: data.offset, _raw: data };
}


