import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { pngSize } from "./png.mjs";

// A valid 1×1 transparent PNG.
const ONE_BY_ONE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

describe("pngSize", () => {
  it("reads width and height from the PNG header", () => {
    expect(pngSize(ONE_BY_ONE)).toMatchObject({ width: 1, height: 1 });
  });

  it("reports whether the image has an alpha channel", () => {
    // The 1×1 sample is RGBA (colour type 6).
    expect(pngSize(ONE_BY_ONE).alpha).toBe(true);
  });

  it("rejects something that is not a PNG", () => {
    expect(() => pngSize(Buffer.from("not an image"))).toThrow(/PNG/);
  });
});
