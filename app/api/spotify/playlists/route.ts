import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { fetchUserPlaylists } from "@/lib/spotify";

export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || !(token as any).accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = Number(searchParams.get("limit") ?? 50);
        const offset = Number(searchParams.get("offset") ?? 0);

        const data = await fetchUserPlaylists({
            accessToken: (token as any).accessToken as string,
            limit,
            offset,
        });

        return NextResponse.json(data, { status: 200 });
    } catch (err: any) {
        if (err?.status === 429) {
            const retryAfter = err?.retryAfter ?? 1;
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
        const status = err?.status ?? 500;
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}


