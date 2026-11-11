/**
 * A small "stage" for recording product videos from the real app.
 *
 * It drives the running app (dev server) in Chromium, records the screen, and
 * writes everything the editor needs to `events.json`: when each key was
 * pressed, where the clicks were, which sounds to play and how the camera
 * should zoom. `compose.py` then turns that into the finished MP4.
 *
 * Nothing on screen is a mock-up: it is the real app with demo data.
 *
 *   const stage = await createStage({ baseUrl, outDir, assets, endCard });
 *   await stage.caption("Hello", 1500);
 *   await stage.finish();
 */
const fs = require("fs");
const path = require("path");
const { chromium, _electron } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const REPO = path.join(__dirname, "../../..");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Runs inside the page: caption bar, cursor, end card and device frame. */
const overlay = ({ assets, endCard }) => {
  // Soft glow on a suggestion when it is clicked and on every chip that appears.
  addEventListener("mousedown", (e) => {
    const item = e.target.closest && e.target.closest("[cmdk-item]");
    if (item) item.classList.add("demo-glow");
  }, true);
  new MutationObserver((list) => {
    if (!window.__demoGlow) return;
    for (const m of list) for (const n of m.addedNodes) {
      if (n.nodeType !== 1) continue;
      const chips = n.matches?.("[role=group] .cursor-pointer") ? [n] : [...n.querySelectorAll?.("[role=group] .cursor-pointer") || []];
      chips.forEach((c) => c.classList.add("demo-glow"));
    }
  }).observe(document, { childList: true, subtree: true });
  const style = document.createElement("style");
  style.textContent = `
    #demo-caption{position:fixed;left:50%;bottom:48px;transform:translateX(-50%);z-index:2147483646;
      background:rgba(8,12,24,.94);color:#fff;font:600 30px/1.25 Inter,system-ui,sans-serif;letter-spacing:-.01em;
      padding:12px 28px;border-radius:16px;border:1px solid rgba(94,234,212,.35);
      box-shadow:0 10px 40px rgba(0,0,0,.45);opacity:0;transition:opacity .35s;max-width:80vw;text-align:center;pointer-events:none}
    #demo-caption.on{opacity:1}
    #demo-caption b{background:linear-gradient(90deg,#5eead4,#38bdf8);-webkit-background-clip:text;background-clip:text;color:transparent}
    @keyframes demoGlow{0%{box-shadow:0 0 0 0 rgba(94,234,212,.9),0 0 0 0 rgba(56,189,248,.6);outline-color:rgba(94,234,212,1)}
      60%{box-shadow:0 0 22px 8px rgba(94,234,212,.55),0 0 46px 16px rgba(56,189,248,.3);outline-color:rgba(56,189,248,.9)}
      100%{box-shadow:0 0 10px 3px rgba(94,234,212,.35);outline-color:rgba(94,234,212,.55)}}
    @keyframes demoGlowRow{0%{background:rgba(94,234,212,.42)}100%{background:rgba(94,234,212,.12)}}
    tr.demo-glow-row{outline:2px solid #5eead4;outline-offset:-2px;animation:demoGlowRow 1.8s ease-out both}
    .demo-glow{outline:2px solid #5eead4;outline-offset:2px;animation:demoGlow 1.6s ease-out both;border-radius:999px}
    [cmdk-item].demo-glow{border-radius:8px}
    #root.phone-blur{filter:blur(7px) brightness(.9)}
    #demo-note{position:fixed;z-index:2147483646;transform:translateY(-50%);pointer-events:none;
      font:600 15px/1 Inter,system-ui,sans-serif;padding:5px 11px;border-radius:999px;white-space:nowrap;
      background:rgba(16,185,129,.18);color:#6ee7b7;border:1.5px solid rgba(16,185,129,.7);opacity:0;transition:opacity .45s}
    #demo-note.on{opacity:1}
    #demo-cursor{position:fixed;z-index:2147483647;width:34px;height:34px;border-radius:50%;
      background:rgba(251,146,60,.5);border:3px solid #fb923c;pointer-events:none;
      transform:translate(-50%,-50%);transition:transform .08s;left:-80px;top:-80px}
    #demo-cursor.down{transform:translate(-50%,-50%) scale(.7)}
    html{perspective:2400px;background:#0b0f19}
    #root{transition:transform .85s cubic-bezier(.6,0,.4,1),opacity .85s;transform-origin:50% 50%}
    #root.docked{transform:translateX(-19%) scale(.64);border-radius:28px;overflow:hidden;height:100vh;
      box-shadow:0 30px 90px rgba(0,0,0,.55)}
    #root{transition:transform .85s cubic-bezier(.6,0,.4,1),opacity 1s ease,filter 1s ease}
    #root.flipped{opacity:0;filter:blur(26px)}
    #root.docked{filter:blur(7px) brightness(.9)}
    #root.docked.flipped{filter:blur(26px)}
    body.stage-docked{background:radial-gradient(ellipse at 40% 30%,#1b2c4a 0%,#0a1020 75%)!important;overflow:hidden!important}
    html.stage-docked{background:radial-gradient(ellipse at 40% 30%,#1b2c4a 0%,#0a1020 75%)!important;overflow:hidden!important}
    #demo-phone{position:fixed;right:110px;top:50%;width:462px;height:932px;padding:16px;box-sizing:border-box;
      background:#05070d;border-radius:76px;box-shadow:0 30px 90px rgba(0,0,0,.6),inset 0 0 0 2px #1e293b;
      transform:translate(160%,-50%);transition:transform 1s cubic-bezier(.2,.8,.2,1);z-index:2147483640}
    #demo-phone.on{transform:translate(0,-50%)}
    #demo-phone.off{transform:translate(160%,-50%);opacity:0;filter:blur(18px);
      transition:transform .9s cubic-bezier(.6,0,.4,1),opacity .9s ease,filter .9s ease}
    #demo-phone .screen{width:430px;height:900px;border-radius:60px;overflow:hidden;background:#fff}
    #demo-phone iframe{width:100%;height:100%;border:0;display:block}
    #demo-phone .notch{position:absolute;top:26px;left:50%;transform:translateX(-50%);width:128px;height:34px;background:#05070d;border-radius:20px}
    #demo-end{position:fixed;inset:0;z-index:2147483645;pointer-events:none;opacity:0;filter:blur(30px);
      transform:scale(.985);transition:opacity 1s ease .35s,filter 1.1s ease .35s,transform 1.1s ease .35s}
    #demo-end.on{opacity:1;filter:blur(0);transform:scale(1)}
    #demo-end .lay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:150px;font-family:Inter,system-ui,sans-serif}
    #demo-end .light{background:radial-gradient(ellipse at 50% 35%,#ffffff 0%,#f1f5f9 75%);color:#0f172a}
    #demo-end .dark{background:radial-gradient(ellipse at 50% 35%,#13293a 0%,#0a0f1c 75%);color:#f1f5f9;
      clip-path:circle(0% at 50% 50%);transition:clip-path 1.5s cubic-bezier(.65,0,.35,1)}
    #demo-end.todark .dark{clip-path:circle(150% at 50% 50%)}
    #demo-end .col{display:flex;flex-direction:column;align-items:center;gap:30px;text-align:center}
    #demo-end .brand{display:flex;align-items:center;gap:34px}
    #demo-end img{height:210px;width:auto}
    #demo-end h1{font-size:130px;font-weight:800;letter-spacing:-.03em;margin:0;line-height:1;
      -webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:10px}
    #demo-end .light h1{background-image:linear-gradient(90deg,hsl(32 83% 66%),hsl(27 72% 62%),hsl(20 73% 56%))}
    #demo-end .dark h1{background-image:linear-gradient(90deg,hsl(183 51% 74%),hsl(187 55% 61%),hsl(199 54% 48%))}
    #demo-end p{font-size:44px;margin:0;font-weight:600}
    #demo-end .badges{display:flex;gap:18px;margin-top:6px}
    #demo-end .badges span{font-size:32px;font-weight:600;padding:12px 26px;border-radius:12px;border:2px solid}
    #demo-end .light .g{border-color:#a7f3d0;background:#ecfdf5;color:#047857}
    #demo-end .light .b{border-color:#bae6fd;background:#f0f9ff;color:#0369a1}
    #demo-end .light .o{border-color:#fde68a;background:#fffbeb;color:#92400e}
    #demo-end .dark .g{border-color:rgba(4,120,87,.7);background:rgba(2,44,34,.55);color:#a7f3d0}
    #demo-end .dark .b{border-color:rgba(3,105,161,.7);background:rgba(8,47,73,.55);color:#bae6fd}
    #demo-end .dark .o{border-color:rgba(180,83,9,.7);background:rgba(69,26,3,.55);color:#fde68a}
    #demo-end .qr{display:flex;flex-direction:column;align-items:center;gap:18px}
    #demo-end .qr .tile{width:330px;height:330px;background:#fff;border-radius:26px;padding:10px;box-shadow:0 12px 40px rgba(0,0,0,.25)}
    #demo-end .qr svg{width:100%;height:100%;display:block}
    #demo-end .qr span{font-size:34px;font-weight:700;letter-spacing:.01em}`;
  const layer = (cls, logo) => `<div class="lay ${cls}"><div class="col"><div class="brand"><img src="${logo}"><h1>${endCard.title}</h1></div>
      <p>${endCard.tagline}</p>
      <div class="badges">${endCard.badges.map((b) => `<span class="${b.cls}">${b.text}</span>`).join("")}</div></div>
      <div class="qr"><div class="tile">${assets.qr}</div><span>${endCard.url}</span></div></div>`;
  document.addEventListener("DOMContentLoaded", () => {
    document.head.appendChild(style);
    // The phone is an iframe of the same app: it gets the glow styles only, not
    // a second caption, cursor and end card.
    if (window.top !== window) return;
    const cap = Object.assign(document.createElement("div"), { id: "demo-caption" });
    const cur = Object.assign(document.createElement("div"), { id: "demo-cursor" });
    const end = Object.assign(document.createElement("div"), { id: "demo-end" });
    end.innerHTML = layer("light", assets.logoLight) + layer("dark", assets.logoDark);
    document.body.append(cap, cur, end);
    addEventListener("mousemove", (e) => { cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => cur.classList.add("down"), true);
    addEventListener("mouseup", () => cur.classList.remove("down"), true);
  });
};

async function createStage({
  baseUrl,
  outDir,
  assets,
  endCard,
  theme = "dark",
  width = 1920,
  height = 1080,
  ledger = "Home Budget",
  setup: prepare = null,
  desktop = false,
}) {
  fs.mkdirSync(outDir, { recursive: true });

  // The app uses hash routes in the desktop app and plain paths on the web.
  const url = (p) => baseUrl + (desktop ? "/#" : "") + p;
  let browser = null, ctx, desktopApp = null, desktopPage = null, profileDir = null;
  if (desktop) {
    // The real desktop app (Electron), showing the dev server's pages. It gets
    // a profile folder of its own under out/, so it never opens or changes the
    // data of a Vaulted Money already installed on this computer.
    profileDir = fs.mkdtempSync(path.join(outDir, "desktop-profile-"));
    const env = { ...process.env, VITE_DEV_SERVER_URL: baseUrl };
    delete env.ELECTRON_RUN_AS_NODE; // set by some editors' terminals; Electron would start as plain Node
    desktopApp = await _electron.launch({
      executablePath: require(path.join(REPO, "node_modules/electron")),
      cwd: REPO, args: [".", "--user-data-dir=" + profileDir], env,
    });
    await wait(4000);
    await desktopApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().forEach((w) => w.webContents.closeDevTools()));
    await wait(800);
    desktopPage = desktopApp.windows().find((w) => !w.url().startsWith("devtools://"));
    ctx = desktopPage.context();
    // The window is whatever fits the screen; film it as a 1920x1080 page.
    const metrics = await ctx.newCDPSession(desktopPage);
    await metrics.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 2, mobile: false });
  } else {
    browser = await chromium.launch();
    ctx = await browser.newContext({
      viewport: { width, height },
      // Frames are captured at twice the pixels (see the screencast below) so the
      // zoomed-in camera stays sharp; Playwright's own video is too small and soft.
      deviceScaleFactor: 2,
    });
  }
  // Only the first time: this also runs inside the phone's iframe, and must not
  // undo a theme the video switched to with the theme button.
  await ctx.addInitScript((th) => {
    try { if (!localStorage.getItem("vite-ui-theme")) localStorage.setItem("vite-ui-theme", th); } catch {}
  }, theme);
  await ctx.addInitScript(overlay, { assets, endCard });

  // Setup page: generate the demo data and open a ledger. Its recording is
  // thrown away; the data lives in the browser profile the take shares.
  const setup = desktop ? desktopPage : await ctx.newPage();
  await setup.goto(url("/ledgers"));
  if (desktop) await setup.reload(); // so the overlay script added above is in the page
  await setup.getByRole("button", { name: /generate demo data/i }).click();
  await wait(500);
  await setup.getByRole("button", { name: /generate|confirm|continue|yes|replace/i }).last().click();
  await wait(8000);
  await setup.goto(url("/ledgers")); await wait(1500);
  await setup.getByRole("heading", { name: ledger }).click();
  await wait(2500);
  // Anything else the video needs before filming (see "setup" in the README).
  if (prepare) await prepare(setup);

  // The desktop app has one window, so the take is filmed in it.
  const page = desktop ? setup : await ctx.newPage();
  const T0 = Date.now();
  const now = () => (Date.now() - T0) / 1000;

  // Our own screen recording: full-quality JPEG frames at 2x, with timestamps.
  const framesDir = path.join(outDir, "frames");
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });
  const frames = [];
  const cdp = await ctx.newCDPSession(page);
  cdp.on("Page.screencastFrame", (f) => {
    const name = String(frames.length).padStart(6, "0") + ".jpg";
    frames.push({ name, t: now() });
    fs.writeFileSync(path.join(framesDir, name), Buffer.from(f.data, "base64"));
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg", quality: 92, maxWidth: width * 2, maxHeight: height * 2, everyNthFrame: 1,
  });
  const ev = { keys: [], clicks: [], sounds: [], zoom: [], marks: {}, boxes: {} };
  let pos = { x: width / 2, bottom: 48 };
  let cam = { z: 1, cx: width / 2, cy: height / 2 };

  const stage = {
    page, ev, wait, now, baseUrl, width, height, url,
    mark: (name) => { ev.marks[name] = now(); },
    sound: (kind, opts = {}) => ev.sounds.push({ kind, t: now() + (opts.offset || 0), gain: opts.gain }),

    /** Where captions sit; move them inside the zoom window while zoomed in. */
    captionAt(x, bottom) { pos = { x, bottom }; },
    async caption(html, ms = 0, size = 30) {
      await page.evaluate(([t, p, size]) => {
        const c = document.getElementById("demo-caption"); if (!c) return;
        c.style.fontSize = size + "px";
        c.style.left = p.x + "px"; c.style.bottom = p.bottom + "px";
        // "bottom" is measured from the page, not the screen, when the page is
        // taller than the screen (html has a perspective). Correct for that.
        const off = innerHeight - p.bottom - c.getBoundingClientRect().bottom;
        if (Math.abs(off) > 1) c.style.bottom = p.bottom - off + "px";
        if (t) { c.innerHTML = t; c.classList.add("on"); } else c.classList.remove("on");
      }, [html, pos, size]);
      if (ms) await wait(ms);
    },

    /** A small label right after the text typed in the search box ("typo-tolerant"). */
    async noteNearInput(text) {
      await page.evaluate((t) => {
        const inp = document.querySelector("[cmdk-input]"); if (!inp) return;
        const r = inp.getBoundingClientRect(); const cs = getComputedStyle(inp);
        const ctx2d = document.createElement("canvas").getContext("2d");
        ctx2d.font = `${cs.fontSize} ${cs.fontFamily}`;
        const w = ctx2d.measureText(inp.value.trimEnd()).width;
        let el = document.getElementById("demo-note");
        if (!el) { el = document.createElement("div"); el.id = "demo-note"; document.body.appendChild(el); }
        el.textContent = t;
        el.style.left = r.left + parseFloat(cs.paddingLeft) + w + 22 + "px";
        el.style.top = r.top + r.height / 2 + "px";
        requestAnimationFrame(() => el.classList.add("on"));
      }, text);
    },
    async hideNote() { await page.evaluate(() => document.getElementById("demo-note")?.classList.remove("on")); },

    /** Camera move, recorded for the editor: starts now, takes `ease` seconds. */
    async zoomTo(target, ease = 0.9) {
      ev.zoom.push({ t: now(), ...cam });
      cam = { ...cam, ...target };
      ev.zoom.push({ t: now() + ease, ...cam });
    },

    async moveTo(locator) {
      const b = await locator.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 22 });
      await wait(200);
    },
    async click(locator) {
      await stage.moveTo(locator);
      ev.clicks.push(now());
      await page.mouse.down(); await wait(80); await page.mouse.up();
    },
    /** Types into whatever is focused, logging every key for the sound track. */
    async type(text, delay = 40) {
      for (const ch of text) {
        ev.keys.push({ t: now(), space: ch === " " });
        await page.keyboard.type(ch);
        await wait(delay);
      }
    },

    /** Clicks the real theme button, with a pulse ring and no colour fade. */
    async toggleTheme() {
      const btn = page.locator("button:has(svg.lucide-moon), button:has(svg.lucide-sun)").first();
      await stage.moveTo(btn);
      const b = await btn.boundingBox();
      await page.evaluate((r) => {
        const ring = document.createElement("div"); ring.id = "demo-ring";
        ring.style.cssText = `position:fixed;z-index:2147483646;left:${r.x - 10}px;top:${r.y - 10}px;width:${r.width + 20}px;height:${r.height + 20}px;border-radius:50%;border:4px solid #fb923c;animation:demoPulse .9s ease-out 2;pointer-events:none`;
        const st = document.createElement("style"); st.id = "demo-ring-style";
        st.textContent = "@keyframes demoPulse{0%{box-shadow:0 0 0 0 rgba(251,146,60,.65)}100%{box-shadow:0 0 0 26px rgba(251,146,60,0)}}";
        document.head.appendChild(st); document.body.appendChild(ring);
      }, b);
      await wait(900);
      await page.evaluate(() => {
        const st = document.createElement("style"); st.id = "demo-notrans";
        st.textContent = "*,*::before,*::after{transition:none!important;animation-duration:0s!important}";
        document.head.appendChild(st);
      });
      ev.clicks.push(now()); await page.mouse.down(); await wait(80); await page.mouse.up();
      stage.mark("theme");
      await wait(250);
      await page.evaluate(() => { document.getElementById("demo-ring")?.remove(); document.getElementById("demo-ring-style")?.remove(); });
      await wait(450);
      await page.evaluate(() => document.getElementById("demo-notrans")?.remove());
      await wait(300);
    },

    /**
     * Loads the app in a phone-sized frame (off screen) so it is ready when the
     * phone slides in. The phone starts without the desktop's saved filters,
     * so its search starts from a clean page. Does not block: await the result.
     */
    async preparePhone(pathname, { excludeTransfers = false } = {}) {
      await page.evaluate(([src, excludeTransfers]) => {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith("filter_")) localStorage.removeItem(k);
        }
        if (excludeTransfers) localStorage.setItem("filter_excludeTransfers", "true");
        const phone = document.createElement("div"); phone.id = "demo-phone";
        phone.innerHTML = `<div class="screen"><iframe src="${src}"></iframe></div><div class="notch"></div>`;
        document.body.appendChild(phone);
      }, [pathname, excludeTransfers]);
      const handle = await page.waitForSelector("#demo-phone iframe");
      const frame = await handle.contentFrame();
      await frame.waitForSelector('[role="combobox"]', { timeout: 30000 });
      await wait(800);
      return frame;
    },
    /** Shrinks the desktop view to the left and slides the phone in on the right. */
    async showPhone() {
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        document.documentElement.classList.add("stage-docked");
        document.body.classList.add("stage-docked");
        document.getElementById("root").classList.add("docked");
        requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById("demo-phone").classList.add("on")));
      });
      await wait(1100);
    },
    async hidePhone() {
      await page.evaluate(() => document.getElementById("demo-phone")?.classList.add("off"));
    },

    /** The page blurs out while the end card blurs in. */
    async flipToEndCard() {
      stage.mark("flip");
      await page.evaluate(() => {
        document.getElementById("demo-cursor").style.display = "none";
        document.getElementById("root").classList.add("flipped");
        document.getElementById("demo-end").classList.add("on");
      });
    },
    /** The card turns dark in a circular reveal. */
    async revealDarkEndCard() {
      stage.mark("toDark");
      await page.evaluate(() => document.getElementById("demo-end").classList.add("todark"));
    },

    async finish() {
      stage.mark("end");
      fs.writeFileSync(path.join(outDir, "events.json"), JSON.stringify(ev, null, 1));
      await cdp.send("Page.stopScreencast").catch(() => {});
      if (desktop) {
        await desktopApp.close();
        fs.rmSync(profileDir, { recursive: true, force: true });
      } else {
        await ctx.close();
        await browser.close();
      }
      // Frames arrive only when the screen changes; their gaps become durations.
      const t0 = Math.max(0, frames[0].t);
      let list = "ffconcat version 1.0\n";
      frames.forEach((f, i) => {
        const next = i + 1 < frames.length ? frames[i + 1].t : f.t + 0.5;
        list += `file 'frames/${f.name}'\nduration ${Math.max(0.001, (next - Math.max(f.t, 0)) ).toFixed(4)}\n`;
      });
      list += `file 'frames/${frames[frames.length - 1].name}'\n`;
      fs.writeFileSync(path.join(outDir, "frames.txt"), list);
      // Video time 0 = T0: pad the start with the first frame if it came late.
      require("child_process").execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0",
        "-i", path.join(outDir, "frames.txt"), "-vf", `tpad=start_duration=${t0.toFixed(3)}:start_mode=clone,fps=30`,
        "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-pix_fmt", "yuv420p", path.join(outDir, "take.mp4")]);
      return path.join(outDir, "take.mp4");
    },
  };
  return stage;
}

module.exports = { createStage, wait };
