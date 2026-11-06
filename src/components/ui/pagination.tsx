import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ButtonProps, buttonVariants } from "@/components/ui/button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
  disabled?: boolean; // Added disabled prop
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">;

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  disabled, // Destructured disabled prop
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    aria-disabled={disabled} // Set aria-disabled attribute
    tabIndex={disabled ? -1 : undefined} // Prevent focus when disabled
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      disabled && "pointer-events-none opacity-50", // Apply disabled styles
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  const { t } = useTranslation();
  return (
    <PaginationLink
      aria-label={t("management.status.goPrevious", {
        defaultValue: "Go to previous page",
      })}
      size="default"
      className={cn("gap-1 pl-2.5", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>
        {t("management.status.previousLong", { defaultValue: "Previous" })}
      </span>
    </PaginationLink>
  );
};
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  const { t } = useTranslation();
  return (
    <PaginationLink
      aria-label={t("management.status.goNext", {
        defaultValue: "Go to next page",
      })}
      size="default"
      className={cn("gap-1 pr-2.5", className)}
      {...props}
    >
      <span>{t("management.status.nextLong", { defaultValue: "Next" })}</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
};
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => {
  const { t } = useTranslation();
  return (
    <span
      aria-hidden
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">
        {t("management.status.morePages", { defaultValue: "More pages" })}
      </span>
    </span>
  );
};
PaginationEllipsis.displayName = "PaginationEllipsis";

const PaginationFirst = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  const { t } = useTranslation();
  return (
    <PaginationLink
      aria-label={t("transactionsTable.goFirst", {
        defaultValue: "Go to first page",
      })}
      size="default"
      className={cn("gap-1 pl-2.5", className)}
      {...props}
    >
      <ChevronsLeft className="h-4 w-4" />
      <span>{t("transactionsTable.first", { defaultValue: "First" })}</span>
    </PaginationLink>
  );
};
PaginationFirst.displayName = "PaginationFirst";

const PaginationLast = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  const { t } = useTranslation();
  return (
    <PaginationLink
      aria-label={t("transactionsTable.goLast", {
        defaultValue: "Go to last page",
      })}
      size="default"
      className={cn("gap-1 pr-2.5", className)}
      {...props}
    >
      <span>{t("transactionsTable.last", { defaultValue: "Last" })}</span>
      <ChevronsRight className="h-4 w-4" />
    </PaginationLink>
  );
};
PaginationLast.displayName = "PaginationLast";

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
};
