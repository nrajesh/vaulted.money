import { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImportConfig } from "@/utils/csvUtils";
import { useTranslation } from "react-i18next";

interface CSVMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  requiredHeaders: string[];
  onConfirm: (results: Record<string, unknown>[], config: ImportConfig) => void;
  isNewLedger?: boolean;
}

const UNMAPPED_COLUMN_VALUE = "__csv_unmapped_column__";

const CSVMappingDialog = ({
  isOpen,
  onClose,
  file,
  requiredHeaders,
  onConfirm,
  isNewLedger,
}: CSVMappingDialogProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<"config" | "mapping">("config");
  const [config, setConfig] = useState<ImportConfig>({
    delimiter: ",",
    dateFormat: "auto",
    decimalSeparator: ".",
    importMode: "append",
    expenseSign: "negative",
  });

  // Parsed data state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasNegativeValues, setHasNegativeValues] = useState(false);

  const handleParse = useCallback(
    (shouldAdvanceStart: boolean = false) => {
      if (!file) return;
      setIsLoading(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text !== "string") {
          setIsLoading(false);
          return;
        }

        Papa.parse(text, {
          header: true,
          skipEmptyLines: "greedy",
          delimiter: config.delimiter === "auto" ? "" : config.delimiter,
          complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
            const headers: string[] = results.meta.fields || [];
            setCsvHeaders(headers);
            setCsvData(results.data);

            const ALIASES: Record<string, string[]> = {
              Payee: [
                "Vendor",
                "Counterparty",
                "Merchant",
                "Description",
                "Party",
              ],
              Subcategory: ["Sub-Category", "Sub Category", "Sub_Category"],
              Notes: ["Remarks", "Description", "Memo", "Details", "Comment"],
              Account: ["Account Name", "Wallet"],
              Amount: ["Value", "Cost", "Total"],
              Date: ["Txn Date", "Transaction Date", "Day"],
              Currency: ["Curr", "Cur", "Code"],
              "Transfer Account": [
                "To Account",
                "Receiving Account",
                "Destination Account",
              ],
              "Transfer Amount": [
                "To Amount",
                "Receiving Amount",
                "Transfer Value",
              ],
            };

            const newMapping: Record<string, string> = {};

            requiredHeaders.forEach((required) => {
              const lowerRequired = required.toLowerCase();
              const aliases = ALIASES[required] || [];
              const searchTerms = [
                lowerRequired,
                ...aliases.map((a) => a.toLowerCase()),
              ];

              const match = headers.find((header) => {
                const h = header.trim().toLowerCase();
                return searchTerms.includes(h);
              });

              if (match) newMapping[required] = match;
            });
            setMapping(newMapping);

            const amountHeader = newMapping["Amount"];
            if (amountHeader) {
              const sampleValues = results.data
                .slice(0, 5)
                .map((row: Record<string, unknown>) =>
                  String(row[amountHeader] || ""),
                )
                .filter(Boolean) as string[];
              const hasComma = sampleValues.some(
                (val: string) => val.includes(",") && !val.includes("."),
              );
              const hasCommaDecimal = sampleValues.some(
                (val: string) =>
                  /^\d+,\d{2}$/.test(val.replace(/[^\d,]/g, "")) ||
                  /-\d+,\d{2}$/.test(val.replace(/[^\d,-]/g, "")),
              );

              if (hasComma || hasCommaDecimal) {
                setConfig((prev) => ({ ...prev, decimalSeparator: "," }));
              }

              const hasNegative = sampleValues.some((val: string) => {
                const normalized = val.replace(/[\u2013\u2014\u2212]/g, "-");
                return normalized.includes("-") || normalized.includes("(");
              });
              if (hasNegative) {
                setConfig((prev) => ({ ...prev, expenseSign: "negative" }));
              }
              setHasNegativeValues(hasNegative);
            }

            if (shouldAdvanceStart) {
              setStep("mapping");
            }
            setIsLoading(false);
          },
          error: (error: unknown) => {
            console.error("CSV Parse Error", error);
            setIsLoading(false);
          },
        });
      };

      reader.onerror = () => {
        console.error("File reading failed");
        setIsLoading(false);
      };

      reader.readAsText(file);
    },
    [file, config.delimiter, requiredHeaders],
  );

  // Auto-refresh preview when delimiter changes
  useEffect(() => {
    if (file) {
      // Defer execution to avoid synchronous setState in effect warning
      const timer = setTimeout(() => {
        handleParse(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [config.delimiter, file, handleParse]);

  const handleMappingChange = (required: string, value: string) => {
    setMapping((prev) => {
      if (value === UNMAPPED_COLUMN_VALUE) {
        const next = { ...prev };
        delete next[required];
        return next;
      }

      return {
        ...prev,
        [required]: value,
      };
    });
  };

  const handleConfirm = () => {
    const mappedData = csvData.map((row) => {
      const newRow: Record<string, unknown> = { ...row };
      Object.entries(mapping).forEach(([requiredHeader, csvHeader]) => {
        if (csvHeader) {
          newRow[requiredHeader] = row[csvHeader];
        }
      });
      return newRow;
    });

    onConfirm(mappedData, config);
    onClose();
  };

  const previewRows = csvData.slice(0, 3);

  // Only the label is translated: matching still uses the English field names.
  const fieldLabel = (header: string) =>
    t(`csvImport.fields.${header.replace(/\s+/g, "")}`, {
      defaultValue: header,
    });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="grid w-[calc(100%-1rem)] max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b px-4 pb-3 pt-4 sm:px-6">
          <DialogTitle>
            {step === "config"
              ? t("csvImport.title.config", { defaultValue: "Import Settings" })
              : t("csvImport.title.mapping", { defaultValue: "Map Columns" })}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {step === "config"
              ? t("csvImport.subtitle.config", {
                  defaultValue:
                    "Choose how the CSV should be read before importing it.",
                })
              : t("csvImport.subtitle.mapping", {
                  defaultValue:
                    "Match each Vaulted Money field to the correct CSV column.",
                })}
          </p>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
          {step === "config" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>
                    {t("csvImport.delimiter.label", {
                      defaultValue: "CSV Delimiter",
                    })}
                  </Label>
                  <Select
                    value={config.delimiter}
                    onValueChange={(val) =>
                      setConfig((prev) => ({ ...prev, delimiter: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">
                        {t("csvImport.delimiter.comma", {
                          defaultValue: "Comma (,)",
                        })}
                      </SelectItem>
                      <SelectItem value=";">
                        {t("csvImport.delimiter.semicolon", {
                          defaultValue: "Semicolon (;)",
                        })}
                      </SelectItem>
                      <SelectItem value="\t">
                        {t("csvImport.delimiter.tab", {
                          defaultValue: "Tab (\\t)",
                        })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label>
                    {t("csvImport.date.label", {
                      defaultValue: "Date Format (in CSV)",
                    })}
                  </Label>
                  <Select
                    value={config.dateFormat}
                    onValueChange={(val) =>
                      setConfig((prev) => ({ ...prev, dateFormat: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        {t("csvImport.date.auto", {
                          defaultValue: "Auto-detect",
                        })}
                      </SelectItem>
                      <SelectItem value="d/M/yyyy">
                        {t("csvImport.date.dmy", {
                          defaultValue: "Day/Month/Year (e.g. 31/01/2024)",
                        })}
                      </SelectItem>
                      <SelectItem value="M/d/yyyy">
                        {t("csvImport.date.mdy", {
                          defaultValue: "Month/Day/Year (e.g. 01/31/2024)",
                        })}
                      </SelectItem>
                      <SelectItem value="yyyy-MM-dd">
                        {t("csvImport.date.ymd", {
                          defaultValue: "Year-Month-Day (e.g. 2024-01-31)",
                        })}
                      </SelectItem>
                      <SelectItem value="d.M.yyyy">
                        {t("csvImport.date.dotted", {
                          defaultValue: "Day.Month.Year (e.g. 31.01.2024)",
                        })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>
                    {t("csvImport.decimal.label", {
                      defaultValue: "Decimal Format",
                    })}
                  </Label>
                  <Select
                    value={config.decimalSeparator}
                    onValueChange={(val) =>
                      setConfig((prev) => ({
                        ...prev,
                        decimalSeparator: val as "." | ",",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=".">
                        {t("csvImport.decimal.dot", {
                          defaultValue: "1,234.56 (Dot decimal)",
                        })}
                      </SelectItem>
                      <SelectItem value=",">
                        {t("csvImport.decimal.comma", {
                          defaultValue: "1.234,56 (Comma decimal)",
                        })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>
                    {t("csvImport.sign.label", {
                      defaultValue: "Amount Sign Convention",
                    })}
                  </Label>
                  <Select
                    value={config.expenseSign}
                    onValueChange={(val) =>
                      setConfig((prev) => ({
                        ...prev,
                        expenseSign: val as "negative" | "positive",
                      }))
                    }
                    disabled={hasNegativeValues}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="negative">
                        {t("csvImport.sign.negative", {
                          defaultValue: "Negative is Expense (-100)",
                        })}
                      </SelectItem>
                      <SelectItem value="positive">
                        {t("csvImport.sign.positive", {
                          defaultValue: "Positive is Expense (100)",
                        })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {hasNegativeValues
                      ? t("csvImport.sign.enforced", {
                          defaultValue:
                            "Negative values detected in CSV. 'Negative is Expense' setting enforced.",
                        })
                      : config.expenseSign === "positive"
                        ? t("csvImport.sign.positiveHint", {
                            defaultValue:
                              "Expenses entered as positive numbers",
                          })
                        : t("csvImport.sign.negativeHint", {
                            defaultValue:
                              "Expenses entered as negative numbers",
                          })}
                  </p>
                </div>
              </div>

              {!isNewLedger && (
                <div className="grid gap-2">
                  <Label>
                    {t("csvImport.mode.label", { defaultValue: "Import Mode" })}
                  </Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-xl border border-border/70 px-3 py-3 transition-colors hover:border-primary/40">
                      <input
                        type="radio"
                        id="append"
                        name="importMode"
                        value="append"
                        checked={config.importMode !== "replace"}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            importMode: "append",
                          }))
                        }
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="space-y-1">
                        <span className="block font-medium text-foreground">
                          {t("csvImport.mode.append", {
                            defaultValue: "Append to existing",
                          })}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {t("csvImport.mode.appendHint", {
                            defaultValue:
                              "Keep current transactions and add the new rows.",
                          })}
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-border/70 px-3 py-3 transition-colors hover:border-primary/40">
                      <input
                        type="radio"
                        id="replace"
                        name="importMode"
                        value="replace"
                        checked={config.importMode === "replace"}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            importMode: "replace",
                          }))
                        }
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="space-y-1">
                        <span className="block font-medium text-foreground">
                          {t("csvImport.mode.replace", {
                            defaultValue: "Replace existing",
                          })}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {t("csvImport.mode.replaceHint", {
                            defaultValue:
                              "Clear the destination before importing the CSV.",
                          })}
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="border rounded-md p-3 bg-muted/30 mt-4">
                <Label className="mb-2 block">
                  {t("csvImport.preview.title", {
                    defaultValue: "Available Data Preview (First 3 rows)",
                  })}
                </Label>
                {previewRows.length > 0 ? (
                  <>
                    <div className="space-y-3 md:hidden">
                      {previewRows.map((row, rowIndex) => (
                        <div
                          key={rowIndex}
                          className="rounded-xl border bg-background/80 p-3"
                        >
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {t("csvImport.preview.row", {
                              number: rowIndex + 1,
                              defaultValue: "Row {{number}}",
                            })}
                          </p>
                          <div className="space-y-2">
                            {csvHeaders.map((header) => (
                              <div
                                key={`${rowIndex}-${header}`}
                                className="grid gap-1"
                              >
                                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                  {header}
                                </span>
                                <span className="break-words text-sm text-foreground">
                                  {String(row[header] ?? "") || "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="text-xs w-full text-left">
                        <thead>
                          <tr className="border-b">
                            {csvHeaders.map((h) => (
                              <th key={h} className="p-1 font-medium">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, i) => (
                            <tr key={i} className="border-b last:border-0">
                              {csvHeaders.map((h) => (
                                <td key={h} className="p-1 whitespace-nowrap">
                                  {String(row[h] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground p-2 text-center">
                    {isLoading
                      ? t("csvImport.preview.reading", {
                          defaultValue: "Reading...",
                        })
                      : t("csvImport.preview.empty", {
                          defaultValue: "No data properly parsed.",
                        })}
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleParse(false)}
                      >
                        {t("csvImport.preview.refresh", {
                          defaultValue: "Refresh Preview",
                        })}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "mapping" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("csvImport.mapping.intro", {
                  defaultValue:
                    "Map the columns from your CSV to the system fields.",
                })}
              </p>
              <div className="grid gap-4">
                {requiredHeaders.map((header) => (
                  <div
                    key={header}
                    className="rounded-xl border border-border/70 bg-background/70 p-3 sm:grid sm:grid-cols-[minmax(0,10rem)_1fr] sm:items-center sm:gap-4"
                  >
                    <Label className="mb-2 sm:mb-0">{fieldLabel(header)}</Label>
                    <div>
                      <Select
                        value={mapping[header] || UNMAPPED_COLUMN_VALUE}
                        onValueChange={(value) =>
                          handleMappingChange(header, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("csvImport.mapping.selectColumn", {
                              defaultValue: "Select column",
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNMAPPED_COLUMN_VALUE}>
                            {t("csvImport.mapping.noColumn", {
                              defaultValue: "No column",
                            })}
                          </SelectItem>
                          <SelectSeparator />
                          {csvHeaders.map((csvHeader) => (
                            <SelectItem key={csvHeader} value={csvHeader}>
                              {csvHeader}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
          {step === "config" ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                {t("csvImport.actions.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                onClick={() => handleParse(true)}
                disabled={!file || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading
                  ? t("csvImport.preview.reading", {
                      defaultValue: "Reading...",
                    })
                  : t("csvImport.actions.next", { defaultValue: "Next" })}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                {t("csvImport.actions.cancel", { defaultValue: "Cancel" })}
              </Button>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setStep("config")}
                  className="w-full sm:w-auto"
                >
                  {t("csvImport.actions.back", { defaultValue: "Back" })}
                </Button>
                <Button onClick={handleConfirm} className="w-full sm:w-auto">
                  {t("csvImport.actions.import", {
                    defaultValue: "Import Transactions",
                  })}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVMappingDialog;
