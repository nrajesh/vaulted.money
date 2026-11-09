import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { fetchWithTimeout } from "@/utils/apiUtils";
import {
  FRANKFURTER_WEB_URL,
  type FrankfurterCurrency,
  frankfurterCurrenciesUrl,
} from "@/constants/frankfurter";

interface CurrencyConversionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const CurrencyConversionDialog: React.FC<
  CurrencyConversionDialogProps
> = ({ isOpen, onOpenChange }) => {
  const {
    selectedCurrency,
    exchangeRates,
    updateExchangeRate,
    refreshExchangeRates,
    availableCurrencies, // Now unified
    currencySymbols,
    addCurrency,
    removeCurrency,
  } = useCurrency();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Custom Currency State
  // Custom Currency State
  const [customCode, setCustomCode] = React.useState("");
  const [customName, setCustomName] = React.useState("");
  const [customSymbol, setCustomSymbol] = React.useState("");
  const [customRate, setCustomRate] = React.useState("");
  const [apiCurrencies, setApiCurrencies] = React.useState<
    { code: string; name: string }[]
  >([]);
  const [isComboboxOpen, setIsComboboxOpen] = React.useState(false);

  // Fetch available currencies from Frankfurter API for the dropdown
  React.useEffect(() => {
    if (isOpen) {
      fetchWithTimeout(frankfurterCurrenciesUrl, {}, 5000)
        .then((res: Response) => {
          if (!res.ok) throw new Error("Failed to fetch currencies");
          return res.json();
        })
        .then((data: FrankfurterCurrency[]) => {
          const formatted = data
            .filter((currency) => currency.iso_code.trim() !== "")
            .map((currency) => ({
              code: currency.iso_code.toUpperCase(),
              name: currency.name,
            }));
          setApiCurrencies(formatted);
        })
        .catch((err: unknown) => {
          console.error("Failed to fetch currencies:", err);
          showError(
            "Failed to load currency list. Check your internet connection.",
          );
        });
    }
  }, [isOpen]);

  // Calculate rates relative to selected currency for display
  const selectedCurrencyRateUSD = exchangeRates[selectedCurrency] || 1;

  const handleRateChange = (currencyCode: string, displayRate: number) => {
    // Convert display rate (Relative to Selected) back to USD-relative rate
    // Display = USD_Target / USD_Selected
    // USD_Target = Display * USD_Selected
    const newRateUSD = displayRate * selectedCurrencyRateUSD;
    updateExchangeRate(currencyCode, newRateUSD);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshExchangeRates();
      showSuccess("Exchange rates updated successfully.");
    } catch {
      showError(
        "Failed to update exchange rates. Please check your internet connection.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddCustom = () => {
    if (!customCode || !customRate) {
      showError("Please fill in code and rate");
      return;
    }
    const rate = parseFloat(customRate);
    if (isNaN(rate)) {
      showError("Invalid rate");
      return;
    }

    const selectedCurrencyRateUSD = exchangeRates[selectedCurrency] || 1;
    const initialRateUSD = selectedCurrencyRateUSD * rate;

    addCurrency(
      customCode.toUpperCase(),
      customName,
      customSymbol,
      initialRateUSD,
    );

    setCustomCode("");
    setCustomName("");
    setCustomSymbol("");
    setCustomRate("");
    showSuccess(`${customCode} added`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Currency Conversion</DialogTitle>
          </div>
          <DialogDescription>
            Manage exchange rates relative to your base currency (
            {selectedCurrency}).
            <span className="mt-2 block max-w-xs text-xs leading-snug text-muted-foreground">
              Rates sourced from{" "}
              <a
                href={FRANKFURTER_WEB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-foreground"
              >
                Frankfurter API
              </a>
              <span className="block">Open source, no API key involved.</span>
              <span className="block">
                Cryptocurrencies are checked manually.
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Top Section: Search/Add */}
          <div className="space-y-4 border rounded-md p-4 bg-muted/30">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Add Currency</Label>
              <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isComboboxOpen}
                    className="justify-between w-full"
                  >
                    {customCode
                      ? `${customCode}${customName ? ` - ${customName}` : ""}`
                      : "Search currency code or name..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[480px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search currency (e.g. USD, BTC)..."
                      value={customCode}
                      onValueChange={(val) => {
                        setCustomCode(val.toUpperCase());
                        // If typing something new, reset name unless matched
                        const match = apiCurrencies.find(
                          (c) => c.code === val.toUpperCase(),
                        );
                        if (match) {
                          setCustomName(match.name);
                        } else {
                          setCustomName("");
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-xs leading-tight text-center text-muted-foreground">
                          No API match found.
                        </div>
                        <div className="p-2 border-t">
                          <Button
                            variant="secondary"
                            className="w-full justify-start"
                            onClick={() => {
                              // Custom creation
                              setIsComboboxOpen(false);
                              // Ensure code is set (it might be empty if they just clicked without typing? No, value is controlled)
                              // Wait, CommandInput value is internal to Command usually unless controlled?
                              // I'm controlling it partially via customCode but CommandInput might be tricky.
                              // Actually, let's just use the `search` prop from CommandState if needed,
                              // but here we can just assume `customCode` captured the input?
                              // No, CommandInput `value` prop is filter value.
                              // Let's rely on the user having typed something.
                              // If `customCode` has value, use it.
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            create custom "{customCode}"
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup heading="Available via API">
                        {apiCurrencies
                          .filter(
                            (c) =>
                              !availableCurrencies.some(
                                (ac) => ac.code === c.code,
                              ),
                          )
                          .slice(0, 50)
                          .map((currency) => (
                            <CommandItem
                              key={currency.code}
                              value={currency.code} // Search by code
                              keywords={[currency.name]} // Search by name
                              onSelect={() => {
                                setCustomCode(currency.code);
                                setCustomName(currency.name);
                                setIsComboboxOpen(false);
                                // Optionally focus the rate input next
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  customCode === currency.code
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span className="font-mono w-12">
                                {currency.code}
                              </span>
                              <span className="text-muted-foreground">
                                {currency.name}
                              </span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Form appears when a code is selected/entered */}
            {customCode && (
              <div className="grid grid-cols-12 gap-2 items-end animate-in fade-in slide-in-from-top-2">
                <div className="col-span-4">
                  <Label htmlFor="add-name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="add-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Currency Name"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="add-symbol" className="text-xs">
                    Symbol
                  </Label>
                  <Input
                    id="add-symbol"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    placeholder="Sym"
                    className="h-8 text-sm font-sans"
                  />
                </div>
                <div className="col-span-4">
                  <Label htmlFor="add-rate" className="text-xs">
                    1 {selectedCurrency} =
                  </Label>
                  <Input
                    id="add-rate"
                    type="number"
                    step="0.0001"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Button
                    size="sm"
                    onClick={handleAddCustom}
                    className="w-full h-8"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <div className="text-sm font-medium">
              Base: {selectedCurrency} (1.00)
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8"
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3 w-3" />
              )}
              Refresh Rates
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] pr-2">
            <div className="space-y-2">
              {availableCurrencies
                .filter((c) => c.code !== selectedCurrency)
                .map((currency) => {
                  const rateUSD = exchangeRates[currency.code] || 1;
                  const rateRelativeToSelected =
                    rateUSD / selectedCurrencyRateUSD;

                  return (
                    <div
                      key={currency.code}
                      className="flex items-center justify-between gap-3 p-2 rounded-md border bg-card/50 hover:bg-card transition-colors"
                    >
                      <div className="flex flex-col min-w-[100px]">
                        <span className="font-semibold text-sm flex items-center gap-2">
                          <span>{currencySymbols[currency.code]}</span>
                          {currency.code}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                          {currency.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          1 {selectedCurrency} =
                        </span>
                        <Input
                          type="number"
                          className="w-20 text-right h-8 text-sm"
                          value={rateRelativeToSelected.toFixed(4)}
                          step="0.0001"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              handleRateChange(currency.code, val);
                            }
                          }}
                        />
                        <span className="text-sm font-medium w-6 text-center">
                          {currencySymbols[currency.code]}
                        </span>

                        {currency.code !== selectedCurrency ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive-text hover:text-destructive-text hover:bg-destructive/10"
                            onClick={() => removeCurrency(currency.code)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="w-8" /> // Spacer
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
