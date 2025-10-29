import { NextResponse } from "next/server";

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/youtube/callback`;

    const scope = [
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/userinfo.email",
    ].join(" ");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId!);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return NextResponse.redirect(authUrl.toString());
}
