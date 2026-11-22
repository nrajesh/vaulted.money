import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { format } from "date-fns";
import { Download, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SwipeableCard } from "@/components/cards/SwipeableCard";
import type { CardAction } from "@/components/cards/cardActions";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";
import { useDataProvider } from "@/context/DataProviderContext";
import { useContinueWithoutCopy } from "@/hooks/useContinueWithoutCopy";
import type { SafetyBackupSummary } from "@/types/dataProvider";
import { saveFile } from "@/utils/backupUtils";
import { formatDisplayDate } from "@/utils/dateFormat";
import {
  restoreSafetyBackup,
  SafetyBackupFailedError,
} from "@/utils/safetyBackup";
import { showError, showSuccess } from "@/utils/toast";

const SAFETY_BACKUPS_QUERY_KEY = ["safetyBackups"] as const;

/** "Before CSV import: transactions", "Before sync", ... */
const describeReason = (copy: SafetyBackupSummary, t: TFunction): string => {
  if (copy.reason === "csv_import" && copy.entity) {
    return t("safetyBackups.reasons.csv_import_entity", {
      defaultValue: "Before CSV import: {{entity}}",
      entity: t(`safetyBackups.entities.${copy.entity}`, {
        defaultValue: copy.entity,
      }),
    });
  }
  return t(`safetyBackups.reasons.${copy.reason}`, {
    defaultValue: copy.reason,
  });
};

const formatTime = (value: string, language: string): string => {
  try {
    return new Intl.DateTimeFormat(language, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return format(new Date(value), "HH:mm");
  }
};

/**
 * "Automatic safety copies" on the Backup screen: the copies made before
 * imports, AI changes, sync, demo data and restores (newest first, at most
 * five). Each can be restored, saved as a file or deleted; Select deletes
 * several at once.
 *
 * On phones a row swipes left to reveal Delete, and a long press opens its
 * ⋯ menu (see SwipeableCard).
 */
const SafetyBackups = () => {
  const { t, i18n } = useTranslation();
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();
  const { runRequired, continueWithoutCopyDialog } = useContinueWithoutCopy();

  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [restoreId, setRestoreId] = React.useState<string | null>(null);
  // Ids waiting for the delete confirmation (one from a menu, or the selection).
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<
    string[] | null
  >(null);

  const { data: copies = [], isError } = useQuery({
    queryKey: SAFETY_BACKUPS_QUERY_KEY,
    queryFn: () => dataProvider.listSafetyBackups(),
  });

  const toggleSelected = React.useCallback((id: string, checked: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const stopSelecting = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const restore = (id: string) =>
    runRequired(async (options) => {
      try {
        await restoreSafetyBackup(dataProvider, id, options);
      } catch (error) {
        // Let the hook ask whether to continue without an undo copy.
        if (error instanceof SafetyBackupFailedError) throw error;
        console.error("Restoring a safety copy failed", error);
        showError(
          t("safetyBackups.restoreFailed", {
            defaultValue: "Couldn't restore the safety copy.",
          }),
        );
        return;
      }
      showSuccess(
        t("safetyBackups.restored", { defaultValue: "Safety copy restored." }),
      );
      // Everything was replaced, so ledger ids may differ: reload the app so
      // the active ledger and every context are rebuilt, as the file restore
      // on the Data Management screen does.
      window.location.reload();
    });

  const saveAsFile = async (copy: SafetyBackupSummary) => {
    try {
      const full = await dataProvider.getSafetyBackup(copy.id);
      if (!full) throw new Error("Safety copy not found");
      const stamp = format(new Date(copy.created_at), "yyyy-MM-dd-HHmm");
      await saveFile(
        `vaulted-money-safety-copy-${stamp}.json`,
        full.payload,
        t("safetyBackups.saveDescription", {
          defaultValue: "Vaulted Money safety copy",
        }),
      );
    } catch (error) {
      console.error("Saving a safety copy failed", error);
      showError(
        t("safetyBackups.saveFailed", {
          defaultValue: "Couldn't save the safety copy as a file.",
        }),
      );
    }
  };

  const deleteCopies = async (ids: string[]) => {
    try {
      const deleted = await dataProvider.deleteSafetyBackups(ids);
      stopSelecting();
      await queryClient.invalidateQueries({
        queryKey: SAFETY_BACKUPS_QUERY_KEY,
      });
      showSuccess(
        t("safetyBackups.deleted", {
          count: deleted,
          defaultValue: "{{count}} safety copies deleted.",
        }),
      );
    } catch (error) {
      console.error("Deleting safety copies failed", error);
      showError(
        t("safetyBackups.deleteFailed", {
          defaultValue: "Couldn't delete the safety copies.",
        }),
      );
    }
  };

  const pendingDeleteCount = pendingDeleteIds?.length ?? 0;

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          {/* basis-48: without a basis the buttons never wrap, and on a narrow
              phone with Larger text they squeeze the title to one letter per line. */}
          <div className="min-w-0 flex-1 basis-48">
            <CardTitle className="break-words">
              {t("safetyBackups.title", {
                defaultValue: "Automatic safety copies",
              })}
            </CardTitle>
            <CardDescription className="mt-1.5">
              {t("safetyBackups.about", {
                defaultValue:
                  "Made before imports, AI changes and sync. The last 5 are kept.",
              })}
            </CardDescription>
          </div>
          {copies.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {isSelecting ? (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-auto min-h-9 whitespace-normal"
                    disabled={selectedIds.size === 0}
                    onClick={() =>
                      // Keep the list order (newest first).
                      setPendingDeleteIds(
                        copies
                          .filter((copy) => selectedIds.has(copy.id))
                          .map((copy) => copy.id),
                      )
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t("safetyBackups.deleteCount", {
                      count: selectedIds.size,
                      defaultValue: "Delete ({{count}})",
                    })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto min-h-9 whitespace-normal"
                    onClick={stopSelecting}
                  >
                    {t("dialogs.common.cancel", { defaultValue: "Cancel" })}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-9 whitespace-normal"
                  onClick={() => setIsSelecting(true)}
                >
                  {t("safetyBackups.select", { defaultValue: "Select" })}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="text-sm text-destructive">
            {t("safetyBackups.loadFailed", {
              defaultValue: "Couldn't load the safety copies.",
            })}
          </p>
        ) : copies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("safetyBackups.empty", {
              defaultValue:
                "No safety copies yet. One is made automatically before an import, an AI change or a sync.",
            })}
          </p>
        ) : (
          <ul className="space-y-3">
            {copies.map((copy) => {
              const name = describeReason(copy, t);
              const details = t("safetyBackups.details", {
                defaultValue: "{{date}}, {{time}} · {{ledgers}}",
                date: formatDisplayDate(copy.created_at, i18n.language),
                time: formatTime(copy.created_at, i18n.language),
                ledgers: t("safetyBackups.ledgerCount", {
                  count: copy.ledger_count,
                  defaultValue: "{{count}} ledgers",
                }),
              });
              const checkboxId = `safety-copy-${copy.id}`;
              // One action list for the swipe, the ⋯ menu and long press.
              const deleteAction: CardAction = {
                id: "delete",
                label: t("safetyBackups.delete", { defaultValue: "Delete" }),
                icon: Trash2,
                destructive: true,
                onSelect: () => setPendingDeleteIds([copy.id]),
              };
              const moreActionsLabel = t("safetyBackups.moreActions", {
                name,
                details,
                defaultValue: "More actions for {{name}}, {{details}}",
              });
              return (
                <li key={copy.id}>
                  {/* Swipe left reveals Delete (the same confirmation as the
                      ⋯ menu); a long press opens the ⋯ menu. No right swipe:
                      a copy has no harmless quick action. */}
                  <SwipeableCard
                    className="rounded-lg"
                    contentClassName="bg-card"
                    leftAction={deleteAction}
                    menuActions={[deleteAction]}
                    menuButtonLabel={moreActionsLabel}
                    disabled={isSelecting}
                  >
                    {({ menuButton }) => (
                      <div className="rounded-lg border border-border p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          {isSelecting && (
                            <Checkbox
                              id={checkboxId}
                              className="mt-1"
                              checked={selectedIds.has(copy.id)}
                              onCheckedChange={(checked) =>
                                toggleSelected(copy.id, checked === true)
                              }
                              aria-label={t("safetyBackups.selectOne", {
                                name,
                                details,
                                defaultValue: "Select {{name}}, {{details}}",
                              })}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-medium text-foreground">
                              {name}
                            </p>
                            <p className="break-words text-sm text-muted-foreground">
                              {details}
                            </p>
                          </div>
                        </div>
                        {!isSelecting && (
                          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-auto min-h-9 whitespace-normal"
                              onClick={() => setRestoreId(copy.id)}
                              aria-label={t("safetyBackups.restoreOne", {
                                name,
                                details,
                                defaultValue: "Restore {{name}}, {{details}}",
                              })}
                            >
                              <RotateCcw
                                className="mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                              {t("safetyBackups.restore", {
                                defaultValue: "Restore",
                              })}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-auto min-h-9 whitespace-normal"
                              onClick={() => void saveAsFile(copy)}
                              aria-label={t("safetyBackups.saveAsFileOne", {
                                name,
                                details,
                                defaultValue:
                                  "Save as file: {{name}}, {{details}}",
                              })}
                            >
                              <Download
                                className="mr-2 h-4 w-4"
                                aria-hidden="true"
                              />
                              {t("safetyBackups.saveAsFile", {
                                defaultValue: "Save as file",
                              })}
                            </Button>
                            {menuButton}
                          </div>
                        )}
                      </div>
                    )}
                  </SwipeableCard>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <ConfirmationDialog
        isOpen={restoreId !== null}
        onOpenChange={(open) => {
          if (!open) setRestoreId(null);
        }}
        onConfirm={() => {
          if (restoreId) void restore(restoreId);
        }}
        title={t("safetyBackups.restoreConfirmTitle", {
          defaultValue: "Restore this safety copy?",
        })}
        description={t("safetyBackups.restoreConfirmBody", {
          defaultValue:
            "All your current data will be replaced with this copy. A safety copy of your current data is made first, so you can undo this.",
        })}
        confirmText={t("safetyBackups.restore", { defaultValue: "Restore" })}
      />

      <ConfirmationDialog
        isOpen={pendingDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteIds(null);
        }}
        onConfirm={() => {
          if (pendingDeleteIds) void deleteCopies(pendingDeleteIds);
        }}
        title={t("safetyBackups.deleteConfirmTitle", {
          count: pendingDeleteCount,
          defaultValue: "Delete safety copies?",
        })}
        description={t("safetyBackups.deleteConfirmBody", {
          count: pendingDeleteCount,
          defaultValue:
            "{{count}} safety copies will be deleted. This can't be undone.",
        })}
        confirmText={t("safetyBackups.delete", { defaultValue: "Delete" })}
      />

      {continueWithoutCopyDialog}
    </Card>
  );
};

export default SafetyBackups;
