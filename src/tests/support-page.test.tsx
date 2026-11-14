import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/config";
import { saveEnabledLanguages } from "@/i18n/languagePreferences";
import DonationPage from "@/pages/DonationPage";

const renderPage = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <DonationPage />
    </I18nextProvider>,
  );

describe("Support the project page", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
    saveEnabledLanguages(["en"]);
  });

  it("explains the project and offers optional support, without QR codes", async () => {
    await i18n.changeLanguage("en");
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Why Vaulted Money exists" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No ads, no tracking and no selling your data."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText(/revolut|paypal/i)).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /sponsor on github/i }),
    ).toHaveAttribute("href", "https://github.com/sponsors/nrajesh");
  });

  it("lists the App Store, Google Play and Polar as coming soon", async () => {
    await i18n.changeLanguage("en");
    renderPage();

    const stores = within(
      screen.getByRole("region", { name: "Pay once in a store" }),
    );
    expect(stores.getByText("Apple App Store")).toBeInTheDocument();
    expect(stores.getByText("Google Play Store")).toBeInTheDocument();
    expect(stores.getByText("Polar")).toBeInTheDocument();
    expect(stores.getAllByText("Coming soon")).toHaveLength(3);
    expect(screen.queryByText(/lemon squeezy/i)).not.toBeInTheDocument();
    // No store links (or store logos) until a listing is live.
    expect(stores.queryAllByRole("link")).toHaveLength(0);
  });

  it("is translated", async () => {
    // A language applies only once it is the enabled one (one at a time).
    saveEnabledLanguages(["ta"]);
    await i18n.changeLanguage("ta");
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "திட்டத்தை ஆதரிக்கவும்" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("விரைவில்")).toHaveLength(3);
  });
});
