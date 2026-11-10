/** Marks every demo video on the homepage, so starting one can pause the rest. */
export const DEMO_VIDEO_ATTRIBUTE = "data-demo-video";

/** Pauses every other demo video on the page: only one plays at a time. */
export const pauseOtherDemoVideos = (playing: HTMLVideoElement) => {
  document
    .querySelectorAll<HTMLVideoElement>(`video[${DEMO_VIDEO_ATTRIBUTE}]`)
    .forEach((video) => {
      if (video !== playing) video.pause();
    });
};
