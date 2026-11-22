import { useCallback, useEffect, useId, useRef, useState } from "react";
import type React from "react";
import { cn } from "@/lib/utils";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import {
  systemPrefersReducedMotion,
  useDisplayPreferences,
} from "@/hooks/useDisplayPreferences";
import { lightHaptic } from "@/utils/haptics";
import { CardActionsMenu } from "./CardActionsMenu";
import type { CardAction } from "./cardActions";

/** How far the card slides to show its action button. */
const REVEAL_WIDTH = 88;

/** Tells every other card on the page that this one opened. */
const CARD_OPENED_EVENT = "vm:swipe-card-opened";

/** What a render-function child receives. */
export interface SwipeableCardRenderApi {
  /** The "…" button (null without menuButtonLabel). Place it in your own row. */
  menuButton: React.ReactNode | null;
}

export interface SwipeableCardProps {
  /**
   * The card. A plain node gets the "…" button beside it (when
   * menuButtonLabel is set); a render function places `menuButton` itself,
   * inside its own card, and no extra column is added.
   */
  children:
    React.ReactNode | ((api: SwipeableCardRenderApi) => React.ReactNode);
  leftAction?: CardAction; // revealed by swiping left (Delete)
  rightAction?: CardAction; // revealed by swiping right (Duplicate / Edit); never destructive
  menuActions: CardAction[]; // the full list shown by "…" and long press
  menuButtonLabel?: string; // when set, renders the "…" button with this aria-label
  disabled?: boolean; // select mode etc.: no swipe, no long press
  className?: string;
  /**
   * Classes for the sliding layer. It is opaque (the page background by
   * default) so the action behind never shows through a translucent card;
   * pass the colour the card actually sits on (e.g. `bg-card` inside a Card)
   * so the card looks the same as before.
   */
  contentClassName?: string;
}

/**
 * A phone card that slides sideways to reveal one action button, and opens
 * its action menu on a long press. Revealing never runs the action: the person
 * has to tap the revealed button (reveal, then tap), so a stray swipe can never
 * delete anything. The same actions are always available from the menu.
 */
export function SwipeableCard({
  children,
  leftAction,
  rightAction,
  menuActions,
  menuButtonLabel,
  disabled = false,
  className,
  contentClassName,
}: SwipeableCardProps) {
  const cardId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { reduceMotion } = useDisplayPreferences();
  const motionReduced = reduceMotion ?? systemPrefersReducedMotion();
  const hasMenu = menuActions.length > 0;

  const handleLongPress = useCallback(() => {
    if (!hasMenu) return;
    void lightHaptic();
    setMenuOpen(true);
  }, [hasMenu]);

  const { offset, dragging, bind, close } = useSwipeGesture({
    enabled: !disabled,
    onLongPress: handleLongPress,
    maxReveal: REVEAL_WIDTH,
    canRevealLeft: Boolean(leftAction),
    canRevealRight: Boolean(rightAction),
  });

  const isOpen = offset !== 0 && !dragging;

  // Clip the sliding card only while it is moved (and while it slides back),
  // so the selected outline and focus rings are not cut off at rest.
  const [previousOffset, setPreviousOffset] = useState(offset);
  const [settling, setSettling] = useState(false);
  if (offset !== previousOffset) {
    setPreviousOffset(offset);
    setSettling(offset === 0 && !motionReduced);
  }
  useEffect(() => {
    if (!settling) return;
    const timer = setTimeout(() => setSettling(false), 300);
    return () => clearTimeout(timer);
  }, [settling]);
  const clipped = offset !== 0 || dragging || settling;
  const leftRevealed = offset < 0;
  const rightRevealed = offset > 0;

  // One open card at a time: announce opening, close when another opens.
  useEffect(() => {
    if (!isOpen) return;
    window.dispatchEvent(
      new CustomEvent(CARD_OPENED_EVENT, { detail: cardId }),
    );
  }, [isOpen, cardId]);

  useEffect(() => {
    const onOtherCardOpened = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== cardId) close();
    };
    window.addEventListener(CARD_OPENED_EVENT, onOtherCardOpened);
    return () =>
      window.removeEventListener(CARD_OPENED_EVENT, onOtherCardOpened);
  }, [cardId, close]);

  // While open, a tap anywhere outside the card or any scroll closes it.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      close();
    };
    const onScroll = () => close();
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [isOpen, close]);

  const runRevealed = (action: CardAction) => {
    close();
    action.onSelect();
  };

  const renderRevealButton = (
    action: CardAction,
    side: "left" | "right",
    revealed: boolean,
  ) => {
    const Icon = action.icon;
    return (
      <button
        type="button"
        aria-label={action.ariaLabel ?? action.label}
        aria-hidden={!revealed}
        tabIndex={revealed ? 0 : -1}
        disabled={action.disabled}
        onClick={() => runRevealed(action)}
        style={{ width: REVEAL_WIDTH }}
        className={cn(
          "absolute inset-y-0 flex min-h-11 flex-col items-center justify-center gap-1 border-0 px-1 text-xs font-semibold text-white",
          "whitespace-normal break-words text-center leading-tight",
          // Measured: white on red-700 6.4:1, red-600 4.8:1, blue-700 6.8:1,
          // blue-600 5.3:1.
          action.destructive
            ? "bg-red-700 dark:bg-red-600"
            : "bg-blue-700 dark:bg-blue-600",
          side === "left" ? "right-0" : "left-0",
          !revealed && "invisible",
        )}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />}
        <span>{action.label}</span>
      </button>
    );
  };

  const menuButton = menuButtonLabel ? (
    <CardActionsMenu
      actions={menuActions}
      open={menuOpen}
      onOpenChange={setMenuOpen}
      triggerLabel={menuButtonLabel}
    />
  ) : null;

  let content: React.ReactNode;
  if (typeof children === "function") {
    content = children({ menuButton });
  } else if (menuButton) {
    content = (
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">{children}</div>
        {menuButton}
      </div>
    );
  } else {
    content = children;
  }

  return (
    <div
      ref={rootRef}
      data-swipe-card=""
      className={cn("relative", clipped && "overflow-hidden", className)}
    >
      {leftAction && renderRevealButton(leftAction, "left", leftRevealed)}
      {rightAction && renderRevealButton(rightAction, "right", rightRevealed)}
      <div
        data-swipe-content=""
        {...bind}
        style={{
          ...bind.style,
          transform: `translateX(${offset}px)`,
        }}
        className={cn(
          // Opaque, so the action behind never shows through a translucent
          // card or the gap beside it.
          "relative rounded-[inherit] bg-background",
          // A long press must not start text selection or the iOS callout:
          // WebKit would cancel the touch before the menu timer, or show its
          // selection bar over the menu. Fields and text marked
          // data-selectable-text get selection back (older WebKit will not
          // edit an input inside a user-select:none parent).
          "select-none [-webkit-touch-callout:none]",
          "[&_input]:select-text [&_textarea]:select-text [&_[data-selectable-text]]:select-text",
          !dragging &&
            !motionReduced &&
            "transition-transform duration-200 ease-out",
          contentClassName,
        )}
      >
        {content}
      </div>
      {/* Without a visible "…" the menu is anchored to the card so a long
          press can still open it. */}
      {!menuButtonLabel && hasMenu && (
        <CardActionsMenu
          actions={menuActions}
          open={menuOpen}
          onOpenChange={setMenuOpen}
        />
      )}
    </div>
  );
}
