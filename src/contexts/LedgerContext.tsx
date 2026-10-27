import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { Ledger } from "@/types/dataProvider";
import { useDataProvider } from "@/context/DataProviderContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { navigateAppPath } from "@/utils/navigation";

interface LedgerContextType {
  activeLedger: Ledger | null;
  ledgers: Ledger[];
  isLoading: boolean;
  switchLedger: (ledgerId: string, directLedger?: Ledger) => Promise<void>;
  logout: () => void;
  createLedger: (
    name: string,
    currency: string,
    icon?: string,
    shortName?: string,
    startFromScratch?: boolean,
  ) => Promise<void>;
  updateLedgerDetails: (
    ledgerId: string,
    updates: Partial<Ledger>,
  ) => Promise<void>;
  deleteLedger: (ledgerId: string) => Promise<void>;
  refreshLedgers: () => Promise<Ledger[]>;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export const LedgerProvider = ({ children }: { children: ReactNode }) => {
  const dataProvider = useDataProvider();
  const { setCurrency } = useCurrency();
  const [activeLedger, setActiveLedger] = useState<Ledger | null>(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLoggingOutRef = useRef(false);

  const refreshLedgers = useCallback(async () => {
    // We use dataProvider directly or db? dataProvider has getLedgers
    // But dataProvider interface might not be updated in the context wrapper yet?
    // Casting for now if TS complains, or assume it works since we updated LocalDataProvider
    // and strict typing might need interface update in DataProviderContext too maybe?
    // Let's assume usage of dataProvider as `any` or cast
    const displayLedgers = await dataProvider.getLedgers();
    setLedgers(displayLedgers);
    return displayLedgers;
  }, [dataProvider]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const allLedgers = await refreshLedgers();

      // Check LocalStorage for last active
      const storedLedgerId = localStorage.getItem("activeLedgerId");

      let ledgerToUse = null;

      if (storedLedgerId) {
        ledgerToUse = allLedgers.find((l: Ledger) => l.id === storedLedgerId);
      }

      if (!ledgerToUse && allLedgers.length > 0) {
        const isLoggedOut = localStorage.getItem("userLoggedOut");
        if (!isLoggedOut) {
          // Default to most recently accessed only if not logged out
          ledgerToUse = allLedgers[0];
        }
      }

      if (!ledgerToUse && allLedgers.length === 0) {
        // Do not create default ledger automatically.
        // User must create one via LedgerEntryPage.
        setActiveLedger(null);
      }

      if (ledgerToUse) {
        setActiveLedger(ledgerToUse);
        localStorage.setItem("activeLedgerId", ledgerToUse.id);

        // Sync global currency with ledger currency
        if (ledgerToUse.currency) {
          setCurrency(ledgerToUse.currency);
        }

        // Update last_accessed async
        dataProvider.updateLedger({
          ...ledgerToUse,
          last_accessed: new Date().toISOString(),
        });
      }

      setIsLoading(false);
    };

    init();
  }, [dataProvider, setCurrency, refreshLedgers]);

  const switchLedger = async (ledgerId: string, directLedger?: Ledger) => {
    // If directLedger is provided (e.g. just created), use it directly to avoid stale state issues
    const target = directLedger || ledgers.find((l) => l.id === ledgerId);
    if (target) {
      isLoggingOutRef.current = false;
      setIsLoading(true);

      try {
        setActiveLedger(target);
        localStorage.setItem("activeLedgerId", target.id);
        await dataProvider.updateLedger({
          ...target,
          last_accessed: new Date().toISOString(),
        });

        // Keep the in-memory currency context and persistence in sync immediately.
        if (target.currency) {
          setCurrency(target.currency);
          localStorage.setItem("selectedCurrency", target.currency);
        }

        // Clear filters to prevent stale selections from leaking across ledgers.
        localStorage.removeItem("filter_selectedAccounts");
        localStorage.removeItem("filter_selectedCategories");
        localStorage.removeItem("filter_selectedSubCategories");
        localStorage.removeItem("filter_selectedVendors");
        localStorage.removeItem("filter_searchTerm");

        // Clear logout flag as we are now entering a ledger
        localStorage.removeItem("userLoggedOut");

        if (!isLoggingOutRef.current) {
          navigateAppPath("/dashboard");
        }
      } finally {
        if (!isLoggingOutRef.current) {
          setIsLoading(false);
        }
      }
    }
  };

  const logout = useCallback(() => {
    isLoggingOutRef.current = true;
    setActiveLedger(null);
    setIsLoading(false);
    localStorage.removeItem("activeLedgerId");
    localStorage.setItem("userLoggedOut", "true");
    navigateAppPath("/ledgers");
  }, []);

  const createLedger = async (
    name: string,
    currency: string,
    icon?: string,
    shortName?: string /*, startFromScratch: boolean = true */,
  ) => {
    let newLedger: Ledger;

    try {
      newLedger = await dataProvider.addLedger({
        name,
        currency,
        icon,
        short_name: shortName,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown storage error";
      throw new Error(`Failed to create ledger record: ${message}`, {
        cause: error,
      });
    }

    // if (!startFromScratch) { ... }

    // No need to refreshLedgers() here because switchLedger updates the active context.
    try {
      await switchLedger(newLedger.id, newLedger);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown navigation error";
      throw new Error(`Ledger was created, but opening it failed: ${message}`, {
        cause: error,
      });
    }
  };

  const updateLedgerDetails = async (
    ledgerId: string,
    updates: Partial<Ledger>,
  ) => {
    const target = ledgers.find((l) => l.id === ledgerId);
    if (target) {
      const updated = { ...target, ...updates };
      await dataProvider.updateLedger(updated);
      await refreshLedgers();
      if (activeLedger?.id === ledgerId) {
        setActiveLedger(updated);
      }
    }
  };

  const deleteLedger = async (ledgerId: string) => {
    await dataProvider.deleteLedger(ledgerId);
    await refreshLedgers();
    if (activeLedger?.id === ledgerId) {
      setActiveLedger(null);
      localStorage.removeItem("activeLedgerId");
      navigateAppPath("/ledgers");
    }
  };

  return (
    <LedgerContext.Provider
      value={{
        activeLedger,
        ledgers,
        isLoading,
        switchLedger,
        logout,
        createLedger,
        updateLedgerDetails,
        deleteLedger,
        refreshLedgers,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (context === undefined) {
    throw new Error("useLedger must be used within a LedgerProvider");
  }
  return context;
};
