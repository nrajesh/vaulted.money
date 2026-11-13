import { useTranslation } from "react-i18next";
import { CurrencyManagement } from "@/components/management/CurrencyManagement";

const CurrenciesPage = () => {
  const { t } = useTranslation();
  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="app-gradient-title app-page-title">
            {t("nav.items.currencies", { defaultValue: "Currencies" })}
          </h1>
          <p className="app-page-subtitle">
            {t("pages.currencies.subtitle", {
              defaultValue: "Currencies you use and their exchange rates.",
            })}
          </p>
        </div>
      </div>
      <div className="tour-currencies-mgmt">
        <CurrencyManagement />
      </div>
    </div>
  );
};

export default CurrenciesPage;
