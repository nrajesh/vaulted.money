import { Suspense, lazy } from "react";
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { UserProvider } from "./contexts/UserContext";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DataProviderProvider } from "./context/DataProviderContext";
import { FilterProvider } from "./contexts/FilterContext";

import { CurrencyProvider } from "./contexts/CurrencyContext";

const queryClient = new QueryClient();

// Lazy load page components
const Index = lazy(() => import("@/pages/Index"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const CalendarView = lazy(() => import("@/pages/CalendarView"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const LanguagePage = lazy(() => import("@/pages/LanguagePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const Vendors = lazy(() => import("@/pages/Vendors"));
const Categories = lazy(() => import("@/pages/Categories"));
const ScheduledTransactions = lazy(
  () => import("@/pages/ScheduledTransactions"),
);
const Budgets = lazy(() => import("@/pages/Budgets"));
const EssentialReports = lazy(() => import("@/pages/reports/EssentialReports"));
const AdvancedReports = lazy(() => import("@/pages/reports/AdvancedReports"));
const Insights = lazy(() => import("@/pages/Insights"));
const LedgerEntryPage = lazy(() => import("@/pages/LedgerEntryPage"));
import { LedgerProvider } from "./contexts/LedgerContext";
const DataManagementPage = lazy(() => import("@/pages/DataManagementPage"));
const BackupPage = lazy(() => import("@/pages/BackupPage"));
const CurrenciesPage = lazy(() => import("@/pages/CurrenciesPage"));
const AIProviders = lazy(() => import("@/pages/AIProviders"));
import BackupManager from "@/components/backup/BackupManager";
import ApiBridge from "@/api/ApiBridge";
const DonationPage = lazy(() => import("@/pages/DonationPage"));
const AcknowledgmentsPage = lazy(() => import("@/pages/AcknowledgmentsPage"));
import { ContinuitySyncManager } from "@/components/ContinuitySyncManager";
import { TourProvider } from "./contexts/TourContext";
import HelpTour from "./components/ui/help-tour";
import { isElectron } from "@/utils/electron";

// ... existing imports

function App() {
  const usesAppShellRouting = isElectron() || Capacitor.isNativePlatform();
  const Router = usesAppShellRouting ? HashRouter : BrowserRouter;

  return (
    <QueryClientProvider client={queryClient}>
      <DataProviderProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <FilterProvider>
              <LedgerProvider>
                <UserProvider>
                  <TransactionsProvider>
                    <BackupManager />
                    <ApiBridge />
                    <Router>
                      <TourProvider>
                        <HelpTour />
                        <Suspense fallback={<LoadingSpinner />}>
                          <Routes>
                            <Route
                              path="/ledgers"
                              element={<LedgerEntryPage />}
                            />
                            <Route
                              path="/"
                              element={
                                usesAppShellRouting ? (
                                  <Navigate to="/ledgers" replace />
                                ) : (
                                  <HomePage />
                                )
                              }
                            />
                            <Route
                              path="/privacy"
                              element={<PrivacyPolicyPage />}
                            />
                            <Route path="/" element={<Layout />}>
                              <Route path="dashboard" element={<Index />} />
                              <Route
                                path="calendar"
                                element={<CalendarView />}
                              />
                              <Route
                                path="/transactions"
                                element={<Transactions />}
                              />
                              <Route path="/vendors" element={<Vendors />} />
                              <Route path="/accounts" element={<Accounts />} />
                              <Route
                                path="/categories"
                                element={<Categories />}
                              />
                              <Route
                                path="/scheduled"
                                element={<ScheduledTransactions />}
                              />
                              <Route path="/budgets" element={<Budgets />} />
                              <Route
                                path="/analytics"
                                element={<Analytics />}
                              />
                              <Route
                                path="/reports/essential"
                                element={<EssentialReports />}
                              />
                              <Route
                                path="/reports/advanced"
                                element={<AdvancedReports />}
                              />
                              <Route path="/insights" element={<Insights />} />
                              <Route
                                path="/settings"
                                element={<SettingsPage />}
                              />
                              <Route
                                path="/language"
                                element={<LanguagePage />}
                              />
                              <Route
                                path="/data-management"
                                element={<DataManagementPage />}
                              />
                              <Route path="/backup" element={<BackupPage />} />
                              <Route
                                path="/currencies"
                                element={<CurrenciesPage />}
                              />
                              <Route
                                path="/ai-providers"
                                element={<AIProviders />}
                              />
                              {!Capacitor.isNativePlatform() && (
                                <Route
                                  path="/donate"
                                  element={<DonationPage />}
                                />
                              )}
                              <Route
                                path="/acknowledgments"
                                element={<AcknowledgmentsPage />}
                              />

                              <Route path="*" element={<NotFound />} />
                            </Route>
                          </Routes>
                        </Suspense>
                        <ShadcnToaster />
                      </TourProvider>
                    </Router>
                    <ContinuitySyncManager />
                  </TransactionsProvider>
                </UserProvider>
              </LedgerProvider>
            </FilterProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </DataProviderProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
