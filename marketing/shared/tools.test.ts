import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module without type declarations
import { checkTools } from "./tools.mjs";

const check = checkTools as (
  needs: string[],
  which: (cmd: string) => boolean,
) => string[];

describe("checkTools", () => {
  it("says how to install a missing tool", () => {
    const messages = check(["ffmpeg"], () => false);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("brew install ffmpeg");
  });

  it("is silent when everything is installed", () => {
    expect(check(["ffmpeg", "xcrun"], () => true)).toEqual([]);
  });

  it("names Xcode for xcrun", () => {
    expect(check(["xcrun"], () => false)[0]).toContain("Xcode");
  });
});
