/**
 * The Vaulted Money shield, rebuilt as vector geometry.
 *
 * Coordinates were traced from assets/brand/dark-icon.png and are expressed
 * in "logo units": the shield is 940 units tall, centred on the origin.
 * Rebuilding it (rather than scaling the 200px PNG) keeps it razor sharp at
 * 1080p and lets every strut be animated on its own.
 */
export const LOGO_HEIGHT = 940;
export const STRUT_WIDTH = 26;

/** Outer hexagon, clockwise from the top vertex. */
export const OUTER = [
  [0, -462],
  [395, -272],
  [352, 208],
  [0, 462],
  [-352, 208],
  [-395, -272],
];

/** Inner (gem) hexagon, same order. */
export const INNER = [
  [0, -265],
  [193, -180],
  [193, 145],
  [0, 248],
  [-193, 145],
  [-193, -180],
];

/**
 * Every strut as [from, to], where "O3" is outer vertex 3 and "I3" inner.
 * The top sectors carry a single diagonal; the side and bottom sectors are
 * cross-braced, matching the brand mark.
 */
export const STRUTS = {
  outer: [
    ["O0", "O1"],
    ["O1", "O2"],
    ["O2", "O3"],
    ["O0", "O5"],
    ["O5", "O4"],
    ["O4", "O3"],
  ],
  radial: [
    ["O0", "I0"],
    ["O1", "I1"],
    ["O5", "I5"],
    ["O2", "I2"],
    ["O4", "I4"],
    ["O3", "I3"],
  ],
  cross: [
    ["O0", "I1"],
    ["O0", "I5"],
    ["O1", "I2"],
    ["O5", "I4"],
    ["O2", "I1"],
    ["O4", "I5"],
    ["O2", "I3"],
    ["O4", "I3"],
    ["O3", "I2"],
    ["O3", "I4"],
  ],
  inner: [
    ["I0", "I1"],
    ["I1", "I2"],
    ["I2", "I3"],
    ["I0", "I5"],
    ["I5", "I4"],
    ["I4", "I3"],
  ],
};

export const ALL_STRUTS = [
  ...STRUTS.outer,
  ...STRUTS.radial,
  ...STRUTS.cross,
  ...STRUTS.inner,
];

export function vertex(name) {
  const list = name[0] === "O" ? OUTER : INNER;
  return list[Number(name.slice(1))];
}

/** Keyhole: a circle plus a flared stem. */
export const KEYHOLE = {
  circle: { x: 0, y: -60, r: 52 },
  stem: [
    [-23, -28],
    [23, -28],
    [50, 100],
    [-50, 100],
  ],
};

export const COLORS = {
  silverLight: "#e4eaea",
  silver: "#c3cdce",
  silverDark: "#9eabad",
  gemLight: "#98e4e4",
  gem: "#63cbd1",
  gemDeep: "#3aa2ad",
  keyhole: "#1c5a64",
};

/** Keyhole outline as an SVG path (logo units). */
export function keyholePath() {
  const { circle, stem } = KEYHOLE;
  // Circle arc joined to the stem so it reads as one shape.
  const leftAngle = Math.asin(stem[0][0] / circle.r);
  const joinY = circle.y + Math.cos(leftAngle) * circle.r;
  return [
    `M ${stem[0][0]} ${joinY}`,
    `A ${circle.r} ${circle.r} 0 1 1 ${stem[1][0]} ${joinY}`,
    `L ${stem[2][0]} ${stem[2][1]}`,
    `Q 0 ${stem[2][1] + 6} ${stem[3][0]} ${stem[3][1]}`,
    "Z",
  ].join(" ");
}

export const gemPath = () =>
  `M ${INNER.map(([x, y]) => `${x} ${y}`).join(" L ")} Z`;

/**
 * Standalone SVG markup of the finished mark. Each strut gets a data-strut
 * index so scenes can animate them individually.
 */
export function logoSvg(idPrefix = "logo") {
  const struts = ALL_STRUTS.map(([from, to], index) => {
    const [x1, y1] = vertex(from);
    const [x2, y2] = vertex(to);
    return `<line data-strut="${index}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }).join("");
  const [cx, cy] = [0, -8];
  return `
  <svg class="logo-svg" viewBox="-430 -490 860 980" aria-label="Vaulted Money">
    <defs>
      <linearGradient id="${idPrefix}-silver" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${COLORS.silverLight}" />
        <stop offset="0.55" stop-color="${COLORS.silver}" />
        <stop offset="1" stop-color="${COLORS.silverDark}" />
      </linearGradient>
      <linearGradient id="${idPrefix}-gem" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stop-color="${COLORS.gemLight}" />
        <stop offset="0.55" stop-color="${COLORS.gem}" />
        <stop offset="1" stop-color="${COLORS.gemDeep}" />
      </linearGradient>
      <radialGradient id="${idPrefix}-gem-glow" cx="${cx}" cy="${cy}" r="230" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#d8ffff" stop-opacity="0.55" />
        <stop offset="1" stop-color="#d8ffff" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="${idPrefix}-shine" class="shine-gradient" gradientUnits="userSpaceOnUse"
        x1="-1400" y1="-90" x2="-1000" y2="90">
        <stop offset="0" stop-color="#fff" stop-opacity="0" />
        <stop offset="0.5" stop-color="#fff" stop-opacity="0.9" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
      <clipPath id="${idPrefix}-gem-clip"><path d="${gemPath()}" /></clipPath>
    </defs>
    <g class="logo-gem" clip-path="url(#${idPrefix}-gem-clip)">
      <path d="${gemPath()}" fill="url(#${idPrefix}-gem)" />
      <path d="M 0 -265 L 0 248 L 193 145 L 193 -180 Z" fill="#0a3c46" opacity="0.1" />
      <path d="M -193 -180 L 0 -265 L 0 -40 Z" fill="#ffffff" opacity="0.08" />
      <circle cx="${cx}" cy="${cy}" r="230" fill="url(#${idPrefix}-gem-glow)" />
    </g>
    <path class="logo-keyhole" d="${keyholePath()}" fill="${COLORS.keyhole}" />
    <g class="logo-struts" stroke="url(#${idPrefix}-silver)" stroke-width="${STRUT_WIDTH}"
       stroke-linecap="round" stroke-linejoin="round" fill="none">${struts}</g>
    <g class="logo-shine" stroke="url(#${idPrefix}-shine)" stroke-width="${STRUT_WIDTH * 0.6}"
       stroke-linecap="round" fill="none">${struts.replaceAll("data-strut", "data-shine")}
      <path d="${gemPath()}" fill="url(#${idPrefix}-shine)" stroke="none" opacity="0.35" />
    </g>
  </svg>`;
}
