import { describe, it, expect } from "vitest";
import { parseSearchQuery } from "../utils/searchParser";

const emptyContext = {
  accounts: [],
  categories: [],
  subCategories: [],
  vendors: [],
};

describe("search parser: between month-year ranges", () => {
  it("reads 'between jan 2020 and dec 2021' as the whole span", () => {
    const { dateRange } = parseSearchQuery(
      "between jan 2020 and dec 2021",
      emptyContext,
    );
    expect(dateRange?.from?.getFullYear()).toBe(2020);
    expect(dateRange?.from?.getMonth()).toBe(0);
    expect(dateRange?.from?.getDate()).toBe(1);
    expect(dateRange?.to?.getFullYear()).toBe(2021);
    expect(dateRange?.to?.getMonth()).toBe(11);
    expect(dateRange?.to?.getDate()).toBe(31);
  });
});
