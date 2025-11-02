"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import {
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Music,
    Loader2,
} from "lucide-react";
import { FaSpotify } from "react-icons/fa";

interface SpotifyConnectPlayerProps {
    accessToken: string | null;
}
declare global {
    interface Window {
        Spotify: any;
        onSpotifyWebPlaybackSDKReady: () => void;
    }
}

export default function SpotifyConnectPlayer({
    accessToken,
}: SpotifyConnectPlayerProps) {
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackName, setTrackName] = useState("Loading Player...");
    const [artistName, setArtistName] = useState("Connect to Spotify");
    const [_deviceId, setDeviceId] = useState<string | null>(null);
    const [player, setPlayer] = useState<any | null>(null); // Store the player instance

    // 1. Load the Spotify Web Playback SDK script
    useEffect(() => {
        if (!accessToken) return;

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const playerInstance = new window.Spotify.Player({
                name: "My Dashboard Player",
                getOAuthToken: (cb: (token: string) => void) => {
                    cb(accessToken);
                },
                volume: 0.5,
            });

            // Store the player instance in state
            setPlayer(playerInstance);

            // Ready event
            playerInstance.addListener(
                "ready",
                ({ device_id }: { device_id: string }) => {
                    console.log("Ready with Device ID", device_id);
                    setDeviceId(device_id);
                    setIsReady(true);
                }
            );

            // Player State Change event
            playerInstance.addListener("player_state_changed", (state: any) => {
                if (!state) return;
                setTrackName(state.track_window.current_track.name);
                setArtistName(
                    state.track_window.current_track.artists
                        .map((a: any) => a.name)
                        .join(", ")
                );
                setIsPlaying(!state.paused);
            });

            // Connect to the player
            playerInstance.connect();
        };

        // Cleanup
        return () => {
            player?.disconnect();
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]); // Re-run only if the token changes

    // --- Playback Control Functions ---
    const togglePlayback = () => {
        if (!player) return;
        player.togglePlay();
    };

    const nextTrack = () => {
        if (!player) return;
        player.nextTrack();
    };

    const prevTrack = () => {
        if (!player) return;
        player.previousTrack();
    };

    // --- 1. The "Login Card" ---
    // This is shown when accessToken is null (user is logged out)
    if (!accessToken) {
        return (
            <div className='text-center p-4 flex flex-col items-center justify-center h-full'>
                <Music className='h-6 w-6 mx-auto text-zinc-600 mb-3' />
                <p className='text-sm text-zinc-400 mb-4'>
                    Connect Spotify to control your music.
                </p>

                {/* This is the actual login button */}
                <button
                    onClick={() => signIn("spotify")}
                    className='flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors'
                >
                    <FaSpotify className='h-5 w-5' />
                    Login with Spotify
                </button>
            </div>
        );
    }

    // --- This is shown while the player is loading ---
    if (!isReady) {
        return (
            <div className='flex flex-col items-center justify-center p-4 h-full'>
                <Loader2 className='h-6 w-6 animate-spin text-indigo-400 mb-2' />
                <p className='text-sm text-zinc-400'>
                    Initializing Spotify Player...
                </p>
            </div>
        );
    }

    // --- 2. The "Music Player" ---
    // This is shown when accessToken is present and the player is ready
    return (
        <div className='flex flex-col space-y-3 p-2'>
            {/* Track Info */}
            <div className='flex items-center space-x-3'>
                <Music className='h-8 w-8 text-indigo-500 shrink-0' />
                <div>
                    <p className='font-semibold text-sm truncate'>
                        {trackName}
                    </p>
                    <p className='text-xs text-zinc-400 truncate'>
                        {artistName}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className='flex justify-center space-x-6 text-white'>
                <button
                    title='Previous'
                    className='p-2 rounded-full hover:bg-zinc-700 transition-colors'
                    onClick={prevTrack}
                >
                    <SkipBack className='h-5 w-5' />
                </button>

                <button
                    title={isPlaying ? "Pause" : "Play"}
                    onClick={togglePlayback}
                    className='p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg'
                >
                    {isPlaying ? (
                        <Pause className='h-6 w-6 fill-white' />
                    ) : (
                        <Play className='h-6 w-6 fill-white' />
                    )}
                </button>

                <button
                    title='Next'
                    className='p-2 rounded-full hover:bg-zinc-700 transition-colors'
                    onClick={nextTrack}
                >
                    <SkipForward className='h-5 w-5' />
                </button>
            </div>
        </div>
    );
}
