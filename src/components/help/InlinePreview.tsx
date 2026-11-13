import * as React from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface InlinePreviewProps {
  title: string;
  body: React.ReactNode;
  /** Optional "Read more" link to the full docs on the website. */
  readMoreHref?: string;
  /** Accessible name for the ⓘ button, e.g. "About reconciling". */
  triggerLabel: string;
  /** Shows a "Got it, hide this tip" button. */
  onDismiss?: () => void;
  className?: string;
}

/** How long the pointer may leave before a hover-opened card closes. */
const HOVER_CLOSE_DELAY_MS = 150;

/**
 * The shared inline preview: a short explanation shown in place, without
 * leaving the screen. Desktop gets a hover card (also opens on click or
 * Enter/Space, closes on Escape, returns focus to the ⓘ); phones get a
 * tap-to-open bottom sheet. Used for feature hints and "Read more" previews.
 *
 * The ⓘ trigger is a 44×44px target on phones (WCAG 2.5.5 / store
 * guidelines) and 32×32px on desktop pointers.
 */
export const InlinePreview = ({
  title,
  body,
  readMoreHref,
  triggerLabel,
  onDismiss,
  className,
}: InlinePreviewProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const titleId = React.useId();
  const bodyId = React.useId();
  const closeTimer = React.useRef<number | undefined>(undefined);

  const clearCloseTimer = () => window.clearTimeout(closeTimer.current);
  React.useEffect(() => clearCloseTimer, []);

  const openOnHover = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    clearCloseTimer();
    setOpen(true);
  };
  const closeAfterHover = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    clearCloseTimer();
    closeTimer.current = window.setTimeout(
      () => setOpen(false),
      HOVER_CLOSE_DELAY_MS,
    );
  };

  const trigger = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={triggerLabel}
      className={cn(
        "h-11 w-11 shrink-0 rounded-full text-muted-foreground hover:text-foreground md:h-8 md:w-8",
        className,
      )}
      // Always open on click/Enter/Space. Without preventDefault, Radix
      // would toggle, closing a card that hovering had just opened.
      onClick={(event) => {
        event.preventDefault();
        setOpen(true);
      }}
      onPointerEnter={isMobile ? undefined : openOnHover}
      onPointerLeave={isMobile ? undefined : closeAfterHover}
    >
      <Info className="h-4 w-4" aria-hidden="true" />
    </Button>
  );

  const footer = (readMoreHref || onDismiss) && (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {readMoreHref && (
        <a
          href={readMoreHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline md:min-h-8"
        >
          {t("help.readMore", { defaultValue: "Read more" })}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
      {onDismiss && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto h-11 md:h-8"
          onClick={() => {
            setOpen(false);
            onDismiss();
          }}
        >
          {t("help.hideTip", { defaultValue: "Got it, hide this tip" })}
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            // SheetContent ships placeholder title/description elements;
            // point the dialog at the real ones.
            aria-labelledby={titleId}
            aria-describedby={bodyId}
          >
            <SheetHeader className="text-left">
              <SheetTitle id={titleId}>{title}</SheetTitle>
              <SheetDescription asChild>
                <div id={bodyId} className="text-sm leading-relaxed">
                  {body}
                </div>
              </SheetDescription>
            </SheetHeader>
            {footer}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-80 text-sm"
        role="dialog"
        aria-label={title}
        onPointerEnter={openOnHover}
        onPointerLeave={closeAfterHover}
        // Hover-opened cards should not steal focus from what the person
        // was doing; keyboard and click opens still move focus inside.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <p className="font-semibold text-foreground">{title}</p>
        <div className="mt-1 leading-relaxed text-muted-foreground">{body}</div>
        {footer}
      </PopoverContent>
    </Popover>
  );
};
