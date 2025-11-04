"use client";

import {
  Loader2,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
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
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <Music className="mx-auto mb-3 h-6 w-6 text-zinc-600" />
        <p className="mb-4 text-sm text-zinc-400">
          Connect Spotify to control your music.
        </p>

        {/* This is the actual login button */}
        <button
          className="flex items-center justify-center gap-2 rounded-full bg-green-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-600"
          onClick={() => signIn("spotify")}
        >
          <FaSpotify className="h-5 w-5" />
          Login with Spotify
        </button>
      </div>
    );
  }

  // --- This is shown while the player is loading ---
  if (!isReady) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <Loader2 className="mb-2 h-6 w-6 animate-spin text-indigo-400" />
        <p className="text-sm text-zinc-400">Initializing Spotify Player...</p>
      </div>
    );
  }

  // --- 2. The "Music Player" ---
  // This is shown when accessToken is present and the player is ready
  return (
    <div className="flex flex-col space-y-3 p-2">
      {/* Track Info */}
      <div className="flex items-center space-x-3">
        <Music className="h-8 w-8 shrink-0 text-indigo-500" />
        <div>
          <p className="truncate font-semibold text-sm">{trackName}</p>
          <p className="truncate text-xs text-zinc-400">{artistName}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-6 text-white">
        <button
          className="rounded-full p-2 transition-colors hover:bg-zinc-700"
          onClick={prevTrack}
          title="Previous"
        >
          <SkipBack className="h-5 w-5" />
        </button>

        <button
          className="rounded-full bg-indigo-600 p-3 shadow-lg transition-colors hover:bg-indigo-700"
          onClick={togglePlayback}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 fill-white" />
          ) : (
            <Play className="h-6 w-6 fill-white" />
          )}
        </button>

        <button
          className="rounded-full p-2 transition-colors hover:bg-zinc-700"
          onClick={nextTrack}
          title="Next"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
