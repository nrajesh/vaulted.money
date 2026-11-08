import * as React from "react";
import {
  Search,
  Sparkles,
  CreditCard,
  Tag,
  Store,
  Calendar,
  Banknote,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ParsedFilterState,
  parseSearchQuery,
  isOpenRangeStart,
} from "@/utils/searchParser";
import {
  buildInterpretation,
  type InterpretationPart,
} from "@/utils/searchInterpretation";
import { formatDisplayDate } from "@/utils/dateFormat";
import { useTranslation } from "react-i18next";

interface ConversationalSearchInputProps {
  onUpdate: (update: Partial<ParsedFilterState>) => void;
  categories: { name: string; slug: string }[];
  subCategories?: { name: string; slug: string }[];
  accounts: { name: string; slug: string; type?: string }[];
  vendors: { name: string; slug: string }[];
  currentFilters?: ParsedFilterState;
  className?: string;
}

type SearchStep = "ROOT" | "CATEGORY" | "ACCOUNT" | "VENDOR" | "DATE";

export function ConversationalSearchInput({
  onUpdate,
  categories,
  subCategories = [],
  accounts,
  vendors,
  className,
}: ConversationalSearchInputProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<SearchStep>("ROOT");
  const [input, setInput] = React.useState("");

  // Reset to root when closing
  React.useEffect(() => {
    if (!open) {
      setStep("ROOT");
      setInput("");
    }
  }, [open]);

  // What the parser makes of the text, offered as one suggestion the user can
  // pick (or ignore). Typo matching is on here because the user confirms the
  // result; nothing is applied until they choose it.
  const interpretation = React.useMemo(() => {
    if (step !== "ROOT" || input.trim().length <= 2) return null;
    const parsed = parseSearchQuery(
      input,
      { categories, subCategories, accounts, vendors },
      { fuzzy: true },
    );
    return buildInterpretation(parsed, {
      categories,
      subCategories,
      accounts,
      vendors,
    });
  }, [step, input, categories, subCategories, accounts, vendors]);

  const handleSelectType = (nextStep: SearchStep) => {
    setStep(nextStep);
    setInput(""); // Clear input for the section
  };

  const handleBack = () => {
    setStep("ROOT");
    setInput("");
  };

  const handleSelectCategory = (slug: string) => {
    onUpdate({ selectedCategories: [slug] });
    setOpen(false);
  };

  const handleSelectAccount = (slug: string) => {
    onUpdate({ selectedAccounts: [slug] });
    setOpen(false);
  };

  const handleSelectVendor = (slug: string) => {
    onUpdate({ selectedVendors: [slug] });
    setOpen(false);
  };

  const handleGenericSearch = (val?: string) => {
    const query = val || input;
    if (query.trim()) {
      onUpdate({ searchTerm: query });
      setOpen(false);
    }
  };

  // Filter Lists based on Input (fuse-like behavior done by Command automatically if we render all,
  // but optimizing for "ROOT" step showing suggestions)

  const formatAmount = (value: number) =>
    new Intl.NumberFormat(i18n.language).format(value);

  const describePart = (part: InterpretationPart): string => {
    switch (part.kind) {
      case "allTime":
        return t("filters.conversational.suggest.allTime", {
          defaultValue: "All time",
        });
      case "date": {
        // "before 2019" has no real start date; say "until" instead.
        if (isOpenRangeStart(part.from) && part.to) {
          return t("filters.conversational.suggest.dateUntil", {
            date: formatDisplayDate(part.to, i18n.language),
            defaultValue: "Date: until {{date}}",
          });
        }
        return t("filters.conversational.suggest.date", {
          from: formatDisplayDate(part.from, i18n.language),
          to: formatDisplayDate(part.to ?? part.from, i18n.language),
          defaultValue: "Date: {{from}} – {{to}}",
        });
      }
      case "amount":
        if (part.min !== undefined && part.min === part.max) {
          return t("filters.conversational.suggest.amountExact", {
            amount: formatAmount(part.min),
            defaultValue: "Amount: {{amount}}",
          });
        }
        if (part.min !== undefined && part.max !== undefined) {
          return t("filters.conversational.suggest.amountBetween", {
            min: formatAmount(part.min),
            max: formatAmount(part.max),
            defaultValue: "Amount: {{min}} to {{max}}",
          });
        }
        if (part.min !== undefined) {
          return t("filters.conversational.suggest.amountOver", {
            amount: formatAmount(part.min),
            defaultValue: "Over {{amount}}",
          });
        }
        return t("filters.conversational.suggest.amountUnder", {
          amount: formatAmount(part.max!),
          defaultValue: "Under {{amount}}",
        });
      case "type":
        return part.type === "income"
          ? t("filters.conversational.suggest.income", {
              defaultValue: "Income",
            })
          : t("filters.conversational.suggest.expenses", {
              defaultValue: "Expenses",
            });
      case "limit":
        return part.order === "smallest"
          ? t("filters.conversational.suggest.smallest", {
              count: part.count,
              defaultValue: "Smallest {{count}}",
            })
          : t("filters.conversational.suggest.largest", {
              count: part.count,
              defaultValue: "Largest {{count}}",
            });
      case "accounts":
        return t("filters.conversational.suggest.accountsCount", {
          count: part.count,
          defaultValue: "{{count}} accounts",
        });
      case "entity": {
        const name = part.typed
          ? t("filters.conversational.suggest.typo", {
              name: part.name,
              typed: part.typed,
              defaultValue: "{{name}} (matched “{{typed}}”)",
            })
          : part.name;
        switch (part.entity) {
          case "account":
            return t("filters.conversational.suggest.account", {
              name,
              defaultValue: "Account: {{name}}",
            });
          case "category":
            return t("filters.conversational.suggest.category", {
              name,
              defaultValue: "Category: {{name}}",
            });
          case "subCategory":
            return t("filters.conversational.suggest.subCategory", {
              name,
              defaultValue: "Sub-category: {{name}}",
            });
          default:
            return t("filters.conversational.suggest.vendor", {
              name,
              defaultValue: "Vendor: {{name}}",
            });
        }
      }
      case "text":
        return t("filters.conversational.suggest.text", {
          text: part.text,
          defaultValue: 'Text: "{{text}}"',
        });
    }
  };

  // A suggestion that relies on a typo correction goes last, so Enter keeps
  // doing the plain search; exact interpretations are selected first.
  const suggestionLast =
    interpretation?.parts.some((p) => p.kind === "entity" && p.typed) ?? false;

  const partIcon = (part: InterpretationPart) => {
    const className = "mr-2 h-4 w-4 shrink-0 text-primary";
    switch (part.kind) {
      case "date":
      case "allTime":
        return <Calendar className={className} />;
      case "amount":
        return <Banknote className={className} />;
      case "type":
        return part.type === "income" ? (
          <TrendingUp className={className} />
        ) : (
          <TrendingDown className={className} />
        );
      case "limit":
        return <ArrowUpDown className={className} />;
      case "accounts":
        return <Layers className={className} />;
      case "text":
        return <Search className={className} />;
      case "entity":
        if (part.entity === "account")
          return <CreditCard className={className} />;
        if (part.entity === "vendor") return <Store className={className} />;
        return <Tag className={className} />;
    }
  };

  const acceptSuggestion = (update: Partial<ParsedFilterState>) => {
    onUpdate(update);
    setOpen(false);
  };

  // Every understood piece is its own row, so the user can take just one of
  // them; with several, "apply all" comes first and is the default.
  const suggestionGroup = interpretation && (
    <CommandGroup
      forceMount
      heading={t("filters.conversational.suggest.heading", {
        defaultValue: "Understood as",
      })}
    >
      {interpretation.items.length > 1 && (
        <CommandItem
          forceMount
          value={"suggest-all-" + input}
          onSelect={() => acceptSuggestion(interpretation.update)}
        >
          <Sparkles className="mr-2 h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium">
            {t("filters.conversational.suggest.applyAll", {
              count: interpretation.items.length,
              defaultValue: "Apply all {{count}}",
            })}
          </span>
        </CommandItem>
      )}
      {interpretation.items.map((item, index) => (
        <CommandItem
          key={index}
          forceMount
          value={`suggest-${index}-${input}`}
          onSelect={() => acceptSuggestion(item.update)}
        >
          {partIcon(item.part)}
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm">
            {describePart(item.part)}
          </span>
        </CommandItem>
      ))}
    </CommandGroup>
  );

  const renderRootSuggestions = () => {
    // If input is empty, show types
    if (!input.trim()) {
      return (
        <CommandGroup
          heading={t("filters.conversational.filterType", {
            defaultValue: "Filter Type",
          })}
        >
          <CommandItem
            value="category"
            onSelect={() => handleSelectType("CATEGORY")}
          >
            <Tag className="mr-2 h-4 w-4" />
            {t("filters.conversational.category", { defaultValue: "Category" })}
          </CommandItem>
          <CommandItem
            value="account"
            onSelect={() => handleSelectType("ACCOUNT")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {t("filters.conversational.account", { defaultValue: "Account" })}
          </CommandItem>
          <CommandItem
            value="vendor"
            onSelect={() => handleSelectType("VENDOR")}
          >
            <Store className="mr-2 h-4 w-4" />
            {t("filters.conversational.vendor", {
              defaultValue: "Vendor / Payee",
            })}
          </CommandItem>
        </CommandGroup>
      );
    }

    // If input exists, show NLP results + Entity Matches
    return (
      <>
        {!suggestionLast && suggestionGroup}

        {/* Show top entity matches mixed in, or grouped? Command filters for us if we render them. 
                    Lets render a subset of everything if input length > 1 */}

        <CommandGroup
          heading={t("filters.conversational.categories", {
            defaultValue: "Categories",
          })}
        >
          {categories.map((c) => (
            <CommandItem
              key={c.slug}
              value={c.name}
              onSelect={() => handleSelectCategory(c.slug)}
            >
              <Tag className="mr-2 h-4 w-4 opacity-50" />
              {c.name}
            </CommandItem>
          ))}
          {subCategories.map((s) => (
            <CommandItem
              key={"sub-" + s.slug}
              value={s.name}
              onSelect={() => onUpdate({ selectedSubCategories: [s.slug] })}
            >
              <Tag className="mr-2 h-4 w-4 opacity-50" />
              {`${s.name} ${t("filters.conversational.subCategorySuffix", {
                defaultValue: "(Sub)",
              })}`}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup
          heading={t("filters.conversational.accounts", {
            defaultValue: "Accounts",
          })}
        >
          {accounts.map((a) => (
            <CommandItem
              key={a.slug}
              value={a.name}
              onSelect={() => handleSelectAccount(a.slug)}
            >
              <CreditCard className="mr-2 h-4 w-4 opacity-50" />
              {a.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup
          heading={t("filters.conversational.vendors", {
            defaultValue: "Vendors",
          })}
        >
          {/* Render all vendors for local filtering */}
          {vendors.map((v) => (
            <CommandItem
              key={v.slug}
              value={v.name}
              onSelect={() => handleSelectVendor(v.slug)}
            >
              <Store className="mr-2 h-4 w-4 opacity-50" />
              {v.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup
          heading={t("filters.conversational.search", {
            defaultValue: "Search",
          })}
        >
          <CommandItem
            value={"search-" + input}
            onSelect={() => handleGenericSearch()}
          >
            <Search className="mr-2 h-4 w-4" />
            {t("filters.conversational.searchText", {
              input,
              defaultValue: `Search Text "${input}"`,
            })}
          </CommandItem>
        </CommandGroup>

        {suggestionLast && suggestionGroup}
      </>
    );
  };

  const renderStepContent = () => {
    // Keep explicit browsing logic if user Selected "Category" specifically
    if (step === "CATEGORY") {
      return (
        <CommandGroup
          heading={t("filters.conversational.allCategories", {
            defaultValue: "All Categories",
          })}
        >
          <CommandItem
            value="back"
            onSelect={handleBack}
            className="text-muted-foreground font-medium"
          >
            ← {t("filters.conversational.back", { defaultValue: "Back" })}
          </CommandItem>
          {categories.map((c) => (
            <CommandItem
              key={c.slug}
              value={c.name}
              onSelect={() => handleSelectCategory(c.slug)}
            >
              {c.name}
            </CommandItem>
          ))}
        </CommandGroup>
      );
    }
    if (step === "ACCOUNT") {
      return (
        <CommandGroup
          heading={t("filters.conversational.allAccounts", {
            defaultValue: "All Accounts",
          })}
        >
          <CommandItem
            value="back"
            onSelect={handleBack}
            className="text-muted-foreground font-medium"
          >
            ← {t("filters.conversational.back", { defaultValue: "Back" })}
          </CommandItem>
          {accounts.map((a) => (
            <CommandItem
              key={a.slug}
              value={a.name}
              onSelect={() => handleSelectAccount(a.slug)}
            >
              {a.name}
            </CommandItem>
          ))}
        </CommandGroup>
      );
    }
    if (step === "VENDOR") {
      return (
        <CommandGroup
          heading={t("filters.conversational.allVendors", {
            defaultValue: "All Vendors",
          })}
        >
          <CommandItem
            value="back"
            onSelect={handleBack}
            className="text-muted-foreground font-medium"
          >
            ← {t("filters.conversational.back", { defaultValue: "Back" })}
          </CommandItem>
          {vendors.map((v) => (
            <CommandItem
              key={v.slug}
              value={v.name}
              onSelect={() => handleSelectVendor(v.slug)}
            >
              {v.name}
            </CommandItem>
          ))}
        </CommandGroup>
      );
    }
    return renderRootSuggestions();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11 text-base text-muted-foreground bg-white/80 dark:bg-background/50 backdrop-blur-md font-normal",
            className,
          )}
        >
          {step === "ROOT"
            ? t("filters.searchBar.placeholder", {
                defaultValue: "Filter transactions...",
              })
            : t("filters.conversational.filterBy", {
                step: t(`filters.conversational.${step.toLowerCase()}`, {
                  defaultValue: step.toLowerCase(),
                }).toLowerCase(),
                defaultValue: `Filter by ${step.toLowerCase()}...`,
              })}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={true}>
          <CommandInput
            placeholder={t("filters.conversational.typePlaceholder", {
              defaultValue:
                "Type to filter (e.g. 'Groceries', 'Next Week', 'Checking')...",
            })}
            onValueChange={setInput}
            value={input}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !input && step !== "ROOT")
                handleBack();
            }}
          />
          <CommandList>
            <CommandEmpty>
              <div
                className="flex flex-col items-center gap-2 p-2"
                onClick={() => handleGenericSearch()}
              >
                <span className="text-muted-foreground">
                  {t("filters.conversational.searchText", {
                    input,
                    defaultValue: `Search Text "${input}"`,
                  })}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleGenericSearch()}
                >
                  {t("filters.conversational.search", {
                    defaultValue: "Search",
                  })}
                </Button>
              </div>
            </CommandEmpty>
            {renderStepContent()}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
