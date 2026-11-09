import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  type FrankfurterRate,
  frankfurterCurrenciesUrl,
  frankfurterLatestRatesUrl,
} from "@/constants/frankfurter";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardHeader,
  ThemedCardTitle,
  ThemedCardDescription,
} from "@/components/ThemedCard";

export const CurrencyManagement = () => {
  const {
    selectedCurrency,
    exchangeRates,
    updateExchangeRate,
    refreshExchangeRates,
    availableCurrencies,
    currencySymbols,
    addCurrency,
    removeCurrency,
  } = useCurrency();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Custom Currency State
  const [customCode, setCustomCode] = React.useState("");
  const [customName, setCustomName] = React.useState("");
  const [customSymbol, setCustomSymbol] = React.useState("");
  const [customRate, setCustomRate] = React.useState("");
  const [apiCurrencies, setApiCurrencies] = React.useState<
    { code: string; name: string }[]
  >([]);
  const [isComboboxOpen, setIsComboboxOpen] = React.useState(false);

  // Fetch available currencies from jsDelivr API for the dropdown
  React.useEffect(() => {
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
  }, []);

  // Calculate rates relative to selected currency for display
  const selectedCurrencyRateUSD = exchangeRates[selectedCurrency] || 1;

  const handleRateChange = (currencyCode: string, displayRate: number) => {
    // Convert display rate (Relative to Selected) back to USD-relative rate
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
    <div className="space-y-6">
      <ThemedCard>
        <ThemedCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <ThemedCardTitle>Active Currencies</ThemedCardTitle>
              <ThemedCardDescription>
                Manage exchange rates relative to your base currency (
                {selectedCurrency}).
                <span className="block mt-2 max-w-xs text-xs leading-snug text-muted-foreground">
                  Data sourced from{" "}
                  <a
                    href={FRANKFURTER_WEB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary transition-colors"
                  >
                    Frankfurter API
                  </a>
                  <span className="block">(Open source, no API key).</span>
                </span>
              </ThemedCardDescription>
            </div>
            <div className="tour-currency-refresh">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3 w-3" />
                )}
                Refresh Rates
              </Button>
            </div>
          </div>
        </ThemedCardHeader>
        <ThemedCardContent className="space-y-6">
          {/* Top Section: Search/Add */}
          <div className="tour-currency-add space-y-4 border rounded-md p-4 bg-muted/30">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Add New Currency</Label>
              <div className="flex gap-2">
                <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isComboboxOpen}
                      className="justify-between w-full sm:w-[300px]"
                    >
                      {customCode
                        ? `${customCode}${customName ? ` - ${customName}` : ""}`
                        : "Search currency code or name..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search (e.g. USD, BTC)..."
                        value={customCode}
                        onValueChange={(val) => {
                          setCustomCode(val.toUpperCase());
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
                              onClick={() => setIsComboboxOpen(false)}
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
                                value={currency.code}
                                keywords={[currency.name]}
                                onSelect={() => {
                                  const symbol = (() => {
                                    try {
                                      return new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: currency.code,
                                      })
                                        .formatToParts(0)
                                        .find((p) => p.type === "currency")
                                        ?.value;
                                    } catch {
                                      return "";
                                    }
                                  })();

                                  setCustomCode(currency.code);
                                  setCustomName(currency.name);
                                  if (symbol) setCustomSymbol(symbol);
                                  setIsComboboxOpen(false);

                                  // Fetch Rate
                                  // 1 USD = ? NewCurrency
                                  // Fetch Rate
                                  // 1 USD = ? NewCurrency
                                  fetchWithTimeout(
                                    frankfurterLatestRatesUrl("USD"),
                                    {},
                                    5000,
                                  )
                                    .then((res: Response) => {
                                      if (!res.ok)
                                        throw new Error("Failed to fetch rate");
                                      return res.json();
                                    })
                                    .then((data: FrankfurterRate[]) => {
                                      let rateUSDToNew = 1;
                                      if (currency.code !== "USD") {
                                        rateUSDToNew =
                                          data.find(
                                            ({ quote }) =>
                                              quote.toUpperCase() ===
                                              currency.code.toUpperCase(),
                                          )?.rate ?? 0;
                                      }

                                      if (rateUSDToNew) {
                                        // We want: 1 Selected = ? New
                                        // 1 USD = rateUSDToNew New
                                        // 1 USD = exchangeRates[selected] Selected
                                        // => 1 Selected = (1/exchangeRates[selected]) USD
                                        // => 1 Selected = (1/exchangeRates[selected]) * rateUSDToNew New
                                        // => rate = rateUSDToNew / exchangeRates[selected]

                                        const selectedRate =
                                          exchangeRates[selectedCurrency] || 1;
                                        const finalRate =
                                          rateUSDToNew / selectedRate;
                                        setCustomRate(
                                          parseFloat(
                                            finalRate.toFixed(4),
                                          ).toString(),
                                        );
                                      }
                                    })
                                    .catch((e: unknown) => {
                                      console.error(
                                        "Failed to fetch initial rate",
                                        e,
                                      );
                                      showError(
                                        "Failed to fetch rate. Check internet connection.",
                                      );
                                    });
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
                                <span className="text-muted-foreground truncate">
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
            </div>

            {/* Form appears when a code is selected/entered */}
            {customCode && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-top-2 border-t pt-4">
                <div className="md:col-span-4">
                  <Label htmlFor="add-name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="add-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Currency Name"
                    className="h-9"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="add-symbol" className="text-xs">
                    Symbol
                  </Label>
                  <Input
                    id="add-symbol"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    placeholder="Sym"
                    className="h-9 font-sans"
                  />
                </div>
                <div className="md:col-span-4">
                  <Label htmlFor="add-rate" className="text-xs">
                    1 {selectedCurrency} =
                  </Label>
                  <Input
                    id="add-rate"
                    type="number"
                    step="0.0001"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    className="h-9"
                    placeholder="Exchange Rate"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={handleAddCustom} className="w-full h-9">
                    Add Currency
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="tour-currency-list rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
              <div className="col-span-5 md:col-span-6">Currency</div>
              <div className="col-span-5 md:col-span-4 text-right">
                Rate (1 {selectedCurrency} =)
              </div>
              <div className="col-span-2 md:col-span-2 text-center">Action</div>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {availableCurrencies
                .filter((c) => c.code !== selectedCurrency)
                .map((currency) => {
                  const rateUSD = exchangeRates[currency.code] || 1;
                  const rateRelativeToSelected =
                    rateUSD / selectedCurrencyRateUSD;

                  return (
                    <div
                      key={currency.code}
                      className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors"
                    >
                      <div className="col-span-5 md:col-span-6 flex flex-col">
                        <span className="font-semibold text-sm flex items-center gap-2">
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                            {currencySymbols[currency.code]}
                          </span>
                          {currency.code}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {currency.name}
                        </span>
                      </div>

                      <div className="col-span-5 md:col-span-4 flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          className="w-24 text-right h-8 text-sm"
                          value={rateRelativeToSelected.toFixed(4)}
                          step="0.0001"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              handleRateChange(currency.code, val);
                            }
                          }}
                        />
                      </div>

                      <div className="col-span-2 md:col-span-2 flex justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive-text hover:text-destructive-text hover:bg-destructive/10"
                              onClick={() => removeCurrency(currency.code)}
                              aria-label="Remove currency"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove currency</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              {availableCurrencies.length <= 1 && (
                <div className="p-8 text-center text-muted-foreground">
                  No other active currencies. Add one above.
                </div>
              )}
            </div>
            <div className="p-4 bg-muted/20 text-xs text-muted-foreground text-center border-t">
              Base Currency:{" "}
              <span className="font-semibold">{selectedCurrency}</span> (Rate:
              1.00)
            </div>
          </div>
        </ThemedCardContent>
      </ThemedCard>
    </div>
  );
};
