/**
 * The natural-language search video.
 *
 *   dark desktop  -> "expenses over 20 last month in grocries"
 *   theme button  -> light
 *   light desktop -> "show me the largest expense coming up in next 2 weeks in checking account"
 *   dock desktop  -> the same kind of search on a phone-sized screen
 *   end card      -> flips in (light), then turns dark; badges + QR code
 *
 * To make a video about another feature, copy this file and change the scenes.
 */
const fs = require("fs");
const path = require("path");
const { createStage, wait } = require("./lib/stage.cjs");

const OUT = path.join(__dirname, "out");
const BASE = process.env.BASE_URL || "http://127.0.0.1:5199";
const assets = JSON.parse(fs.readFileSync(path.join(OUT, "assets.json"), "utf8"));

const QUERY_1 = "expenses over 20 last month in grocries ";
const QUERY_2 = "show me the largest expense coming up in next 2 weeks in checking account ";

(async () => {
  const stage = await createStage({
    baseUrl: BASE,
    outDir: OUT,
    assets,
    endCard: {
      title: "Vaulted Money",
      tagline: "Natural-language search, built in.",
      // The three points from the website footer.
      badges: [
        { cls: "g", text: "Privacy-first" },
        { cls: "b", text: "Data-local" },
        { cls: "o", text: "Open-sourced" },
      ],
      url: "vaulted.money",
    },
  });
  const { page, caption, click, type, zoomTo, mark, sound } = stage;
  const FULL = { z: 1, cx: 960, cy: 540 };

  // ---- 1. dark desktop -------------------------------------------------
  await page.goto(BASE + "/transactions");
  await wait(2600);
  await page.mouse.move(1100, 620);
  mark("intro");
  await caption("Ask your budget a <b>question</b>.", 1500);
  await caption("");

  const combo = page.getByRole("combobox").first();
  const box = await combo.boundingBox();
  const ZOOM = { z: 1.5, cx: 700, cy: box.y + 250 };
  zoomTo(ZOOM, 1.1);
  await click(combo);
  stage.captionAt(700, 262); // keep captions inside the zoomed window
  await caption("");
  await wait(300);
  await caption("Type it the way you'd say it", 100);
  await type(QUERY_1, 46);
  await wait(250);
  await caption("Dates. Amounts. Even typos. <b>Understood.</b>", 1700);
  await caption("Take one filter…", 300);
  await click(page.getByRole("option", { name: /Category: Groceries/ }));
  await wait(500);
  await caption("…or everything left, in one tap", 300);
  await click(page.getByRole("option", { name: /Apply all/ }));
  sound("chime");
  mark("applied");
  zoomTo({ ...ZOOM, z: 1.45, cy: ZOOM.cy - 40 }, 0.8);
  await wait(500);
  await caption("Every filter is a chip you can remove", 1500);

  // ---- 2. switch to light by clicking the theme button -----------------
  await click(page.getByRole("button", { name: /^Reset$/ }));
  await caption("");
  zoomTo(FULL, 0.9);
  stage.captionAt(960, 48);
  await wait(800);
  await caption("Light or dark. <b>Same search.</b>", 200);
  await stage.toggleTheme();
  await caption("");
  await click(page.locator("#exclude-transfers")); // a transfer is not an expense
  await wait(500);

  // ---- 3. light desktop ------------------------------------------------
  const phoneReady = stage.preparePhone("/transactions"); // loads in the background
  zoomTo(ZOOM, 1.1);
  await click(page.getByRole("combobox").first());
  stage.captionAt(700, 262);
  await caption("");
  await wait(250);
  await caption("Ask it like a person would", 100);
  await type(QUERY_2, 24);
  await wait(250);
  await caption("Biggest. Soonest. One account. <b>Understood.</b>", 1700);
  await click(page.getByRole("option", { name: /Apply all/ }));
  sound("chime");
  zoomTo({ ...ZOOM, z: 1.45, cy: ZOOM.cy - 40 }, 0.8);
  await wait(600);
  await caption("The answer, in one row", 1800);
  await caption("");

  // ---- 4. the same search on a phone -----------------------------------
  // The camera pushes in on the phone as it slides in, and pulls back out to
  // reveal the end card.
  zoomTo(FULL, 0.9);
  await wait(800);
  const phone = await phoneReady;
  sound("whoosh");
  const pb = await phone.getByRole("combobox").first().boundingBox();
  const PHONE_CAM = { z: 1.7, cx: 1579, cy: pb.y + 120 };
  zoomTo(PHONE_CAM, 1.2);
  // The zoom window is 1129x635, clamped to the right edge of the screen.
  stage.captionAt(1355, Math.max(20, 1080 - (PHONE_CAM.cy + 317) + 36));
  await stage.showPhone();
  await caption("Works on your phone too", 1000);
  await caption("");
  await click(phone.getByRole("combobox").first());
  await type(QUERY_2, 12);
  await wait(300);
  await click(phone.getByRole("option", { name: /Apply all/ }));
  sound("chime");
  await wait(2300);
  await caption("Search runs on your device. <b>No AI. No cloud.</b>", 2100);
  await caption("", 450); // let the caption fade before the camera moves

  // ---- 5. end card: flip in (light), then turn dark ---------------------
  await stage.hidePhone();
  zoomTo(FULL, 1.2); // pull back as the end card flips in
  await stage.flipToEndCard();
  sound("whoosh", { gain: 0.14 });
  await wait(2200);
  await stage.revealDarkEndCard();
  sound("whoosh", { gain: 0.12 });
  sound("sparkle");
  await wait(3600);

  const take = await stage.finish();
  console.log("take ->", take);
})().catch((e) => { console.error("FAILED", e.message.slice(0, 800)); process.exit(1); });
