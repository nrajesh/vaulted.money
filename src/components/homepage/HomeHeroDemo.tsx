import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Smartphone } from "lucide-react";

/**
 * Visual scale factor — the iframe renders at real device dimensions,
 * then CSS `transform: scale()` shrinks it to look like a miniature phone.
 * 0.75 = 75 % of real size → gives the "looking at a phone on a desk" feel.
 */
const PREVIEW_SCALE = 0.75;
const DEFAULT_WIDTH = 393;
const DEFAULT_HEIGHT = 852;

/**
 * Dimension limits.
 * MAX_WIDTH is derived from the container's max-w-[26rem] (416 px):
 *   phoneFrameWidth = visualWidth + 24  ≤ 416
 *   visualWidth     = width × 0.75      ≤ 392
 *   width                               ≤ 522  → floor to 520
 * MAX_HEIGHT matches the tallest common iOS device (iPhone 14 Pro Max).
 */
const MIN_WIDTH = 320;
const MAX_WIDTH = 520;
const MIN_HEIGHT = 568;
const MAX_HEIGHT = 932;
const HomeHeroDemo = () => {
  const { t } = useTranslation();
  const [deviceWidth, setDeviceWidth] = useState<number | "">(DEFAULT_WIDTH);
  const [deviceHeight, setDeviceHeight] = useState<number | "">(DEFAULT_HEIGHT);

  // Use fallback values if inputs are empty or invalid
  const width =
    typeof deviceWidth === "number" && deviceWidth > 0
      ? deviceWidth
      : DEFAULT_WIDTH;
  const height =
    typeof deviceHeight === "number" && deviceHeight > 0
      ? deviceHeight
      : DEFAULT_HEIGHT;

  // The iframe renders at the real device resolution.
  // The outer wrapper is sized to the *visual* (scaled-down) dimensions
  // so the rest of the page layout flows correctly.
  const visualWidth = Math.round(width * PREVIEW_SCALE);
  const visualHeight = Math.round(height * PREVIEW_SCALE);

  return (
    <div className="mx-auto w-full max-w-[26rem]">
      <div className="mb-4 text-center">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
          {t("home.hero.demoLabel", {
            defaultValue: "Actual mobile /ledgers screen",
          })}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t("home.hero.demoDescription", {
            defaultValue:
              "Rendered live from the app at real device dimensions so the homepage matches the real mobile experience.",
          })}
        </p>
      </div>

      {/* Editable Device config */}
      <div className="relative mb-3 flex items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("home.hero.demoDimensions", { defaultValue: "Dimensions" })}
          </span>
          <input
            type="number"
            value={deviceWidth}
            min={MIN_WIDTH}
            max={MAX_WIDTH}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setDeviceWidth("");
              } else {
                setDeviceWidth(
                  Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(val))),
                );
              }
            }}
            placeholder="W"
            className="w-14 bg-transparent text-right text-xs text-slate-500 focus:outline-none dark:text-slate-300"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">×</span>
          <input
            type="number"
            value={deviceHeight}
            min={MIN_HEIGHT}
            max={MAX_HEIGHT}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setDeviceHeight("");
              } else {
                setDeviceHeight(
                  Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Number(val))),
                );
              }
            }}
            placeholder="H"
            className="w-14 bg-transparent text-xs text-slate-500 focus:outline-none dark:text-slate-300"
          />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            px
          </span>
        </div>
      </div>

      {/* Phone frame */}
      <div className="flex justify-center">
        <div
          className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] p-3 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.8),rgba(2,6,23,0.98))] dark:shadow-black/45"
          style={{ width: `${visualWidth + 24}px` }}
        >
          <div
            className="mx-auto mb-3 h-1.5 rounded-full bg-slate-300/80 dark:bg-slate-700/80"
            style={{ width: `${Math.round(visualWidth * 0.35)}px` }}
          />

          {/* Scaled viewport wrapper — outer div is visual size, inner iframe is real size */}
          <div
            className="relative mx-auto overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-slate-950 shadow-sm dark:border-slate-700"
            style={{
              width: `${visualWidth}px`,
              height: `${visualHeight}px`,
            }}
          >
            <iframe
              title="Vaulted Money mobile ledger screen"
              src="/ledgers?preview=homepage-mobile"
              className="border-0 bg-slate-950"
              style={{
                width: `${width}px`,
                height: `${height}px`,
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] leading-5 text-slate-500 dark:text-slate-400">
        Live app preview · rendered at {Math.round(PREVIEW_SCALE * 100)}% scale
      </p>
    </div>
  );
};

export default HomeHeroDemo;
