import { describe, expect, it } from "vitest";
import {
  BOTTOM_BAR_ITEM_IDS,
  NAV_GROUPS,
  findNavItem,
  isBottomBarPage,
  isNavItemActive,
  isNavItemVisible,
} from "./navConfig";

const allItems = NAV_GROUPS.flatMap((group) =>
  group.items.flatMap((item) => [item, ...(item.children ?? [])]),
);

describe("navConfig", () => {
  it("groups pages by what people want to do", () => {
    expect(NAV_GROUPS.map((g) => g.id)).toEqual([
      "everyday",
      "plan",
      "organise",
      "ai",
      "more",
    ]);
    expect(NAV_GROUPS.find((g) => g.id === "more")?.collapsible).toBe(true);
  });

  it("lists every page once", () => {
    const routes = allItems.flatMap((item) => (item.to ? [item.to] : []));
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/calendar",
        "/currencies",
        "/ai-providers",
        "/connect-agent",
        "/reports/essential",
        "/reports/advanced",
      ]),
    );
  });

  it("keeps the four everyday pages in the bottom bar", () => {
    expect(BOTTOM_BAR_ITEM_IDS.map((id) => findNavItem(id)?.to)).toEqual([
      "/dashboard",
      "/transactions",
      "/accounts",
      "/budgets",
    ]);
  });

  it("marks Reports active on both report pages", () => {
    const reports = findNavItem("reports")!;
    expect(isNavItemActive(reports, "/reports/essential")).toBe(true);
    expect(isNavItemActive(reports, "/reports/advanced")).toBe(true);
    expect(isNavItemActive(reports, "/budgets")).toBe(false);
  });

  it("knows when the current page lives behind More", () => {
    expect(isBottomBarPage("/accounts")).toBe(true);
    expect(isBottomBarPage("/calendar")).toBe(false);
    expect(isBottomBarPage("/reports/advanced")).toBe(false);
  });

  it("hides desktop-only and store-restricted items", () => {
    const connect = findNavItem("connectApps")!;
    const donate = findNavItem("donate")!;
    const phone = { isNative: true, hasDesktopBridge: false };
    const desktop = { isNative: false, hasDesktopBridge: true };
    expect(isNavItemVisible(connect, phone)).toBe(false);
    expect(isNavItemVisible(donate, phone)).toBe(false);
    expect(isNavItemVisible(connect, desktop)).toBe(true);
    expect(isNavItemVisible(donate, desktop)).toBe(true);
  });
});
