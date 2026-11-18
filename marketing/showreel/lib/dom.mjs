import { ICONS } from "../icons.mjs";

/** Parse an HTML string into a single element. */
export function html(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

/** Inline Lucide icon at `size` px. */
export const icon = (name, size = 24, className = "") =>
  `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24">${ICONS[name]}</svg>`;

/**
 * Split text into per-glyph spans inside an overflow mask, so each letter
 * can rise into view independently.
 */
export const glyphs = (text, className = "") =>
  `<span class="mask ${className}">${[...text]
    .map(
      (character) =>
        `<span class="glyph">${character === " " ? "&nbsp;" : character}</span>`,
    )
    .join("")}</span>`;

/** Apply a style object to an element, skipping unchanged values. */
export function style(element, properties) {
  for (const [key, value] of Object.entries(properties)) {
    const text = String(value);
    if (element.style[key] !== text) element.style[key] = text;
  }
}

export function show(element, visible) {
  element.classList.toggle("hidden", !visible);
}
