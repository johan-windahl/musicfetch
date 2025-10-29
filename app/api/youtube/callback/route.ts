import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?youtube_error=${error}`);
    }

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?youtube_error=no_code`);
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${process.env.NEXTAUTH_URL}/api/youtube/callback`,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("Token exchange failed:", errorText);
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?youtube_error=token_exchange_failed`);
        }

        const tokens = await tokenResponse.json();

        // Redirect back to main page with tokens in URL fragment (client-side only)
        const redirectUrl = new URL(process.env.NEXTAUTH_URL!);
        redirectUrl.hash = `youtube_access_token=${tokens.access_token}&youtube_refresh_token=${tokens.refresh_token || ""}&youtube_expires_in=${tokens.expires_in}`;

        return NextResponse.redirect(redirectUrl.toString());
    } catch (err) {
        console.error("YouTube OAuth error:", err);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?youtube_error=unknown`);
    }
}
