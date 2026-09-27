/**
 * Motion primitives. Everything is a pure function of time so any frame can
 * be rendered in isolation (and re-rendered identically).
 */
export const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
export const lerp = (from, to, amount) => from + (to - from) * amount;

/** 0 → 1 as `t` moves from `start` to `end`, clamped. */
export const progress = (t, start, end) => clamp((t - start) / (end - start));

/** Remap `value` from one range to another, clamped. */
export const remap = (value, inMin, inMax, outMin, outMax) =>
  lerp(outMin, outMax, clamp((value - inMin) / (inMax - inMin)));

export const ease = {
  linear: (x) => x,
  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) * (1 - x),
  inCubic: (x) => x * x * x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inOutCubic: (x) =>
    x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  inQuart: (x) => x * x * x * x,
  outQuart: (x) => 1 - Math.pow(1 - x, 4),
  inOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2),
  outQuint: (x) => 1 - Math.pow(1 - x, 5),
  inExpo: (x) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10)),
  outExpo: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inOutExpo: (x) =>
    x === 0 || x === 1
      ? x
      : x < 0.5
        ? Math.pow(2, 20 * x - 10) / 2
        : (2 - Math.pow(2, -20 * x + 10)) / 2,
  outBack: (x, overshoot = 1.70158) =>
    1 + (overshoot + 1) * Math.pow(x - 1, 3) + overshoot * Math.pow(x - 1, 2),
  inBack: (x, overshoot = 1.70158) =>
    (overshoot + 1) * x * x * x - overshoot * x * x,
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  outSine: (x) => Math.sin((x * Math.PI) / 2),
};

/** Eased progress between two times. */
export const tween = (t, start, end, easing = ease.outCubic) =>
  easing(progress(t, start, end));

/**
 * Analytic damped spring: position of a unit step response `seconds` after
 * release. Underdamped values overshoot and settle, like a real spring.
 */
export function spring(
  seconds,
  { stiffness = 170, damping = 16, mass = 1 } = {},
) {
  if (seconds <= 0) return 0;
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const dampedOmega = omega * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega * seconds);
    return (
      1 -
      envelope *
        (Math.cos(dampedOmega * seconds) +
          ((zeta * omega) / dampedOmega) * Math.sin(dampedOmega * seconds))
    );
  }
  const envelope = Math.exp(-omega * seconds);
  return 1 - envelope * (1 + omega * seconds);
}

/** Deterministic PRNG (mulberry32) so particles are identical every render. */
export function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth 1D value noise in [-1, 1], for handheld drift and shake. */
export function noise(x, seed = 0) {
  const hash = (n) => {
    const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i), hash(i + 1), u);
}

/** A decaying impulse that starts at `start`: 1 at the hit, fading out. */
export const impulse = (t, start, decay = 8) =>
  t < start ? 0 : Math.exp(-(t - start) * decay);

/** Visible only while `start <= t < end`. */
export const within = (t, start, end) => t >= start && t < end;

/** Format a number as euros with grouping, e.g. 24812.4 → "24,812.40". */
export const euros = (value, decimals = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
