// Video template library - hook and animation presets

export { useVideoPlayer, useSceneTimer, useScenePhases } from './hooks';
export type { SceneDurations, UseVideoPlayerOptions, UseVideoPlayerReturn } from './hooks';
export { VideoPlayerContext, useVideoPlayerContext } from './VideoPlayerContext';
export type { VideoPlayerContextValue } from './VideoPlayerContext';

export {
  springs,
  easings,
  sceneTransitions,
  elementAnimations,
  charVariants,
  charContainerVariants,
  staggerConfigs,
  containerVariants,
  itemVariants,
  staggerDelay,
  customSpring,
  withDelay,
} from './animations';
