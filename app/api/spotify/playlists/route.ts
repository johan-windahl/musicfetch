import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { fetchUserPlaylists } from "@/lib/spotify";

type ExtendedJWT = JWT & {
    accessToken?: string;
};

export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        const extendedToken = token as ExtendedJWT;

        if (!extendedToken || !extendedToken.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = Number(searchParams.get("limit") ?? 50);
        const offset = Number(searchParams.get("offset") ?? 0);

        const data = await fetchUserPlaylists({
            accessToken: extendedToken.accessToken,
            limit,
            offset,
        });

        return NextResponse.json(data, { status: 200 });
    } catch (err: unknown) {
        const error = err as { status?: number; retryAfter?: number; message?: string };

        if (error?.status === 429) {
            const retryAfter = error?.retryAfter ?? 1;
            return new NextResponse(
                JSON.stringify({ error: "Rate limited", retryAfter }),
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(retryAfter),
                        "Content-Type": "application/json",
                    },
                }
            );
        }
        const status = error?.status ?? 500;
        const message = error?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}


