"use client";

import { useYouTubeAuth } from "./YouTubeAuthProvider";

export default function YouTubeConnectButton() {
    const { isConnected, connectYouTube, disconnect } = useYouTubeAuth();

    if (isConnected) {
        return (
            <button
                onClick={disconnect}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
                Disconnect YouTube
            </button>
        );
    }

    return (
        <button
            onClick={connectYouTube}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
            Connect YouTube
        </button>
    );
}
