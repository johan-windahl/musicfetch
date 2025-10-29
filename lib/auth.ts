import type { NextAuthOptions, Account, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Spotify from "next-auth/providers/spotify";

type ExtendedToken = {
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number; // unix ms
    tokenType?: string;
    scope?: string;
    error?: string;
};

async function refreshSpotifyAccessToken(token: ExtendedToken): Promise<ExtendedToken> {
    if (!token.refreshToken) {
        return { ...token, error: "NoRefreshToken" };
    }

    const basicAuth = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const params = new URLSearchParams();
    params.set("grant_type", "refresh_token");
    params.set("refresh_token", token.refreshToken);

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });

    if (!response.ok) {
        return { ...token, error: "RefreshAccessTokenError" };
    }

    const refreshed = (await response.json()) as {
        access_token: string;
        token_type: string;
        scope?: string;
        expires_in: number; // seconds
        refresh_token?: string;
    };

    return {
        ...token,
        accessToken: refreshed.access_token,
        tokenType: refreshed.token_type,
        scope: refreshed.scope ?? token.scope,
        expiresAt: Date.now() + refreshed.expires_in * 1000 - 10_000, // 10s safety window
        refreshToken: refreshed.refresh_token ?? token.refreshToken,
        error: undefined,
    };
}

export const authOptions: NextAuthOptions = {
    providers: [
        Spotify({
            clientId: process.env.SPOTIFY_CLIENT_ID!,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: [
                        "playlist-read-private",
                        "playlist-read-collaborative",
                        "user-read-email",
                    ].join(" "),
                    show_dialog: true,
                },
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    debug: process.env.NODE_ENV === "development",
    callbacks: {
        async jwt({ token, account }: { token: JWT; account: Account | null }) {
            let working = token as ExtendedToken;

            // Initial sign in
            if (account) {
                working = {
                    ...working,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    tokenType: account.token_type,
                    scope: account.scope,
                    expiresAt: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600_000,
                };
            }

            // If token is not expired, return it
            if (working.expiresAt && Date.now() < working.expiresAt) {
                return working;
            }

            // Refresh access token
            return await refreshSpotifyAccessToken(working);
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            // Expose access token to server-side session (not sent to browser)
            const extendedToken = token as ExtendedToken;
            type ExtendedSession = Session & { accessToken?: string; error?: string };
            const extendedSession = session as ExtendedSession;

            extendedSession.user = extendedSession.user ?? {};
            if (extendedSession.user) {
                (extendedSession.user as { id?: string }).id = extendedToken.sub;
            }
            extendedSession.accessToken = extendedToken.accessToken;
            extendedSession.error = extendedToken.error;

            return extendedSession;
        },
    },
    // Ensure we have a secret for JWT
    secret: process.env.NEXTAUTH_SECRET,
};



