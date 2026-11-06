import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { inflateSync } from "node:zlib";
import { join } from "node:path";
// @ts-expect-error plain ESM module without types
import { stageMcpb } from "./build-mcpb.mjs";
// @ts-expect-error plain ESM module without types
import { createServer } from "../mcp/server.mjs";

/**
 * Decode an 8-bit RGBA, non-interlaced PNG into raw pixels (node:zlib only, no
 * image dependency). Returns the width, height and RGBA bytes.
 */
const decodePng = (png: Buffer) => {
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  expect(png[24]).toBe(8); // bit depth
  expect(png[25]).toBe(6); // colour type RGBA
  const chunks: Buffer[] = [];
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at);
    if (png.toString("latin1", at + 4, at + 8) === "IDAT")
      chunks.push(png.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const value = raw[y * (stride + 1) + 1 + x];
      const left = x >= 4 ? out[y * stride + x - 4] : 0;
      const up = y > 0 ? out[(y - 1) * stride + x] : 0;
      const upLeft = x >= 4 && y > 0 ? out[(y - 1) * stride + x - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      out[y * stride + x] = (value + predictor) & 255;
    }
  }
  return { width, height, pixels: out };
};

/** The Claude Desktop bundle: what gets staged and what the manifest promises. */
describe("stageMcpb", () => {
  let dir = "";
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const stage = () => {
    dir = mkdtempSync(join(tmpdir(), "mcpb-"));
    stageMcpb(dir);
    return JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  };

  it("stages the manifest and a byte-identical copy of the server", () => {
    stage();
    expect(readFileSync(join(dir, "server/index.mjs"), "utf8")).toBe(
      readFileSync("mcp/server.mjs", "utf8"),
    );
    expect(readFileSync(join(dir, "manifest.json"), "utf8")).toBe(
      readFileSync("mcpb/manifest.json", "utf8"),
    );
  });

  it("points the entry point and launch args at the staged server", () => {
    const manifest = stage();
    expect(existsSync(join(dir, manifest.server.entry_point))).toBe(true);
    expect(manifest.server.mcp_config.args).toEqual([
      "${__dirname}/" + manifest.server.entry_point,
    ]);
    expect(manifest.server.entry_point.endsWith(".mjs")).toBe(true);
    expect(manifest.user_config).toBeUndefined();
  });

  it("lists exactly the tools the server exposes", () => {
    const manifest = stage();
    const served = createServer({
      baseUrl: "http://127.0.0.1:1",
      token: "x",
    }).tools.map((t: { name: string }) => t.name);
    expect(manifest.tools.map((t: { name: string }) => t.name).sort()).toEqual(
      [...served].sort(),
    );
    for (const tool of manifest.tools)
      expect(tool.description.length).toBeGreaterThan(0);
  });

  it("stages the app icon the manifest points at, as a square PNG", () => {
    const manifest = stage();
    expect(manifest.icon).toBe("icon.png");
    const staged = readFileSync(join(dir, manifest.icon));
    // The cropped source icon, copied at build time rather than duplicated.
    expect(staged.equals(readFileSync("mcpb/icon.png"))).toBe(true);
    // PNG signature, then width/height as big-endian uint32 in the IHDR chunk.
    expect(staged.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    const width = staged.readUInt32BE(16);
    const height = staged.readUInt32BE(20);
    expect(width).toBe(height);
    expect(width).toBe(512);
  });

  it("fills the icon tile: the logo spans most of the width", () => {
    stage();
    const { width, height, pixels } = decodePng(
      readFileSync(join(dir, "icon.png")),
    );
    let minX = width;
    let maxX = -1;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const at = (y * width + x) * 4;
        const [r, g, b, a] = [
          pixels[at],
          pixels[at + 1],
          pixels[at + 2],
          pixels[at + 3],
        ];
        const isContent = a > 32 && !(r > 240 && g > 240 && b > 240);
        if (!isContent) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    expect((maxX - minX + 1) / width).toBeGreaterThanOrEqual(0.7);
  });
});
