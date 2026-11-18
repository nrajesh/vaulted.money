/**
 * Every image set the stores (and the Mac product page) need, at the exact
 * pixel sizes they accept. `device` is the capture device the screens inside
 * the frames come from; `shots` are the story's shot ids in that set (shot 6,
 * the two-panel view, only where the screen is big enough to show it).
 */
export const SETS = {
  iphone69: {
    label: 'App Store iPhone 6.9"',
    width: 1320,
    height: 2868,
    device: "iphone",
    shots: [1, 2, 3, 4, 5],
    store: "apple",
  },
  ipad13: {
    label: 'App Store iPad 13"',
    width: 2064,
    height: 2752,
    device: "ipad",
    shots: [1, 2, 3, 4, 5, 6],
    store: "apple",
  },
  duoInner: {
    label: "App Store iPhone Duo (inner)",
    width: 2007,
    height: 2853,
    device: "duoInner",
    shots: [1, 2, 3, 4, 5, 6],
    store: "apple",
  },
  duoOuter: {
    label: "App Store iPhone Duo (outer)",
    width: 1398,
    height: 2034,
    device: "duoOuter",
    shots: [1, 2, 3, 4, 5],
    store: "apple",
  },
  playPhone: {
    label: "Google Play phone",
    width: 1080,
    height: 1920,
    device: "android",
    shots: [1, 2, 3, 4, 5],
    store: "play",
  },
  playTablet7: {
    label: 'Google Play 7" tablet',
    width: 1200,
    height: 1920,
    device: "androidTablet",
    shots: [1, 2, 3, 4, 5, 6],
    store: "play",
  },
  playTablet10: {
    label: 'Google Play 10" tablet',
    width: 1600,
    height: 2560,
    device: "androidTablet",
    shots: [1, 2, 3, 4, 5, 6],
    store: "play",
  },
  playFeature: {
    label: "Google Play feature graphic",
    width: 1024,
    height: 500,
    device: "banner",
    shots: [],
    store: "play",
  },
  mac: {
    label: "Mac (Polar, website)",
    width: 2880,
    height: 1800,
    device: "mac",
    shots: [1, 2, 6],
    store: "mac",
  },
};
