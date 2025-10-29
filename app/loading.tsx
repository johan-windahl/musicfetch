export default function Loading() {
    return (
        <div className="mx-auto max-w-6xl p-6">
            <div className="mb-6 h-7 w-60 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                        <div className="aspect-square w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
                        <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                ))}
            </div>
        </div>
    );
}


