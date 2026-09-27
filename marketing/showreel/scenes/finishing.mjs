/**
 * Last pass over the frame: exposure flashes and camera shake on the big
 * hits. The white-out after the keyhole dive is the hand-off from scene 1
 * to scene 2. The HUD is left out of the shake, like a real viewfinder.
 */
import { CUES } from "../timeline.mjs";
import { impulse, noise } from "../lib/motion.mjs";
import { style } from "../lib/dom.mjs";

const FLASHES = [
  { time: CUES.diveImpact, strength: 1, decay: 7 },
  { time: CUES.noCloud, strength: 0.1, decay: 9 },
  { time: CUES.track, strength: 0.14, decay: 9 },
  { time: CUES.budget, strength: 0.22, decay: 8 },
  { time: CUES.insight, strength: 0.14, decay: 9 },
  { time: CUES.everywhere, strength: 0.14, decay: 9 },
  { time: CUES.lockup, strength: 0.55, decay: 7 },
];

const SHAKES = [
  { time: CUES.diveImpact, strength: 16 },
  { time: CUES.budget, strength: 9 },
  { time: CUES.everywhere, strength: 6 },
  { time: CUES.lockup, strength: 18 },
];

let flash;
let shaken;

export function mount() {
  flash = document.getElementById("flash");
  shaken = [
    "backdrop",
    "camera",
    "screen-layer",
    "fx",
    "type-layer",
    "lockup-layer",
  ].map((id) => document.getElementById(id));
}

export function render(t) {
  let exposure = 0;
  for (const { time, strength, decay } of FLASHES) {
    exposure = Math.max(exposure, impulse(t, time, decay) * strength);
  }
  style(flash, { opacity: exposure.toFixed(4) });

  // The vault scene shakes its own canvas; everything else shakes here.
  let amount = 0;
  for (const { time, strength } of SHAKES)
    amount += impulse(t, time, 9) * strength;
  const x = noise(t * 38, 1) * amount;
  const y = noise(t * 38, 2) * amount;
  const rotation = noise(t * 30, 3) * amount * 0.02;
  // Overscan slightly while shaking so no edge ever shows.
  const transform =
    amount > 0.05
      ? `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${1 + amount * 0.0022})`
      : "none";
  for (const layer of shaken) style(layer, { transform });
}
