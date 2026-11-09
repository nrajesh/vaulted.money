#!/usr/bin/env python3
"""Builds the images an end card needs: both logos (cropped) and a QR code.

    python3 lib/assets.py --url https://vaulted.money --out out/assets.json

Needs: pip install pillow segno
"""
import argparse, base64, io, json, os
import segno
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def crop(path):
    im = Image.open(path).convert("RGBA")
    box = im.getchannel("A").point(lambda a: 255 if a > 20 else 0).getbbox()
    pad = 24
    l, t, r, b = box
    im = im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))
    buf = io.BytesIO()
    im.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


ap = argparse.ArgumentParser()
ap.add_argument("--url", default="https://vaulted.money")
ap.add_argument("--out", default="out/assets.json")
args = ap.parse_args()

qr = segno.make(args.url, error="m")
svg = qr.svg_inline(scale=1, border=2, dark="#0a0f1c", light="#ffffff", omitsize=True)
os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
json.dump(
    {
        "logoLight": crop(os.path.join(ROOT, "src/assets/logo-square-light.png")),
        "logoDark": crop(os.path.join(ROOT, "src/assets/logo-square-dark.png")),
        "qr": svg,
        "url": args.url,
    },
    open(args.out, "w"),
)
print("assets ->", args.out)
