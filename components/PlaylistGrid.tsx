"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useYouTubeAuth } from "./YouTubeAuthProvider";
import type { SpotifyPlaylist } from "@/lib/spotify";

export default function PlaylistGrid({ playlists }: { playlists: SpotifyPlaylist[] }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<string | null>(null);
    const { tokens: youtubeTokens, isConnected: isYouTubeConnected } = useYouTubeAuth();

    if (!playlists?.length) {
        return (
            <div className="text-center text-zinc-600 dark:text-zinc-300">
                No playlists found.
            </div>
        );
    }

    const allSelected = selectedIds.size === playlists.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(playlists.map((p) => p.id)));
        }
    };

    const togglePlaylist = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const exportToJson = () => {
        const selectedPlaylists = playlists.filter((p) => selectedIds.has(p.id));

        const exportData = selectedPlaylists.map((p) => ({
            id: p.id,
            name: p.name,
            url: p.spotifyUrl,
            owner: p.ownerName,
            trackCount: p.trackCount,
        }));

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "en.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportToYouTube = async () => {
        // Check if user has YouTube access
        if (!isYouTubeConnected || !youtubeTokens) {
            setExportStatus("Please connect your YouTube account first by clicking 'Connect YouTube' at the top of the page.");
            setTimeout(() => setExportStatus(null), 5000);
            return;
        }

        setIsExporting(true);
        setExportStatus("Exporting playlists to YouTube Music...");

        try {
            const response = await fetch("/api/youtube/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    playlistIds: Array.from(selectedIds),
                    youtubeAccessToken: youtubeTokens.accessToken,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to export playlists");
            }

            const data = await response.json();
            const results = data.results as Array<{
                success: boolean;
                playlistName?: string;
                addedCount?: number;
                failedCount?: number;
                error?: string;
            }>;

            const successCount = results.filter((r) => r.success).length;
            const totalTracks = results.reduce((sum, r) => sum + (r.addedCount || 0), 0);

            setExportStatus(
                `Successfully exported ${successCount} of ${results.length} playlists with ${totalTracks} total tracks!`
            );

            // Clear selection after successful export
            setTimeout(() => {
                setSelectedIds(new Set());
                setExportStatus(null);
            }, 5000);
        } catch (error) {
            const err = error as { message?: string };
            setExportStatus(`Error: ${err.message || "Unknown error"}`);
            setTimeout(() => setExportStatus(null), 5000);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {selectedIds.size} of {playlists.length} selected
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={exportToYouTube}
                            disabled={selectedIds.size === 0 || isExporting}
                            className="rounded-md border border-red-300 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-600 dark:border-red-700 dark:bg-red-700 dark:hover:bg-red-800 dark:disabled:hover:bg-red-700"
                        >
                            {isExporting ? "Exporting..." : "Create in YouTube Music"}
                        </button>
                        <button
                            onClick={exportToJson}
                            disabled={selectedIds.size === 0}
                            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:disabled:hover:bg-zinc-800"
                        >
                            Export JSON
                        </button>
                        <button
                            onClick={toggleSelectAll}
                            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        >
                            {allSelected ? "Deselect All" : "Select All"}
                        </button>
                    </div>
                </div>
                {exportStatus && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950 dark:text-blue-200">
                        {exportStatus}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {playlists.map((p) => {
                    const isSelected = selectedIds.has(p.id);
                    return (
                        <div
                            key={p.id}
                            className={`group rounded-lg border p-4 shadow-sm transition ${isSelected
                                ? "border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950/30"
                                : "border-zinc-200 bg-white hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <Link
                                    href={p.spotifyUrl}
                                    target="_blank"
                                    className="flex-1"
                                >
                                    <div className="aspect-square w-full overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                                        {p.imageUrl ? (
                                            <Image
                                                src={p.imageUrl}
                                                alt={p.name}
                                                width={600}
                                                height={600}
                                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                No image
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                        <div className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {p.name}
                                        </div>
                                        <div className="mt-1 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                                            {p.ownerName} • {p.trackCount} tracks
                                        </div>
                                    </div>
                                </Link>
                                <label className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white shadow-lg ring-1 ring-black/5 transition hover:bg-zinc-50 dark:bg-zinc-800 dark:ring-white/10 dark:hover:bg-zinc-700">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => togglePlaylist(p.id)}
                                        className="h-5 w-5 cursor-pointer rounded-md border-zinc-300 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 dark:border-zinc-600"
                                    />
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


