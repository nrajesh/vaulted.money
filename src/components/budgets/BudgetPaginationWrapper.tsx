import { useTranslation } from "react-i18next";
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Budget } from "../../types/budgets";
import { Transaction } from "@/data/finance-data";
import { BudgetCard } from "./BudgetCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BudgetPaginationWrapperProps {
  budgets: Budget[];
  isLoading: boolean;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
  transactions?: Transaction[];
  selectedBudgetIds?: Set<string>;
  onToggleSelection?: (budgetId: string) => void;
}

const BUDGETS_PER_PAGE = 3;

export function BudgetPaginationWrapper({
  budgets,
  isLoading,
  onEdit,
  onDelete,
  transactions = [],
  selectedBudgetIds,
  onToggleSelection,
}: BudgetPaginationWrapperProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const totalPages = useMemo(
    () => Math.ceil(budgets.length / BUDGETS_PER_PAGE),
    [budgets.length],
  );

  const paginatedBudgets = useMemo(() => {
    const start = (currentPage - 1) * BUDGETS_PER_PAGE;
    const end = start + BUDGETS_PER_PAGE;
    return budgets.slice(start, end);
  }, [budgets, currentPage]);

  // Fix: Redirect to previous page if current page becomes empty
  if (currentPage > 1 && paginatedBudgets.length === 0 && budgets.length > 0) {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  // --- Keyboard Navigation (Arrow Keys) ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        goToNextPage();
      } else if (event.key === "ArrowLeft") {
        goToPrevPage();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPrevPage]);

  // --- Swipe Navigation (Touch Events) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > 50; // Minimum distance for a swipe

    if (isSwipe) {
      if (distance > 0) {
        // Swiped left (Go to next page)
        goToNextPage();
      } else {
        // Swiped right (Go to previous page)
        goToPrevPage();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-medium">
          {t("budgets.page.empty", { defaultValue: "No budgets found" })}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("budgets.page.emptyHint", {
            defaultValue: "Get started by creating your first budget.",
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {paginatedBudgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            onEdit={onEdit}
            onDelete={onDelete}
            transactions={transactions}
            isSelected={selectedBudgetIds?.has(budget.id)}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 pt-4">
          <Button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            variant="outline"
            size="icon"
            aria-label={t("budgets.page.prevPage", {
              defaultValue: "Previous page",
            })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("management.status.page", {
              page: currentPage,
              total: totalPages,
              defaultValue: "Page {{page}} of {{total}}",
            })}
          </span>
          <Button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            variant="outline"
            size="icon"
            aria-label={t("budgets.page.nextPage", {
              defaultValue: "Next page",
            })}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
