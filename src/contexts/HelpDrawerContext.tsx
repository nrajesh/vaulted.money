import * as React from "react";

export type HelpDrawerTab = "help" | "ask";

interface HelpDrawerContextValue {
  isOpen: boolean;
  tab: HelpDrawerTab;
  setTab: (tab: HelpDrawerTab) => void;
  openHelp: (tab?: HelpDrawerTab) => void;
  setOpen: (open: boolean) => void;
}

const HelpDrawerContext = React.createContext<HelpDrawerContextValue | null>(
  null,
);

/** Open state for the help drawer, so any header button can open it. */
export const HelpDrawerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<HelpDrawerTab>("help");

  const openHelp = React.useCallback((next: HelpDrawerTab = "help") => {
    setTab(next);
    setOpen(true);
  }, []);

  const value = React.useMemo(
    () => ({ isOpen, tab, setTab, openHelp, setOpen }),
    [isOpen, tab, openHelp],
  );

  return (
    <HelpDrawerContext.Provider value={value}>
      {children}
    </HelpDrawerContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useHelpDrawer = () => {
  const context = React.useContext(HelpDrawerContext);
  if (!context) {
    throw new Error("useHelpDrawer must be used within a HelpDrawerProvider");
  }
  return context;
};
