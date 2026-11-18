/**
 * The shared additive-light canvas (sparks, particles, shields). It is
 * cleared once per frame before any scene draws into it.
 */
let context;

export function fxContext() {
  context ??= document.getElementById("fx").getContext("2d");
  return context;
}

export function clearFx() {
  const ctx = fxContext();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
