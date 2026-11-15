/**
 * Width, height and whether a PNG carries an alpha channel (colour types 4
 * and 6), read from its IHDR chunk. Store screenshots must not have one.
 */
export function pngSize(buf) {
  const signature = "89504e470d0a1a0a";
  if (buf.length < 24 || buf.subarray(0, 8).toString("hex") !== signature)
    throw new Error("Not a PNG file");
  const colourType = buf[25];
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    alpha: colourType === 4 || colourType === 6,
  };
}
