#!/usr/bin/env python3
"""Writes the QR codes for the end card to out/qr-*.svg (needs `pip install segno`)."""
import os
import segno

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
os.makedirs(OUT, exist_ok=True)
CODES = {
    "qr-site": "https://vaulted.money",
    "qr-github": "https://github.com/nrajesh/vaulted.money",
}
for name, url in CODES.items():
    # Dark modules on a light background scan best, even on a dark slide.
    qr = segno.make(url, error="m")
    qr.save(os.path.join(OUT, f"{name}.svg"), dark="#0b1220", light="#ffffff", border=2, scale=1, xmldecl=False)
    print("•", name, url, f"({qr.version} / {qr.designator})")
