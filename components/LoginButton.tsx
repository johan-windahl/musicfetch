"use client";

import { signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function LoginButton({ signedIn }: { signedIn: boolean }) {
    const [loading, setLoading] = useState(false);

    return (
        <button
            onClick={async () => {
                setLoading(true);
                try {
                    if (signedIn) {
                        await signOut();
                    } else {
                        await signIn("spotify");
                    }
                } finally {
                    setLoading(false);
                }
            }}
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            disabled={loading}
        >
            {loading ? "Working..." : signedIn ? "Sign out" : "Sign in with Spotify"}
        </button>
    );
}


