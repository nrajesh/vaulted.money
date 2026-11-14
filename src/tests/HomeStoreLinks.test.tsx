import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeStoreLinks from "@/components/homepage/HomeStoreLinks";

describe("HomeStoreLinks", () => {
  it("renders three placeholder cards by default", () => {
    render(<HomeStoreLinks />);
    expect(screen.getByText(/apple app store/i)).toBeInTheDocument();
    expect(screen.getByText(/google play store/i)).toBeInTheDocument();
    expect(screen.getByText(/^polar$/i)).toBeInTheDocument();
    expect(screen.queryByText(/lemon squeezy/i)).not.toBeInTheDocument();
  });

  it("shows Coming Soon indicator on inactive cards", () => {
    render(<HomeStoreLinks />);
    // Card-level indicators only (exact text match)
    const comingSoonElements = screen.getAllByText("Coming Soon");
    expect(comingSoonElements.length).toBe(3);
  });

  it("placeholder cards are not clickable links", () => {
    render(<HomeStoreLinks />);
    // None of the inactive cards should be anchor tags
    expect(
      screen.queryAllByRole("link", {
        name: /apple app store|google play store|polar/i,
      }).length,
    ).toBe(0);
  });
});
