import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeStoreLinks from "@/components/homepage/HomeStoreLinks";

describe("HomeStoreLinks", () => {
  it("renders a card for each place the app is sold", () => {
    render(<HomeStoreLinks />);
    expect(screen.getByText(/apple app store/i)).toBeInTheDocument();
    expect(screen.getByText(/google play store/i)).toBeInTheDocument();
    expect(screen.getByText(/^polar$/i)).toBeInTheDocument();
    expect(screen.queryByText(/lemon squeezy/i)).not.toBeInTheDocument();
  });

  it("shows Coming Soon on the two phone stores only", () => {
    render(<HomeStoreLinks />);
    expect(screen.getAllByText("Coming Soon")).toHaveLength(2);
  });

  it("links only the live desktop listing, with its price", () => {
    render(<HomeStoreLinks />);
    const links = screen.getAllByRole("link", { name: /polar/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute(
      "href",
      expect.stringContaining("buy.polar.sh"),
    );
    expect(links[0]).toHaveTextContent("€9.99");
    // The phone stores stay plain, non-clickable cards until their listings are live.
    expect(
      screen.queryAllByRole("link", { name: /apple app store|google play/i }),
    ).toHaveLength(0);
  });
});
