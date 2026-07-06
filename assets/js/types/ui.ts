import type { Video } from './api';

export interface SubtitleWithVideo {
  subtitleId: number;
  videoUrl: string;
  startTime: number;
  text?: string;
  timestamp?: string;
}

export interface LiveCurrentVideo {
  video: Video;
  i: number;
}

export type BookmarksSort = 'recency' | 'dateAsc' | 'dateDesc';

/**
 * Minimal subset of the react-youtube player instance that the app actually calls.
 * Use this to type refs/handlers that interact with the player.
 */
export interface YouTubePlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number) => void;
}
