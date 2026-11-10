#!/usr/bin/env node
/**
 * Builds a feature video from a plain JSON script.
 *
 *   node make.cjs videos/search.json      (the app's dev server must be running)
 *
 * The script lists steps ("do": "caption", "click", "type", ...). See
 * README.md for every step. This file only knows how to play them; nothing in
 * it is specific to one feature, so a new video is a new JSON file.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { createStage, wait } = require("./lib/stage.cjs");
const { startStandIn } = require("./lib/standin-ai.cjs");

const configPath = path.resolve(process.argv[2] || "");
if (!process.argv[2] || !fs.existsSync(configPath)) {
  console.error("usage: node make.cjs videos/<name>.json");
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
const OUT = path.join(__dirname, "out");
const BASE = process.env.BASE_URL || cfg.baseUrl || "http://127.0.0.1:5199";
const W = 1920, H = 1080;

execFileSync("python3", [path.join(__dirname, "lib/assets.py"), "--url", cfg.endCard.qrUrl || "https://" + cfg.endCard.url,
  "--out", path.join(OUT, "assets.json")], { stdio: "inherit" });
const assets = JSON.parse(fs.readFileSync(path.join(OUT, "assets.json"), "utf8"));

/** Replaces {{today}} and {{today-N}} with ISO dates, so no script holds a fixed date. */
const withDates = (text) => text.replace(/\{\{today(?:-(\d+))?\}\}/g, (_, n) => {
  const d = new Date(); d.setDate(d.getDate() - Number(n || 0));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
});

(async () => {
  // Optional stand-in AI provider on 127.0.0.1 (see lib/standin-ai.cjs).
  const standIn = cfg.aiStandIn ? await startStandIn(cfg.aiStandIn) : null;

  /** Every element a target matches. `hasText` (a regex) narrows a css target. */
  const findAll = (root, t) => {
    if (t.role) return root.getByRole(t.role, t.name ? { name: new RegExp(t.name) } : {});
    if (t.css) return root.locator(t.css, t.hasText ? { hasText: new RegExp(t.hasText) } : {});
    if (t.text) return root.getByText(t.text);
    throw new Error("target needs role, css or text: " + JSON.stringify(t));
  };
  const find = (root, t) => findAll(root, t).first();
  const DESKTOP = cfg.app === "desktop";
  const route = (p) => BASE + (DESKTOP ? "/#" : "") + p;
  /**
   * Off-camera preparation, on the page that generated the demo data. These
   * are plain actions on the real app (no cursor, no sound, not recorded).
   */
  const prepare = async (setupPage) => {
    const actions = {
      goto: async (s) => { await setupPage.goto(route(s.path)); await wait(s.wait ?? 2000); },
      wait: async (s) => wait(s.ms),
      click: async (s) => { await find(setupPage, s.target).click(); await wait(s.wait ?? 600); },
      fill: async (s) => { await find(setupPage, s.target).fill(s.text.replace("{{standIn}}", standIn ? standIn.url : "")); },
      keys: async (s) => { await setupPage.keyboard.type(s.text, { delay: 20 }); await wait(s.wait ?? 900); },
      /** Gives a file input a copy of `file` with its date placeholders filled in. */
      upload: async (s) => {
        const dest = path.join(OUT, path.basename(s.file));
        fs.writeFileSync(dest, withDates(fs.readFileSync(path.join(__dirname, s.file), "utf8")));
        await find(setupPage, s.target).setInputFiles(dest);
        await wait(s.wait ?? 1500);
      },
    };
    for (const s of cfg.setup || []) {
      if (!actions[s.do]) throw new Error("unknown setup step: " + s.do);
      await actions[s.do](s);
    }
  };

  const stage = await createStage({ baseUrl: BASE, outDir: OUT, assets, endCard: cfg.endCard, ledger: cfg.ledger, setup: prepare, desktop: DESKTOP });
  const { page, caption } = stage;
  let phone = null, phoneReady = null;
  const anchors = {}; // named boxes, so a zoom can follow an element
  const FULL = { z: 1, cx: W / 2, cy: H / 2 };

  const scope = (s) => (s && s.in === "phone" ? phone : page);
  const locate = (t) => {
    const root = scope(t);
    return find(root, t);
  };

  const steps = {
    goto: async (s) => { await page.goto(route(s.path)); await wait(s.wait ?? 2000); },
    wait: async (s) => wait(s.ms),
    mouse: async (s) => page.mouse.move(s.x, s.y),
    mark: async (s) => stage.mark(s.name),
    sound: async (s) => stage.sound(s.kind, { gain: s.gain }),
    /** Caption: white text, with <b>blue</b> on its own line (never both on one). "" clears it. */
    caption: async (s) => caption(s.text, s.ms ?? 0, s.size ?? cfg.captionSize ?? 30),
    /** A single-colour check-mark card. */
    check: async (s) => caption(`<b>✓ ${s.text}</b>`, s.ms ?? 3500),
    anchor: async (s) => { anchors[s.name] = await locate(s.target).boundingBox(); },
    /** Camera. cx fixed; cy = anchor's top + dy, or a fixed cy. z 1 pulls back. */
    zoom: async (s) => {
      const z = s.z ?? 1;
      const cy = s.anchor ? anchors[s.anchor].y + (s.dy ?? 0) : s.cy ?? H / 2;
      const cx = s.cx ?? W / 2;
      // Keep the caption inside the part of the screen the camera shows.
      const ww = W / z, wh = H / z;
      const left = Math.min(Math.max(cx - ww / 2, 0), W - ww);
      const top = Math.min(Math.max(cy - wh / 2, 0), H - wh);
      if (z === 1) stage.captionAt(W / 2, 48);
      else stage.captionAt(left + ww / 2, Math.max(20, H - (top + wh) + 36));
      stage.zoomTo(z === 1 ? FULL : { z, cx, cy }, s.ease ?? 0.9);
    },
    click: async (s) => {
      if (s.silent) await locate(s.target).evaluate((el) => el.click()); // no cursor, e.g. behind a dissolve
      else await stage.click(locate(s.target));
    },
    type: async (s) => { await stage.type(s.text, s.delay ?? 40); },
    note: async (s) => stage.noteNearInput(s.text),
    hideNote: async () => stage.hideNote(),
    /** Soft glow on every table row the target matches (a video highlight, not app UI). */
    glowRows: async (s) => {
      await findAll(scope(s.target), s.target).evaluateAll((rows) => rows.forEach((r) => r.classList.add("demo-glow-row")));
      stage.sound("sparkle");
    },
    /** Soft glow on chips that appear (and the suggestion clicked) while on. */
    glow: async (s) => { await scope(s).evaluate((on) => { window.__demoGlow = on; }, s.on); },
    theme: async () => stage.toggleTheme(),
    /** Fade to dark, run `steps` out of sight, fade back. */
    dissolve: async (s) => {
      await page.evaluate(() => {
        const f = document.createElement("div"); f.id = "demo-fade";
        f.style.cssText = "position:fixed;inset:0;z-index:2147483645;background:#0b0f19;opacity:0;transition:opacity .7s ease;pointer-events:none";
        document.body.appendChild(f);
        requestAnimationFrame(() => requestAnimationFrame(() => { f.style.opacity = "1"; }));
      });
      await wait(900);
      await run(s.steps || []);
      await wait(s.hold ?? 600);
      await page.evaluate(() => { document.getElementById("demo-fade").style.opacity = "0"; });
      await wait(800);
    },
    phonePrepare: async (s) => { phoneReady = stage.preparePhone(s.path, { excludeTransfers: !!s.excludeTransfers }); },
    phoneShow: async () => { phone = await phoneReady; await stage.showPhone(); },
    /** Resolves the phone early (for anchors) without showing it. */
    phoneLoad: async () => { phone = await phoneReady; },
    /** The finale: app blurs out, light card blurs in, then turns dark. */
    end: async (s) => {
      if (phone) await stage.hidePhone();
      stage.captionAt(W / 2, 48);
      stage.zoomTo(FULL, s.ease ?? 2.0);
      await stage.flipToEndCard();
      stage.sound("whoosh", { gain: 0.14 });
      await wait(s.light ?? 2500);
      await stage.revealDarkEndCard();
      stage.sound("whoosh", { gain: 0.12 });
      stage.sound("sparkle");
      await wait(s.dark ?? 3600);
    },
  };

  async function run(list) {
    for (const s of list) {
      const fn = steps[s.do];
      if (!fn) throw new Error("unknown step: " + s.do);
      await fn(s);
    }
  }

  await run(cfg.steps);
  const take = await stage.finish();
  console.log("take ->", take);
  if (standIn) {
    // Kept beside the take so a caption about what the app sends can be checked.
    fs.writeFileSync(path.join(OUT, "standin-requests.json"), JSON.stringify(standIn.requests, null, 1));
    await standIn.close();
  }

  execFileSync("python3", [path.join(__dirname, "lib/compose.py"), "--dir", OUT,
    "--speed", String(cfg.speed ?? 1.5), "--foley", String(cfg.foley ?? 0.4),
    "--out", path.join(__dirname, cfg.out)], { stdio: "inherit" });
})().catch((e) => { console.error("FAILED", String(e.stack || e).slice(0, 1200)); process.exit(1); });
