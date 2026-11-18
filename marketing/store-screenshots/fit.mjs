/**
 * Headline fitting, shared by the Node side (tests) and the slide page
 * (which measures with a canvas). No Node or DOM imports, so both can load it.
 */
/**
 * Largest font size (px, at most `startPx`) at which the headline, wrapped
 * greedily by words, has no line wider than `maxWidthPx` and at most
 * `maxLines` lines. `measure(text, px)`
 * returns a line's width at that size (canvas measureText in the renderer).
 */
export function fitHeadline(text, maxWidthPx, startPx, measure, maxLines = 3) {
  const words = text.replace(/\*/g, "").split(/\s+/).filter(Boolean);
  const fits = (px) => {
    let line = "";
    let lines = 1;
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate, px) <= maxWidthPx) line = candidate;
      else if (!line || measure(word, px) > maxWidthPx) return false;
      else {
        line = word;
        lines += 1;
      }
    }
    return lines <= maxLines;
  };
  let px = startPx;
  while (px > 8 && !fits(px)) px -= 1;
  return px;
}
