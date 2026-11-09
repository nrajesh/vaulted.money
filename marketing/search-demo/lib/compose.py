#!/usr/bin/env python3
"""Turns a recorded take + events.json into the finished MP4.

    python3 lib/compose.py --dir out --speed 1.4 --out final/video.mp4

What it adds to the raw screen recording:
  * a sound track: soft keyboard clicks for every key the recording pressed,
    a tick per click, chimes / whooshes the storyboard asked for, and a very
    quiet pad underneath (all synthesised: royalty-free);
  * camera zooms from the storyboard's zoomTo() calls (smooth ease);
  * a speed-up, and 1080p output.

Needs: ffmpeg, pip install numpy
"""
import argparse, json, os, subprocess, wave
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--dir", default="out")
ap.add_argument("--speed", type=float, default=1.4)
ap.add_argument("--lead", type=float, default=0.4, help="seconds kept before the 'intro' mark")
ap.add_argument("--out", default="final/video.mp4")
ap.add_argument("--foley", type=float, default=0.0,
                help="0 = quiet background only (default); 1 = full keyboard clicks, ticks, chimes and whooshes")
args = ap.parse_args()

ev = json.load(open(os.path.join(args.dir, "events.json")))
M = ev["marks"]
SPEED = args.speed
SS = M["intro"] - args.lead
tout = lambda t: (t - SS) / SPEED          # raw seconds -> output seconds
DUR = tout(M["end"]) + 0.2
print("output duration: %.1fs" % DUR)

# ------------------------------------------------------------------ audio
sr = 44100
n = int(sr * DUR)
rng = np.random.default_rng(11)
L = np.zeros(n)
R = np.zeros(n)


def put(sig, t, pan=0.5, gain=1.0):
    i = int(t * sr)
    if i < 0 or i >= n:
        return
    e = min(n, i + len(sig))
    s = sig[: e - i] * gain
    L[i:e] += s * (1 - pan)
    R[i:e] += s * pan


def key(deep=False):
    ln = int(sr * 0.07); x = np.arange(ln) / sr
    noise = rng.standard_normal(ln)
    hp = np.concatenate([[0], np.diff(noise)])
    lp = np.convolve(hp, np.ones(3) / 3, mode="same")
    click = lp * np.exp(-x / 0.0045) * 0.55
    f = 95 if deep else rng.uniform(150, 210)
    thump = np.sin(2 * np.pi * f * x) * np.exp(-x / 0.022) * (0.5 if deep else 0.35)
    rel = np.zeros(ln); k = int(sr * 0.045); m = int(sr * 0.012)
    rel[k:k + m] = lp[:m] * np.exp(-np.arange(m) / sr / 0.003) * 0.18
    return click + thump + rel


def tick():
    ln = int(sr * 0.05); x = np.arange(ln) / sr
    return np.sin(2 * np.pi * 1500 * x) * np.exp(-x / 0.008) * 0.25 + rng.standard_normal(ln) * np.exp(-x / 0.003) * 0.1


def bell(f, ln=1.6):
    x = np.arange(int(sr * ln)) / sr
    return (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * 2.01 * f * x) + 0.15 * np.sin(2 * np.pi * 3.02 * f * x)) * np.exp(-x * 2.6)


def whoosh(ln=0.9):
    x = np.arange(int(sr * ln)) / sr
    sm = np.convolve(rng.standard_normal(len(x)), np.ones(40) / 40, mode="same")
    return sm * np.sin(np.pi * np.clip(x / ln, 0, 1)) ** 2 * 1.6


FO = args.foley
if FO > 0:
    for k in ev["keys"]:
        put(key(k["space"]), tout(k["t"]), pan=rng.uniform(0.42, 0.58), gain=rng.uniform(0.75, 1.0) * 0.9 * FO)
    for c in ev["clicks"]:
        put(tick(), tout(c), gain=0.8 * FO)
for s in ev["sounds"]:
    t = tout(s["t"]); g = s.get("gain")
    if s["kind"] == "chime" and FO > 0:       # two notes: something was applied
        for j, f in enumerate([1046.5, 1318.5]):
            put(bell(f), t + 0.15 + 0.09 * j, gain=(g or 0.07) * FO)
    elif s["kind"] == "whoosh" and FO > 0:
        put(whoosh(1.0), t - 0.05, gain=(g or 0.13) * FO)
    elif s["kind"] == "sparkle":              # one soft rising arpeggio for the reveal
        for j, f in enumerate([523.25, 659.25, 783.99, 1046.5, 1318.5]):
            put(bell(f, 2.6), t + 0.45 + 0.11 * j, gain=(g or 0.06) * (0.55 + 0.45 * FO))

# very quiet pad underneath, three chords across the video
tt = np.arange(n) / sr
mid = lambda m: 440 * 2 ** ((m - 69) / 12)
chords = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 55, 59]]
seg = DUR / len(chords)
PAD = 0.020 if FO > 0 else 0.034        # the pad is the whole sound track when there is no foley
for ci, ch in enumerate(chords):
    e = np.zeros(n); i0 = int(ci * seg * sr); i1 = min(n, int(((ci + 1) * seg + 2.0) * sr))
    t_ = np.arange(i0, i1) / sr
    e[i0:i1] = np.minimum(np.clip((t_ - ci * seg) / 2.0, 0, 1), np.clip(((ci + 1) * seg + 2.0 - t_) / 2.0, 0, 1)) ** 1.5
    for k, m in enumerate(ch):
        slow = 1 + 0.12 * np.sin(2 * np.pi * 0.15 * tt + k)      # gentle swell
        w = (np.sin(2 * np.pi * mid(m) * tt) + 0.2 * np.sin(2 * np.pi * 2 * mid(m) * tt)) * e * PAD * slow
        pan = 0.35 + 0.1 * k
        L += w * (1 - pan); R += w * pan
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = L / peak * 0.7, R / peak * 0.7
fade = np.clip(tt / 0.6, 0, 1) * np.clip((DUR - tt) / 1.4, 0, 1)
L *= fade; R *= fade
raw = os.path.join(args.dir, "audio_raw.wav")
with wave.open(raw, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((np.stack([L, R], 1) * 32767).astype(np.int16).tobytes())
audio = os.path.join(args.dir, "audio.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", "aecho=0.7:0.5:45:0.15,loudnorm=I=-20:TP=-1.5:LRA=7", "-ar", "44100", audio], check=True)

# ------------------------------------------------------------------ camera
frames = sorted(ev["zoom"], key=lambda z: z["t"])
W, H = 1920, 1080
K = [(max(0.0, tout(z["t"])), z["z"], z["cx"], z["cy"]) for z in frames] or [(0.0, 1.0, W / 2, H / 2)]


def piece(idx):
    tt_ = "(on/30)"
    expr = f"{K[-1][idx]}"
    for i in range(len(K) - 2, -1, -1):
        ta, tb = K[i][0], K[i + 1][0]; va, vb = K[i][idx], K[i + 1][idx]
        if tb <= ta:
            continue
        if va == vb:
            expr = f"if(lt({tt_},{tb:.3f}),{va},{expr})"
            continue
        s = f"(({tt_}-{ta:.3f})/{tb - ta:.3f})"
        expr = f"if(lt({tt_},{tb:.3f}),{va}+({vb}-{va})*({s}*{s}*(3-2*{s})),{expr})"
    return f"if(lt({tt_},{K[0][0]:.3f}),{K[0][idx]},{expr})"


Z = piece(1); CX = f"(({piece(2)})*2)"; CY = f"(({piece(3)})*2)"   # input is upscaled 2x
x = f"max(0,min(iw-iw/({Z}),{CX}-iw/({Z})/2))"
y = f"max(0,min(ih-ih/({Z}),{CY}-ih/({Z})/2))"
vf = (f"setpts=PTS/{SPEED},fps=30,scale=3840:2160:flags=lanczos,"
      f"zoompan=z='{Z}':x='{x}':y='{y}':d=1:s=1920x1080:fps=30,format=yuv420p")
os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
subprocess.run([
    "ffmpeg", "-v", "error", "-y", "-ss", f"{SS:.3f}", "-t", f"{DUR * SPEED:.3f}",
    "-i", os.path.join(args.dir, "take.webm"), "-i", audio,
    "-filter_complex", f"[0:v]{vf}[v]", "-map", "[v]", "-map", "1:a",
    "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-c:a", "aac", "-b:a", "192k",
    "-t", f"{DUR:.3f}", "-movflags", "+faststart", args.out,
], check=True)
print("video ->", args.out)
