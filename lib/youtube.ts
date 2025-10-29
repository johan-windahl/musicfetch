export type YouTubePlaylist = {
    id: string;
    title: string;
    description: string;
};

export type YouTubeVideo = {
    id: string;
    title: string;
};

type YouTubeApiError = Error & { status?: number };

export async function createPlaylist(options: {
    accessToken: string;
    title: string;
    description?: string;
}): Promise<YouTubePlaylist> {
    const { accessToken, title, description = "" } = options;

    const res = await fetch("https://www.googleapis.com/youtube/v3/playlists?part=snippet,status", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            snippet: {
                title,
                description,
            },
            status: {
                privacyStatus: "private",
            },
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        const err: YouTubeApiError = new Error(`YouTube API error ${res.status}: ${text}`);
        err.status = res.status;
        throw err;
    }

    const data = await res.json();

    return {
        id: data.id,
        title: data.snippet.title,
        description: data.snippet.description,
    };
}

export async function searchVideo(options: {
    accessToken: string;
    query: string;
    isrc?: string;
}): Promise<YouTubeVideo | null> {
    const { accessToken, query, isrc } = options;

    // Try searching with ISRC first if available
    if (isrc) {
        const isrcRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
                isrc
            )}&type=video&videoCategoryId=10&maxResults=1`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (isrcRes.ok) {
            const isrcData = await isrcRes.json();
            if (isrcData.items && isrcData.items.length > 0) {
                return {
                    id: isrcData.items[0].id.videoId,
                    title: isrcData.items[0].snippet.title,
                };
            }
        }
    }

    // Fallback to regular search
    const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
            query
        )}&type=video&videoCategoryId=10&maxResults=1`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!res.ok) {
        const text = await res.text();
        const err: YouTubeApiError = new Error(`YouTube API error ${res.status}: ${text}`);
        err.status = res.status;
        throw err;
    }

    const data = await res.json();

    if (!data.items || data.items.length === 0) {
        return null;
    }

    return {
        id: data.items[0].id.videoId,
        title: data.items[0].snippet.title,
    };
}

export async function addVideoToPlaylist(options: {
    accessToken: string;
    playlistId: string;
    videoId: string;
}): Promise<void> {
    const { accessToken, playlistId, videoId } = options;

    const res = await fetch("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            snippet: {
                playlistId,
                resourceId: {
                    kind: "youtube#video",
                    videoId,
                },
            },
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        const err: YouTubeApiError = new Error(`YouTube API error ${res.status}: ${text}`);
        err.status = res.status;
        throw err;
    }
}
