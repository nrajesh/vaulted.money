/** Screen size (CSS px), pixel ratio and theme per device in the film. */
export const DEVICES = {
  iphone: { width: 440, height: 956, scale: 3, mobile: true, theme: "light" },
  android: { width: 412, height: 915, scale: 3, mobile: true, theme: "dark" },
  ipad: { width: 1032, height: 1376, scale: 2, mobile: true, theme: "light" },
  // Folded: the narrow cover screen.
  duoFolded: { width: 466, height: 678, scale: 3, mobile: true, theme: "dark" },
  // Unfolded and turned sideways: room for the wide charts.
  duo: { width: 951, height: 669, scale: 3, mobile: true, theme: "dark" },
  desktop: { width: 1440, height: 900, scale: 3, mobile: false, theme: "dark" },
};
