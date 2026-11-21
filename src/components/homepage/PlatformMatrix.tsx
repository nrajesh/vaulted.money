import { Check, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

type Support = "yes" | "no" | "partial";

interface PlatformRow {
  id: string;
  label: string;
  web: Support;
  phone: Support;
  desktop: Support;
}

/**
 * What works where, shown before anyone downloads. The core ledger is the
 * same everywhere; the automation tier needs the desktop app because phones
 * and browsers do not let an app run a server or reach other programs on the
 * computer. Keep this in step with `canUseLocalModels` and the Local API.
 */
export const PlatformMatrix = () => {
  const { t } = useTranslation();

  const core: PlatformRow[] = [
    {
      id: "ledger",
      label: t("home.platforms.rows.ledger", {
        defaultValue: "Accounts, transactions, budgets and reports",
      }),
      web: "yes",
      phone: "yes",
      desktop: "yes",
    },
    {
      id: "search",
      label: t("home.platforms.rows.search", {
        defaultValue: "Plain-English search, offline",
      }),
      web: "yes",
      phone: "yes",
      desktop: "yes",
    },
    {
      id: "sync",
      label: t("home.platforms.rows.sync", {
        defaultValue: "Encrypted sync through your own cloud folder",
      }),
      web: "partial",
      phone: "yes",
      desktop: "yes",
    },
    {
      id: "cloudAi",
      label: t("home.platforms.rows.cloudAi", {
        defaultValue: "AI categories with your own cloud AI key",
      }),
      web: "yes",
      phone: "yes",
      desktop: "yes",
    },
  ];
  const desktopOnly: PlatformRow[] = [
    {
      id: "localAi",
      label: t("home.platforms.rows.localAi", {
        defaultValue: "AI on your own computer (LM Studio, Ollama)",
      }),
      web: "no",
      phone: "no",
      desktop: "yes",
    },
    {
      id: "agents",
      label: t("home.platforms.rows.agents", {
        defaultValue: "Connect an AI agent (MCP)",
      }),
      web: "no",
      phone: "no",
      desktop: "yes",
    },
    {
      id: "api",
      label: t("home.platforms.rows.api", {
        defaultValue: "Local API for scripts",
      }),
      web: "no",
      phone: "no",
      desktop: "yes",
    },
  ];

  const cell = (support: Support) => {
    if (support === "no") {
      return (
        <>
          <Minus
            className="mx-auto h-4 w-4 text-slate-500 dark:text-slate-400"
            aria-hidden
          />
          <span className="sr-only">
            {t("home.platforms.no", { defaultValue: "Not available" })}
          </span>
        </>
      );
    }
    return (
      <>
        <Check
          className="mx-auto h-4 w-4 text-emerald-700 dark:text-emerald-300"
          aria-hidden
        />
        <span className="sr-only">
          {t("home.platforms.yes", { defaultValue: "Available" })}
        </span>
        {support === "partial" && (
          <span className="block text-[0.7rem] leading-4 text-slate-600 dark:text-slate-300">
            {t("home.platforms.chromeEdge", {
              defaultValue: "Chrome, Edge",
            })}
          </span>
        )}
      </>
    );
  };

  const group = (title: string, rows: PlatformRow[]) => (
    <tbody>
      <tr>
        <th
          scope="colgroup"
          colSpan={4}
          className="bg-slate-50 px-3 pt-4 pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          {title}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={row.id} className="border-t border-table-rule">
          <th
            scope="row"
            className="break-words px-3 py-2 text-left text-sm font-medium text-slate-900 dark:text-slate-50"
          >
            {row.label}
          </th>
          <td className="px-2 py-2 text-center">{cell(row.web)}</td>
          <td className="px-2 py-2 text-center">{cell(row.phone)}</td>
          <td className="px-2 py-2 text-center">{cell(row.desktop)}</td>
        </tr>
      ))}
    </tbody>
  );

  return (
    <div id="platforms" className="mt-10 scroll-mt-24 sm:scroll-mt-28">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
        {t("home.platforms.title", { defaultValue: "What works where" })}
      </h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
        {t("home.platforms.intro", {
          defaultValue:
            "Your books work the same on every device. Automation needs the desktop app: phones and browsers do not let an app run a server or talk to other programs on your computer, and Vaulted Money respects that.",
        })}
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-table-rule">
        <table className="w-full min-w-[20rem] border-collapse">
          <caption className="sr-only">
            {t("home.platforms.title", { defaultValue: "What works where" })}
          </caption>
          <thead>
            <tr className="text-xs text-slate-700 dark:text-slate-200">
              <td />
              <th scope="col" className="w-[18%] px-2 py-2 font-semibold">
                {t("home.platforms.web", { defaultValue: "Web" })}
              </th>
              <th scope="col" className="w-[18%] px-2 py-2 font-semibold">
                {t("home.platforms.phone", {
                  defaultValue: "iPhone, iPad, Android",
                })}
              </th>
              <th scope="col" className="w-[18%] px-2 py-2 font-semibold">
                {t("home.platforms.desktop", {
                  defaultValue: "Desktop app",
                })}
              </th>
            </tr>
          </thead>
          {group(
            t("home.platforms.coreGroup", {
              defaultValue: "Your books: every device",
            }),
            core,
          )}
          {group(
            t("home.platforms.desktopGroup", {
              defaultValue: "Automation and agents: desktop app",
            }),
            desktopOnly,
          )}
        </table>
      </div>
    </div>
  );
};
