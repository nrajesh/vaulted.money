import React from "react";
import { useTranslation } from "react-i18next";
import { FileText, FileSpreadsheet } from "lucide-react";
import { PageActionBar } from "@/components/layout/PageActionBar";

interface ExportButtonsProps {
  onPdfExport: () => void;
  onCsvExport: () => void;
}

/**
 * The report export choices as one "Export" menu, matching the Actions menu
 * on the list pages instead of three separate buttons.
 */
const ExportButtons: React.FC<ExportButtonsProps> = ({
  onPdfExport,
  onCsvExport,
}) => {
  const { t } = useTranslation();
  return (
    <PageActionBar
      menuLabel={t("reports.export.menu", { defaultValue: "Export" })}
      secondary={[
        {
          id: "pdf",
          icon: FileText,
          label: "PDF",
          description: t("reports.export.pdf", {
            defaultValue: "A document to print or share",
          }),
          onSelect: onPdfExport,
        },
        {
          id: "csv",
          icon: FileSpreadsheet,
          label: "CSV",
          description: t("reports.export.csv", {
            defaultValue: "Opens in Excel, Numbers or Sheets",
          }),
          onSelect: onCsvExport,
        },
      ]}
    />
  );
};

export default ExportButtons;
