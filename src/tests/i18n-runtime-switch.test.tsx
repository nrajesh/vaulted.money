import { describe, it, expect, beforeEach } from "vitest";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider, useTranslation } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import i18n from "@/i18n/config";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";

const DraftFormProbe = () => {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState("initial-draft");

  return (
    <MemoryRouter>
      <div>
        <p>{t("layout.nav.dashboard")}</p>
        <label htmlFor="draft-note">{t("test.draftLabel")}</label>
        <input
          id="draft-note"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <LanguageSwitcher />
        <p>{t("dialogs.addEditTransaction.title.add")}</p>
        <p>{t("dialogs.addEditTransaction.fields.accountSending")}</p>
      </div>
    </MemoryRouter>
  );
};

describe("Runtime i18n switching", () => {
  beforeEach(async () => {
    localStorage.setItem("app-enabled-languages", JSON.stringify(["en"]));
    await i18n.changeLanguage("en");
  });

  it("switches page and modal copy without refresh and preserves draft input", async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DraftFormProbe />
      </I18nextProvider>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Add New Transaction")).toBeInTheDocument();

    const input = screen.getByLabelText("Draft Note");
    fireEvent.change(input, { target: { value: "pending unsaved value" } });

    localStorage.setItem("app-enabled-languages", JSON.stringify(["es"]));
    await i18n.changeLanguage("es");

    await waitFor(() => {
      expect(screen.getByText("Tablero")).toBeInTheDocument();
      expect(screen.getByText("Agregar nueva transaccion")).toBeInTheDocument();
      expect(screen.getByText("Cuenta (envio)")).toBeInTheDocument();
    });

    expect(
      screen.getByDisplayValue("pending unsaved value"),
    ).toBeInTheDocument();
  });

  it("updates help drawer content for the active language", async () => {
    expect(i18n.t("helpDrawer.cards.glance.title")).toBe(
      "Your money at a glance",
    );

    localStorage.setItem("app-enabled-languages", JSON.stringify(["es"]));
    await i18n.changeLanguage("es");

    expect(i18n.t("helpDrawer.cards.glance.title")).toBe(
      "Tu dinero de un vistazo",
    );
  });

  it("lists built-in languages in header menu and switches from there", async () => {
    const user = userEvent.setup();
    localStorage.setItem("app-enabled-languages", JSON.stringify(["zh"]));
    await act(async () => {
      await i18n.changeLanguage("zh");
    });

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <LanguageSwitcher />
        </I18nextProvider>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: i18n.t("language.label") }),
    );

    const menuItems = await screen.findAllByRole("menuitem");
    expect(menuItems.length).toBeGreaterThanOrEqual(4);

    const englishRow = menuItems.find((element) =>
      element.textContent?.trim().startsWith("English"),
    );
    expect(englishRow).toBeTruthy();
    await user.click(englishRow!);

    await waitFor(() => {
      expect(i18n.language.startsWith("en")).toBe(true);
    });
    const stored = JSON.parse(
      localStorage.getItem("app-enabled-languages") || "[]",
    ) as string[];
    expect(stored).toEqual(["en"]);
  });

  it("rebuilds dropdown labels when the active language changes", async () => {
    const user = userEvent.setup();
    localStorage.setItem("app-enabled-languages", JSON.stringify(["zh"]));

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <LanguageSwitcher />
        </I18nextProvider>
      </MemoryRouter>,
    );

    await i18n.changeLanguage("zh");

    await user.click(
      screen.getByRole("button", { name: i18n.t("language.label") }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: /English \(英语\)/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /தமிழ் \(泰米尔语\)/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /Nederlands \(荷兰语\)/ }),
      ).toBeInTheDocument();
    });
  });

  it("does not show bracket text for the active language when the localized name matches the native name", async () => {
    const user = userEvent.setup();
    localStorage.setItem("app-enabled-languages", JSON.stringify(["es"]));

    await act(async () => {
      await i18n.changeLanguage("es");
    });

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <LanguageSwitcher />
        </I18nextProvider>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: i18n.t("language.label") }),
    );

    expect(
      screen.getByRole("menuitem", { name: /^Español$/ }),
    ).toBeInTheDocument();
  });

  it("does not show bracket text for Chinese when Chinese is the active language", async () => {
    const user = userEvent.setup();
    localStorage.setItem("app-enabled-languages", JSON.stringify(["zh"]));

    await act(async () => {
      await i18n.changeLanguage("zh");
    });

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <LanguageSwitcher />
        </I18nextProvider>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: i18n.t("language.label") }),
    );

    expect(
      screen.getByRole("menuitem", { name: /^中文$/ }),
    ).toBeInTheDocument();
  });
});
