// components/dashboard/_components/SpotifyConnectPlayer.tsx
"use client";

import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Loader2 } from 'lucide-react';

// NOTE: This component assumes a Spotify Access Token is passed in as a prop.
// This token MUST be generated on your server (e.g., via NextAuth) with the 'streaming' scope.

interface SpotifyConnectPlayerProps {
    accessToken: string | null;
}

export default function SpotifyConnectPlayer({ accessToken }: SpotifyConnectPlayerProps) {
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackName, setTrackName] = useState("Loading Player...");
    const [artistName, setArtistName] = useState("Connect to Spotify");
    const [deviceId, setDeviceId] = useState<string | null>(null);
    
    // Placeholder function for playback control (in a real app, this would use fetch/SDK methods)
    const togglePlayback = () => {
        // In a real app: use the SDK player instance to toggle play/pause
        console.log(`Toggling playback on device ${deviceId}`);
        setIsPlaying(prev => !prev);
    };

    // 1. Load the Spotify Web Playback SDK script (Crucial step for Client Components)
    useEffect(() => {
        if (!accessToken) return;

        // Function to create the <script> tag
        const script = document.createElement('script');
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        // Global callback required by the Spotify SDK
        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'My Dashboard Player',
                getOAuthToken: cb => { cb(accessToken); },
                volume: 0.5
            });

            // Ready event
            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                setDeviceId(device_id);
                setIsReady(true);
            });
            
            // Player State Change event
            player.addListener('player_state_changed', (state) => {
                if (!state) return;
                setTrackName(state.track_window.current_track.name);
                setArtistName(state.track_window.current_track.artists.map(a => a.name).join(', '));
                setIsPlaying(!state.paused);
            });

            // Connect to the player
            player.connect();
        };

        // Cleanup: remove the script and disconnect the player (conceptual)
        return () => {
            // Logic to disconnect the player instance would go here
            document.body.removeChild(script);
        };
    }, [accessToken]); // Re-run only if the token changes

    if (!accessToken) {
        return (
            <div className="text-center p-4">
                <Music className="h-6 w-6 mx-auto text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-400">Please **log in with Spotify** to enable music playback.</p>
                {/* NOTE: You need a button here that links to your NextAuth/Auth.js sign-in endpoint: 
                  <button onClick={() => signIn('spotify')}>Login with Spotify</button>
                */}
            </div>
        );
    }
    
    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center p-4 h-full">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mb-2" />
                <p className="text-sm text-zinc-400">Initializing Spotify Player...</p>
            </div>
        );
    }

    // Main Player UI
    return (
        <div className="flex flex-col space-y-3 p-2">
            {/* Track Info */}
            <div className="flex items-center space-x-3">
                <Music className="h-8 w-8 text-indigo-500 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-sm truncate">{trackName}</p>
                    <p className="text-xs text-zinc-400 truncate">{artistName}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-6 text-white">
                <button 
                    title="Previous" 
                    className="p-2 rounded-full hover:bg-zinc-700 transition-colors"
                    // onClick={() => player.previousTrack()}
                >
                    <SkipBack className="h-5 w-5" />
                </button>
                
                <button 
                    title={isPlaying ? "Pause" : "Play"}
                    onClick={togglePlayback}
                    className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg"
                >
                    {isPlaying ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white" />}
                </button>

                <button 
                    title="Next" 
                    className="p-2 rounded-full hover:bg-zinc-700 transition-colors"
                    // onClick={() => player.nextTrack()}
                >
                    <SkipForward className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}