import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * Plain-language empty states for the main lists. Each says what is missing
 * and what to do next, because a list can be empty for two reasons (nothing
 * added yet, or filters hide everything) and the lists don't know which.
 */
const EMPTY_STATES = {
  transactions: {
    title: "No transactions to show",
    hint: "Add one with the + button, import a bank file from Actions, or clear your filters.",
  },
  listItems: {
    title: "Nothing here yet",
    hint: "Use the Add button above, or clear your search.",
  },
  scheduled: {
    title: "No upcoming bills yet",
    hint: "Add one with Add Scheduled, or let Auto-Schedule find bills that repeat.",
  },
} as const;

type EmptyStateKind = keyof typeof EMPTY_STATES;

export const EmptyState = ({
  kind,
  className,
}: {
  kind: EmptyStateKind;
  className?: string;
}) => {
  const { t } = useTranslation();
  const copy = EMPTY_STATES[kind];
  return (
    <div className={cn("mx-auto max-w-sm space-y-1 text-center", className)}>
      <p className="font-medium text-foreground">
        {t(`emptyStates.${kind}.title`, { defaultValue: copy.title })}
      </p>
      <p className="text-sm text-muted-foreground">
        {t(`emptyStates.${kind}.hint`, { defaultValue: copy.hint })}
      </p>
    </div>
  );
};
