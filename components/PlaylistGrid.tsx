import Link from "next/link";
import Image from "next/image";
import type { SpotifyPlaylist } from "@/lib/spotify";

export default function PlaylistGrid({ playlists }: { playlists: SpotifyPlaylist[] }) {
    if (!playlists?.length) {
        return (
            <div className="text-center text-zinc-600 dark:text-zinc-300">
                No playlists found.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {playlists.map((p) => (
                <Link
                    key={p.id}
                    href={p.spotifyUrl}
                    target="_blank"
                    className="group rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
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
            ))}
        </div>
    );
}


