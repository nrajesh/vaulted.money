import * as React from "react";

import { Capacitor } from "@capacitor/core";
import { SearchFilterBar } from "@/components/filters/SearchFilterBar";
import ExportButtons from "@/components/reports/ExportButtons";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { useTransactionData } from "@/hooks/transactions/useTransactionData";
import { useTransactions } from "@/contexts/TransactionsContext";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery } from "@tanstack/react-query";
import { useLedger } from "@/contexts/LedgerContext";
import { Budget } from "@/types/dataProvider";
import { slugify } from "@/lib/utils";
import { useDataProvider } from "@/context/DataProviderContext";
import { format } from "date-fns";
import { saveFile } from "@/utils/backupUtils";

import { Transaction } from "@/types/dataProvider";
import { Payee } from "@/components/dialogs/AddEditPayeeDialog";

interface ReportLayoutProps {
  title: string;
  description: React.ReactNode;
  children: (props: {
    historicalFilteredTransactions: Transaction[];
    combinedFilteredTransactions: Transaction[];
    futureFilteredTransactions: Transaction[];
    allTransactions: Transaction[];
    accounts: Payee[];
    budgets: Budget[];
  }) => React.ReactNode;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({
  title,
  description,
  children,
}) => {
  const {
    accounts,
    vendors,
    categories,
    transactions: allTransactions,
  } = useTransactions();
  const { activeLedger } = useLedger();

  const availableAccountOptions = React.useMemo(
    () =>
      accounts.map((acc) => ({
        value: slugify(acc.name),
        label: acc.name,
      })),
    [accounts],
  );

  const availableVendorOptions = React.useMemo(
    () => vendors.map((v) => ({ value: slugify(v.name), label: v.name })),
    [vendors],
  );

  const availableCategoryOptions = React.useMemo(
    () => categories.map((c) => ({ value: slugify(c.name), label: c.name })),
    [categories],
  );

  const accountNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => {
      map.set(slugify(acc.name), acc.name);
    });
    return map;
  }, [accounts]);

  const filterProps = useTransactionFilters();

  const effectiveAccounts = React.useMemo(() => {
    if (filterProps.selectedAccounts.length === 0) return accounts;
    return accounts.filter((a) =>
      filterProps.selectedAccounts.includes(slugify(a.name)),
    );
  }, [accounts, filterProps.selectedAccounts]);

  const dataProps = useTransactionData({
    ...filterProps,
    excludeTransfers: filterProps.excludeTransfers,
    availableAccountOptions,
    availableCategoryOptions,
    availableVendorOptions,
  });
  const dataProvider = useDataProvider();

  const { data: budgets = [] } = useQuery<Budget[], Error>({
    queryKey: ["budgets", activeLedger?.id],
    queryFn: async () => {
      if (!activeLedger?.id) return [];
      // Use data provider to fetch budgets. DataProvider returns budgets with category_name usually.
      // But getBudgetsWithSpending might be overkill if we just want basic list?
      // Actually, ReportLayout just wants the list to calculate things maybe.
      // Let's use getBudgetsWithSpending as it is the main getter we implemented.
      const budgets = await dataProvider.getBudgetsWithSpending(
        activeLedger.id,
      );
      return budgets;
    },
    enabled: !!activeLedger,
  });

  const {
    historicalFilteredTransactions,
    futureFilteredTransactions,
    combinedFilteredTransactions,
  } = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // dataProps.filteredTransactions ALREADY contains projected transactions from useTransactionData hook
    // So we just need to split them by date.

    // 1. Historical (<= Today)
    const historical = dataProps.filteredTransactions.filter(
      (t) => new Date(t.date) <= today,
    );

    // 2. Future (Actual + Projected > Today)
    const future = dataProps.filteredTransactions.filter(
      (t) => new Date(t.date) > today,
    );

    // 3. Combined (All)
    // We can just use dataProps.filteredTransactions directly for combined, but ensuring sort
    const combinedAll = [...dataProps.filteredTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return {
      historicalFilteredTransactions: historical,
      futureFilteredTransactions: future,
      combinedFilteredTransactions: combinedAll,
    };
  }, [dataProps.filteredTransactions]);

  const handlePdfExport = async () => {
    try {
      // Loaded on demand: these libraries are large and only needed to export.
      const [
        { default: jsPDF },
        { default: autoTable },
        { default: html2canvas },
      ] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        import("html2canvas-pro"),
      ]);
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // --- Helper: Check Page Break ---
      const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - 10) {
          doc.addPage();
          yPos = 20;
          return true;
        }
        return false;
      };

      // --- 1. Header & Title ---
      doc.setFontSize(18);
      doc.text(title, 14, yPos);
      yPos += 10;

      // --- 2. Filter Summary ---
      doc.setFontSize(10);
      doc.setTextColor(100);

      const dateText =
        filterProps.dateRange?.from && filterProps.dateRange?.to
          ? `${format(filterProps.dateRange.from, "MMM d, yyyy")} - ${format(filterProps.dateRange.to, "MMM d, yyyy")}`
          : "All Dates";

      const accountText =
        filterProps.selectedAccounts.length > 0
          ? `Accounts: ${filterProps.selectedAccounts.map((slug) => accountNameMap.get(slug) || slug).join(", ")}`
          : "All Accounts";

      // Wrap text for accounts if too long
      const splitAccountText = doc.splitTextToSize(accountText, pageWidth - 28);

      doc.text(`Date Range: ${dateText}`, 14, yPos);
      yPos += 5;
      doc.text(splitAccountText, 14, yPos);
      yPos += splitAccountText.length * 5 + 5;

      doc.setDrawColor(200);
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 10;
      doc.setTextColor(0);

      // --- 3. Content Processing ---
      const reportContent = document.getElementById("report-content");
      if (!reportContent) {
        showError("Could not find report content to export.");
        return;
      }

      // We treat direct children of report-content as "Report Sections" (e.g., Cards)
      const sections = Array.from(reportContent.children) as HTMLElement[];

      if (sections.length === 0) {
        showError("No content found to export.");
        return;
      }

      showSuccess("Generating PDF... This may take a moment.");

      for (const section of sections) {
        // Determine strategy: Table (Data) vs Visual (Canvas/Charts/Summary)
        // Heuristic: If it has charts (recharts) OR no tables, capture as image.
        // If it has tables and no charts, use autoTable.

        const hasCharts =
          section.querySelector(".recharts-wrapper") ||
          section.querySelector("canvas");
        const tables = Array.from(section.querySelectorAll("table"));
        const hasTables = tables.length > 0;

        // If it's a visual section (charts) or a summary card without tables
        if (hasCharts || !hasTables) {
          // Capture as Image
          // Temporarily hide scrollbars or overflow if needed, usually html2canvas handles visible parts.
          // We might need to ensure background color is white.

          try {
            const canvas = await html2canvas(section, {
              scale: 2, // Retrolution
              useCORS: true,
              logging: false,
              backgroundColor: "#ffffff", // Ensure white background for dark mode compatibility if needed, or transparent
            });

            const imgData = canvas.toDataURL("image/png");
            const imgWidth = pageWidth - 28; // 14mm margin each side
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            checkPageBreak(imgHeight);

            doc.addImage(imgData, "PNG", 14, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 10;
          } catch (e) {
            console.error("Image capture failed for section", e);
            doc.setFontSize(10);
            doc.setTextColor(255, 0, 0);
            doc.text("[Visual Content Not Captured]", 14, yPos);
            yPos += 10;
            doc.setTextColor(0);
          }
        } else if (hasTables) {
          // Render Title if found (e.g. Card Title)
          const titleEl =
            section.querySelector("h3") ||
            section.querySelector(".card-title") ||
            section.querySelector('div[class*="font-semibold"]'); // approximate selector
          if (titleEl) {
            const titleText = titleEl.textContent?.trim() || "";
            if (titleText) {
              checkPageBreak(15);
              doc.setFontSize(12);
              doc.setFont("helvetica", "bold");
              doc.text(titleText, 14, yPos);
              yPos += 8;
              doc.setFont("helvetica", "normal");
            }
          }

          // Use AutoTable for each table in this section
          for (const table of tables) {
            // Check if table has a specific predecessor title (like "Income" vs "Expenses")
            // heuristic: find closest previous sibling header inside the section?
            // For now, simple autoTable is huge improvement over nothing.

            autoTable(doc, {
              html: table,
              startY: yPos,
              theme: "grid",
              headStyles: { fillColor: "#16a34a" },
              margin: { left: 14, right: 14 },
              styles: { fontSize: 9 },
              didDrawPage: (data) => {
                // Resets yPos after new page
                if (data.cursor) {
                  yPos = data.cursor.y;
                }
              },
            });
            yPos =
              (doc as unknown as { lastAutoTable: { finalY: number } })
                .lastAutoTable.finalY + 10;
          }
        }
      }

      doc.save(`${title.replace(/\s+/g, "_")}_Report.pdf`);
      showSuccess("PDF export completed successfully.");
    } catch (error: unknown) {
      console.error("PDF Export failed:", error);
      showError(`PDF Export failed: ${(error as Error).message}`);
    }
  };

  const handleExcelExport = () =>
    showSuccess("Excel export is not yet implemented.");
  const handleCsvExport = () => {
    if (combinedFilteredTransactions.length === 0) {
      showError("No transactions to export.");
      return;
    }

    const headers = [
      "Date",
      "Account",
      "Vendor",
      "Category",
      "Sub Category",
      "Amount",
      "Currency",
      "Remarks",
    ];

    const csvContent = [
      headers.join(","),
      ...combinedFilteredTransactions.map((t) =>
        [
          format(new Date(t.date), "yyyy-MM-dd"),
          `"${(accountNameMap.get(slugify(t.account)) || t.account).replace(/"/g, '""')}"`,
          `"${t.vendor.replace(/"/g, '""')}"`,
          `"${t.category.replace(/"/g, '""')}"`,
          `"${(t.sub_category || "").replace(/"/g, '""')}"`,
          t.amount,
          t.currency,
          `"${(t.remarks || "").replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const csvString = [BOM + csvContent].join("");
    const ledgerName = activeLedger ? slugify(activeLedger.name) : "report";
    const fileName = `${ledgerName}_${title.replace(/\s+/g, "_")}_Export.csv`;

    saveFile(fileName, csvString, "Vaulted Money Report Export").then(
      (success) => {
        if (success) {
          showSuccess("CSV export completed successfully.");
        }
      },
    );
  };

  return (
    <div className="space-y-6 p-3 sm:p-6 rounded-xl min-h-[calc(100vh-100px)] transition-all duration-500 bg-slate-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="app-page-header flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="app-gradient-title app-page-title">{title}</h2>
          <div className="app-page-subtitle">{description}</div>
        </div>
        {!Capacitor.isNativePlatform() && (
          <div className="tour-report-export">
            <ExportButtons
              onPdfExport={handlePdfExport}
              onExcelExport={handleExcelExport}
              onCsvExport={handleCsvExport}
            />
          </div>
        )}
      </div>

      <div className="tour-report-filters">
        <SearchFilterBar />
      </div>

      <div className="tour-report-content space-y-4" id="report-content">
        {children({
          historicalFilteredTransactions,
          combinedFilteredTransactions,
          futureFilteredTransactions,
          allTransactions,
          accounts: effectiveAccounts,
          budgets,
        })}
      </div>
    </div>
  );
};

export default ReportLayout;
