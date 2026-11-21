/**
 * Builds the data for one store image: which page style, which captured
 * screens go in which device pose, and the caption text. Pure, so the
 * decisions the design fixed (face-off pair, alternating themes, shot 4's
 * crop, sideways small tablets) are unit-tested; slide.html only draws it.
 */
import { createRequire } from "node:module";
import { SETS } from "./sets.mjs";

const require = createRequire(import.meta.url);
const story = require("../shared/story.json");

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** `*word*` becomes `<em>word</em>` (the accent colour); everything else is escaped. */
export function headlineToHtml(text) {
  return escapeHtml(text).replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export { fitHeadline } from "./fit.mjs";

const other = (theme) => (theme === "dark" ? "light" : "dark");

/**
 * `crops` maps a capture file to the share of its screen to show, as
 * measured by the capture (shot 4 ends just below the agent card's title);
 * without one the story's `visibleFraction` (or the whole screen) is used.
 */
export function buildSlide(setId, shotId, strings, crops = {}) {
  const set = SETS[setId];
  const shot = story.find((s) => s.id === shotId);
  const text = strings[String(shotId)];
  if (!set || !shot || !text)
    throw new Error(`No slide for set "${setId}" shot ${shotId}`);

  const image = (theme) => `${set.device}-${theme}-${shotId}.png`;
  const crop = (theme) => crops[image(theme)] ?? shot.visibleFraction ?? 1;
  // Tablets (and the open Duo) are too wide to sit two abreast at a
  // readable size: they show one large device instead of the pair.
  const pair =
    shot.pair && !["ipad", "androidTablet", "duoInner"].includes(set.device);
  const devices = pair
    ? [
        {
          image: image("dark"),
          theme: "dark",
          transform: "faceLeft",
          visibleFraction: crop("dark"),
        },
        {
          image: image("light"),
          theme: "light",
          transform: "faceRight",
          visibleFraction: crop("light"),
        },
      ]
    : [
        {
          image: image(shot.appTheme),
          theme: shot.appTheme,
          transform: shot.landscape?.includes(set.device)
            ? "sideways"
            : "straight",
          visibleFraction: crop(shot.appTheme),
        },
      ];

  return {
    width: set.width,
    height: set.height,
    device: set.device,
    page: shot.page,
    pageAccent: other(shot.page),
    headlineHtml: headlineToHtml(text.headline),
    headline: text.headline,
    sub: text.sub,
    body: text.body,
    callouts: text.callouts ?? [],
    breaks: text.breaks,
    devices,
    statusBar: { time: "9:41", network: "5G" },
  };
}
