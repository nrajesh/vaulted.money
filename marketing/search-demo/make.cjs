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
const { pathToFileURL } = require("url");
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

  // For steps that talk to the real MCP server later in the take (agentImport).
  let profileConfigPath = null;
  const profileHook = async (info) => { profileConfigPath = info.configPath; };
  const stage = await createStage({ baseUrl: BASE, outDir: OUT, assets, endCard: cfg.endCard, ledger: cfg.ledger, setup: prepare, desktop: DESKTOP, onProfile: profileHook, localApi: cfg.localApi || null, demoData: cfg.demoData !== false, pickFolder: cfg.pickFolder || null, ...(cfg.theme ? { theme: cfg.theme } : {}) });
  const { page, caption } = stage;
  let phone = null, phoneReady = null;
  const anchors = {}; // named boxes, so a zoom can follow an element
  const FULL = { z: 1, cx: W / 2, cy: H / 2 };

  const scope = (s) => (s && s.in === "phone" ? phone : page);
  const locate = (t) => {
    const root = scope(t);
    return find(root, t);
  };
  let terminalLedgerId = null; // resolved once, over the API, by the terminal step
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
    phonePrepare: async (s) => { phoneReady = stage.preparePhone(s.path, { excludeTransfers: !!s.excludeTransfers, ...(s.waitFor ? { waitFor: s.waitFor } : {}) }); },
    /** Opens another page of the app inside the phone (`path`, as the phone's address shows it). */
    phoneGoto: async (s) => { await phone.evaluate((p) => { location.hash = p; }, s.path); await wait(s.wait ?? 1800); },
    /** Shows the phone over whatever is on screen, without shrinking the app behind it. */
    phoneOver: async () => {
      phone = await phoneReady;
      await page.evaluate(() => requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById("demo-phone").classList.add("on"))));
      await wait(1100);
    },
    /** Shrinks a clip left up with `keep` to the left, to make room beside it. */
    dockMedia: async () => {
      await page.evaluate(() => {
        const wrap = document.getElementById("demo-clip"); if (!wrap) return;
        wrap.style.background = "radial-gradient(ellipse at 40% 30%,#1b2c4a 0%,#0a1020 75%)";
        const video = wrap.querySelector("video");
        video.style.transition = "transform .9s cubic-bezier(.6,0,.4,1), border-radius .9s, box-shadow .9s";
        video.style.transformOrigin = "0 50%";
        video.style.transform = "translateX(44px) scale(.64)";
        video.style.borderRadius = "28px";
        video.style.boxShadow = "0 30px 90px rgba(0,0,0,.55)";
        const label = wrap.querySelector("div"); if (label) { label.style.left = "70px"; label.style.top = "118px"; }
      });
      await wait(1000);
    },
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
    /**
     * Plays a recorded clip (`file`, under this folder) full screen, with a
     * small label saying what it is. Used for footage of another program,
     * which the recorder cannot film itself. The clip is slowed by the video's
     * speed so that it plays at its own pace in the finished film. `while`
     * lists steps to run as it plays (captions, off-camera work).
     */
    clip: async (s) => {
      const speed = cfg.speed ?? 1.5;
      const src = BASE + "/marketing/search-demo/" + s.file;
      const seconds = await page.evaluate(async ([src, label, rate]) => {
        const cursor = document.getElementById("demo-cursor"); if (cursor) cursor.style.opacity = "0";
        const wrap = document.createElement("div");
        wrap.id = "demo-clip";
        wrap.style.cssText = "position:fixed;inset:0;z-index:2147483640;background:#0b0f19;opacity:0;transition:opacity .5s ease";
        wrap.innerHTML = "<video muted playsinline style='width:100%;height:100%;object-fit:cover'></video>" +
          (label ? "<div style='position:absolute;left:36px;top:30px;padding:9px 18px;border-radius:999px;background:rgba(8,12,24,.92);border:1px solid rgba(94,234,212,.45);color:#e2e8f0;font:600 20px/1 Inter,system-ui,sans-serif'>" + label + "</div>" : "");
        document.body.appendChild(wrap);
        const video = wrap.querySelector("video");
        video.src = src;
        await new Promise((resolve, reject) => { video.onloadeddata = resolve; video.onerror = () => reject(new Error("clip did not load: " + src)); });
        video.playbackRate = rate;
        requestAnimationFrame(() => { wrap.style.opacity = "1"; });
        await video.play();
        return video.duration / rate;
      }, [src, s.label || "", 1 / speed]);
      const playing = wait(seconds * 1000 - 150);
      if (s.while) await run(s.while);
      await playing;
      if (s.keep) return; // the next clip or still covers it
      await page.evaluate(() => { const w = document.getElementById("demo-clip"); if (w) { w.style.opacity = "0"; setTimeout(() => w.remove(), 550); } const cursor = document.getElementById("demo-cursor"); if (cursor) cursor.style.opacity = "1"; });
      await wait(600);
    },
    /**
     * Shows a picture (`file`) in a framed card on a dark backdrop for `ms`,
     * drifting down it when it is taller than the frame. For a real screenshot
     * of another program.
     */
    still: async (s) => {
      const src = BASE + "/marketing/search-demo/" + s.file;
      await page.evaluate(async ([src, label, ms]) => {
        const cursor = document.getElementById("demo-cursor"); if (cursor) cursor.style.opacity = "0";
        const previous = document.getElementById("demo-still");
        if (previous) { previous.id = ""; setTimeout(() => previous.remove(), 700); }
        const wrap = document.createElement("div");
        wrap.id = "demo-still";
        wrap.style.cssText = "position:fixed;inset:0;z-index:2147483641;background:radial-gradient(ellipse at 40% 30%,#1b2c4a 0%,#0a1020 75%);opacity:0;transition:opacity .5s ease;display:flex;align-items:center;justify-content:center";
        wrap.innerHTML = "<div style='width:1380px;height:820px;margin-bottom:70px;overflow:hidden;border-radius:22px;border:1px solid rgba(148,163,184,.45);box-shadow:0 30px 90px rgba(0,0,0,.6);background:#fff'><img style='display:block;width:100%;transition:transform " + (ms / 1000).toFixed(2) + "s linear'></div>" +
          (label ? "<div style='position:absolute;left:36px;top:30px;padding:9px 18px;border-radius:999px;background:rgba(8,12,24,.92);border:1px solid rgba(94,234,212,.45);color:#e2e8f0;font:600 20px/1 Inter,system-ui,sans-serif'>" + label + "</div>" : "");
        document.body.appendChild(wrap);
        const img = wrap.querySelector("img");
        img.src = src;
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error("still did not load: " + src)); });
        const extra = Math.max(0, img.getBoundingClientRect().height - 820);
        requestAnimationFrame(() => { wrap.style.opacity = "1"; requestAnimationFrame(() => { img.style.transform = "translateY(-" + extra + "px)"; }); });
      }, [src, s.label || "", s.ms ?? 4000]);
      if (s.while) await run(s.while);
      await wait(s.ms ?? 4000);
      if (!s.keep) {
        await page.evaluate(() => { const w = document.getElementById("demo-still"); if (w) { w.style.opacity = "0"; setTimeout(() => w.remove(), 550); } const cursor = document.getElementById("demo-cursor"); if (cursor) cursor.style.opacity = "1"; });
        await wait(600);
      }
    },
    /** A small label in the top-left corner (which computer this is). "" removes it. */
    tag: async (s) => {
      await page.evaluate(([text, x, y]) => {
        let el = document.getElementById("demo-tag");
        if (!text) { el?.remove(); return; }
        if (!el) {
          el = document.createElement("div"); el.id = "demo-tag";
          el.style.cssText = "position:fixed;left:" + x + "px;top:" + y + "px;z-index:2147483644;padding:9px 18px;border-radius:999px;background:rgba(8,12,24,.92);border:1px solid rgba(94,234,212,.45);color:#e2e8f0;font:600 20px/1 Inter,system-ui,sans-serif;pointer-events:none";
          document.body.appendChild(el);
        }
        el.textContent = text;
      }, [s.text || "", s.x ?? 36, s.y ?? 30]);
    },
    /** Removes whatever clip or still is showing (after a `keep`). */
    clearMedia: async () => {
      await page.evaluate(() => { const cursor = document.getElementById("demo-cursor"); if (cursor) cursor.style.opacity = "1"; });
      await page.evaluate(() => ["demo-clip", "demo-still"].forEach((id) => { const w = document.getElementById(id); if (w) { w.style.opacity = "0"; setTimeout(() => w.remove(), 550); } }));
      await wait(600);
    },
    /** Scrolls an element to the middle of the screen, as a person would. */
    scrollTo: async (s) => { await locate(s.target).evaluate((el, block) => el.scrollIntoView({ behavior: "smooth", block }), s.block || "center"); await wait(s.wait ?? 900); },
    /**
     * What the agent in the clip does, done for real: through the real MCP
     * server it creates a ledger and imports `cfg.agentImport.file` into it.
     * Needs agent access switched on in the app first (on camera).
     */
    agentImport: async () => {
      const job = cfg.agentImport;
      const { createServer, loadConnection } = await import(pathToFileURL(path.join(__dirname, "../../mcp/server.mjs")));
      const env = { ...process.env, VM_CONFIG_FILE: profileConfigPath };
      const server = createServer({ getConnection: () => loadConnection(env) });
      const csv = path.join(OUT, path.basename(job.file));
      fs.writeFileSync(csv, withDates(fs.readFileSync(path.resolve(__dirname, job.file), "utf8")));
      const call = async (name, args) => {
        const result = await server.call(name, args);
        if (result.isError) throw new Error(name + " failed: " + JSON.stringify(result).slice(0, 600));
        return JSON.parse(result.content[0].text);
      };
      const log = {};
      log.createLedger = await call("call_api", { method: "POST", path: "/ledgers", body: { name: job.ledger, currency: job.currency || "EUR" }, confirm: true });
      log.import = await call("import_csv", { ledger: job.ledger, path: csv, dry_run: false });
      fs.writeFileSync(path.join(OUT, "agent-import.json"), JSON.stringify(log, null, 2));
      const imported = log.import.result?.imported ?? 0;
      if (imported !== job.rows) throw new Error("agent import: expected " + job.rows + " rows, got " + imported);
    },
    /**
     * A terminal window drawn over the app. The window is a drawing; what it
     * shows is not: each `run` sends the request to the take's real Local API
     * and prints the real reply. `{ "open": true }` shows it, `{ "close": true }`
     * hides it, and `{ "run": { cmd, method, path, body, select, max } }` types
     * `cmd`, sends the request and prints the reply (`select` picks part of it,
     * e.g. "data[].name" or "paths.keys.length"; `max` caps the lines shown).
     */
    terminal: async (s) => {
      if (s.open) {
        await page.evaluate((note) => {
          const el = document.createElement("aside");
          el.id = "demo-term";
          el.style.cssText = "position:fixed;z-index:2147483642;right:36px;top:150px;width:940px;height:700px;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;border:1px solid #334155;background:#0b1120;box-shadow:0 30px 90px rgba(0,0,0,.65);opacity:0;transform:translateX(40px);transition:opacity .5s ease,transform .5s ease;font:500 21px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#e2e8f0";
          el.innerHTML = "<div style='display:flex;align-items:center;gap:8px;padding:12px 16px;background:#111a2e;border-bottom:1px solid #1e293b'><i style='width:12px;height:12px;border-radius:50%;background:#f87171'></i><i style='width:12px;height:12px;border-radius:50%;background:#fbbf24'></i><i style='width:12px;height:12px;border-radius:50%;background:#34d399'></i><span style='margin-left:10px;color:#94a3b8;font:600 15px Inter,system-ui,sans-serif'>Terminal</span><span style='margin-left:auto;color:#5eead4;font:600 13px Inter,system-ui,sans-serif;letter-spacing:.06em'>" + note + "</span></div><div id='demo-term-body' style='flex:1;overflow:hidden;padding:16px 18px 150px;white-space:pre-wrap;word-break:break-word;display:flex;flex-direction:column;justify-content:flex-end'><div id='demo-term-lines'></div></div>";
          document.body.appendChild(el);
          requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "none"; });
        }, s.note || "REAL API REPLIES");
        stage.sound("whoosh", { gain: 0.1 });
        await wait(700);
      }
      if (s.run) {
        const r = s.run;
        const conf = JSON.parse(fs.readFileSync(profileConfigPath, "utf8"));
        const base = `http://127.0.0.1:${conf.port}/api/v1`;
        const api = async (method, p, body) => {
          const res = await fetch(base + p, { method, headers: { Authorization: "Bearer " + conf.token, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
          const text = await res.text();
          let data; try { data = JSON.parse(text); } catch { data = text; }
          return { status: res.status, data };
        };
        if (!terminalLedgerId) {
          const all = await api("GET", "/ledgers");
          const list = Array.isArray(all.data) ? all.data : all.data.data || all.data.ledgers || [];
          terminalLedgerId = (list.find((l) => l.name === cfg.ledger) || {}).id;
          if (!terminalLedgerId) throw new Error("terminal: ledger not found over the API: " + JSON.stringify(all).slice(0, 300));
        }
        const fill = (v) => JSON.parse(withDates(JSON.stringify(v)).split("{ledgerId}").join(terminalLedgerId));
        // Type the command, key by key, so the sound track gets its clicks.
        await page.evaluate(() => {
          const line = document.createElement("div");
          line.innerHTML = "<span style='color:#34d399'>$ </span><span class='cmd'></span><span class='caret' style='background:#e2e8f0;display:inline-block;width:10px;height:20px;vertical-align:-3px;margin-left:2px'></span>";
          document.getElementById("demo-term-lines").appendChild(line);
        });
        for (const ch of withDates(r.cmd)) {
          stage.ev.keys.push({ t: stage.now(), space: ch === " " });
          await page.evaluate((c) => { const all = document.querySelectorAll("#demo-term-lines .cmd"); all[all.length - 1].textContent += c; }, ch);
          await wait(r.delay ?? 22);
        }
        await wait(350);
        const reply = await api(r.method || "GET", fill(r.path), r.body ? fill(r.body) : undefined);
        fs.writeFileSync(path.join(OUT, "terminal-" + (r.name || "reply") + ".json"), JSON.stringify(reply, null, 2));
        if (reply.status >= 400) throw new Error("terminal: " + r.cmd + " -> " + reply.status + " " + JSON.stringify(reply.data).slice(0, 300));
        // A tiny "jq": a.b, a[] (each item), keys, length.
        let shown = reply.data;
        for (const part of (r.select || "").split(".").filter(Boolean)) {
          if (part === "keys") shown = Object.keys(shown);
          else if (part === "length") shown = Array.isArray(shown) ? shown.length : Object.keys(shown).length;
          else if (part.endsWith("[]")) { const key = part.slice(0, -2); shown = key ? shown[key] : shown; }
          else shown = Array.isArray(shown) ? shown.map((x) => x[part]) : shown[part];
        }
        if (shown === undefined) throw new Error("terminal: select '" + r.select + "' found nothing in " + JSON.stringify(reply.data).slice(0, 200));
        if (r.pick && shown && typeof shown === "object") {
          const pick = (o) => Object.fromEntries(r.pick.filter((k) => k in o).map((k) => [k, o[k]]));
          shown = Array.isArray(shown) ? shown.map(pick) : pick(shown);
        }
        let lines = (typeof shown === "string" ? shown : JSON.stringify(shown, null, 2)).split("\n");
        if (r.max && lines.length > r.max) lines = [...lines.slice(0, r.max), "  …"];
        await page.evaluate(([out, status]) => {
          document.querySelectorAll("#demo-term-lines .caret").forEach((c) => c.remove());
          const block = document.createElement("div");
          block.style.cssText = "color:#93c5fd;margin:2px 0 14px;opacity:0;transition:opacity .35s";
          block.textContent = out;
          const tag = document.createElement("div");
          tag.style.cssText = "color:#64748b;font-size:15px";
          tag.textContent = "HTTP " + status;
          block.prepend(tag);
          const lines = document.getElementById("demo-term-lines");
          lines.appendChild(block);
          requestAnimationFrame(() => { block.style.opacity = "1"; });
        }, [lines.join("\n"), reply.status]);
        await wait(r.hold ?? 900);
      }
      if (s.clear) await page.evaluate(() => { document.getElementById("demo-term-lines").innerHTML = ""; });
      if (s.close) {
        await page.evaluate(() => { const el = document.getElementById("demo-term"); if (el) { el.style.opacity = "0"; el.style.transform = "translateX(40px)"; setTimeout(() => el.remove(), 550); } });
        await wait(600);
      }
    },
  };

  async function run(list) {
    for (const s of list) {
      const fn = steps[s.do];
      if (!fn) throw new Error("unknown step: " + s.do);
      // Say which step failed; a bare stack trace does not.
      try { await fn(s); } catch (error) { error.message = "step " + JSON.stringify(s).slice(0, 160) + ": " + error.message; throw error; }
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
