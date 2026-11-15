/**
 * Real screens of the app, captured by capture.mjs into out/screens/.
 *
 * Every image is laid out at the CSS size it was captured at (e.g. 1440×900
 * for desktop, even though the file is 2×), so element boxes from the
 * manifest can be used directly to aim cameras and draw callouts.
 */
let manifest = null;

export async function loadScreens() {
  const response = await fetch("out/screens/manifest.json", {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      "No captured screens. Run `node marketing/showreel/capture.mjs` first.",
    );
  }
  manifest = await response.json();
}

export function screen(name) {
  const entry = manifest?.screens[name];
  if (!entry) throw new Error(`Missing captured screen: ${name}`);
  return { name, src: `out/screens/${name}.png`, ...entry };
}

/** An element box from the manifest, relative to the captured image. */
export function rect(name, key) {
  const entry = screen(name);
  const box = entry.rects[key];
  if (!box) throw new Error(`Screen ${name} has no rect "${key}"`);
  return {
    x: box.x - entry.originX,
    y: box.y - entry.originY,
    width: box.width,
    height: box.height,
  };
}

/** `<img>` markup for a screen at its captured CSS size. */
export const screenImage = (name, className = "") => {
  const entry = screen(name);
  return `<img class="screen-shot ${className}" data-screen="${name}" src="${entry.src}"
    width="${entry.width}" height="${entry.height}" alt="" decoding="sync" />`;
};

/**
 * A div showing just one region of a screen (a card, a dialog…), scaled to
 * `width` CSS px wide. Used for pop-outs and the isometric wall.
 */
export function screenCrop(name, region, width, className = "") {
  const entry = screen(name);
  const scale = width / region.width;
  const height = region.height * scale;
  return `<div class="screen-crop ${className}" style="
      width:${width}px;height:${height}px;
      background-image:url(${entry.src});
      background-size:${entry.width * scale}px ${entry.height * scale}px;
      background-position:${-region.x * scale}px ${-region.y * scale}px"></div>`;
}

/** Wait until every image on the stage is fully decoded. */
export async function decodeAllImages() {
  const images = [...document.querySelectorAll("img")];
  await Promise.all(images.map((image) => image.decode().catch(() => {})));
  // Background-image crops: preload each distinct URL once.
  const urls = new Set(
    [...document.querySelectorAll(".screen-crop")].map(
      (element) => element.style.backgroundImage.match(/url\("?(.*?)"?\)/)?.[1],
    ),
  );
  await Promise.all(
    [...urls].filter(Boolean).map((url) => {
      const image = new Image();
      image.src = url;
      return image.decode().catch(() => {});
    }),
  );
}
