"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type YouTubeTokens = {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
};

type YouTubeAuthContextType = {
    tokens: YouTubeTokens | null;
    isConnected: boolean;
    connectYouTube: () => void;
    disconnect: () => void;
};

const YouTubeAuthContext = createContext<YouTubeAuthContextType | null>(null);

export function YouTubeAuthProvider({ children }: { children: ReactNode }) {
    const [tokens, setTokens] = useState<YouTubeTokens | null>(null);

    useEffect(() => {
        // Load tokens from localStorage on mount
        const savedTokens = localStorage.getItem("youtube_tokens");
        if (savedTokens) {
            const parsed = JSON.parse(savedTokens) as YouTubeTokens;
            // Check if token is still valid
            if (parsed.expiresAt > Date.now()) {
                setTokens(parsed);
            } else {
                localStorage.removeItem("youtube_tokens");
            }
        }

        // Check for tokens in URL hash (from OAuth callback)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("youtube_access_token");
        const refreshToken = params.get("youtube_refresh_token");
        const expiresIn = params.get("youtube_expires_in");

        if (accessToken && expiresIn) {
            const newTokens: YouTubeTokens = {
                accessToken,
                refreshToken: refreshToken || undefined,
                expiresAt: Date.now() + parseInt(expiresIn) * 1000,
            };
            setTokens(newTokens);
            localStorage.setItem("youtube_tokens", JSON.stringify(newTokens));
            // Clean up URL
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
    }, []);

    const connectYouTube = () => {
        window.location.href = "/api/youtube/auth";
    };

    const disconnect = () => {
        setTokens(null);
        localStorage.removeItem("youtube_tokens");
    };

    const isConnected = tokens !== null && tokens.expiresAt > Date.now();

    return (
        <YouTubeAuthContext.Provider value={{ tokens, isConnected, connectYouTube, disconnect }}>
            {children}
        </YouTubeAuthContext.Provider>
    );
}

export function useYouTubeAuth() {
    const context = useContext(YouTubeAuthContext);
    if (!context) {
        throw new Error("useYouTubeAuth must be used within YouTubeAuthProvider");
    }
    return context;
}
