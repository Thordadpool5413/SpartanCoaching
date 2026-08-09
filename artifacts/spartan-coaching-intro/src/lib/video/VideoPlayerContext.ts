import { createContext, useContext } from 'react';

export interface VideoPlayerContextValue {
  paused: boolean;
}

export const VideoPlayerContext = createContext<VideoPlayerContextValue>({ paused: false });
export const useVideoPlayerContext = () => useContext(VideoPlayerContext);
