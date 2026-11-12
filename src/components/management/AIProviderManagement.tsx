import * as React from "react";
import { AlertTriangle, Check, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AIProvider } from "@/types/dataProvider";
import AddEditAIProviderDialog from "./AddEditAIProviderDialog";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";
import { useAIProviderManagement } from "@/hooks/useAIProviderManagement";
import { AI_DEFAULT_MODELS } from "@/constants/aiDefaultModels";
import { Button } from "@/components/ui/button";
import { useDataProvider } from "@/context/DataProviderContext";
import {
  readAiApiKeyFromStorage,
  removeAiApiKeyFromStorage,
} from "@/constants/aiApiKeyStorage";
import { looksLikeEmbeddingModel, providerNeedsApiKey } from "@/utils/aiModels";
import { cn } from "@/lib/utils";
import { canUseLocalModels } from "@/utils/localModels";

const TYPE_LABELS: Record<AIProvider["type"], string> = {
  OPENAI: "OpenAI",
  GEMINI: "Google Gemini",
  ANTHROPIC: "Anthropic",
  MISTRAL: "Mistral",
  PERPLEXITY: "Perplexity",
  CUSTOM: "",
};

interface AIProviderManagementProps {
  /** Tells the page around the list which providers exist right now. */
  onProvidersChange?: (providers: AIProvider[]) => void;
  /** The page around the list already shows the title. */
  hideHeading?: boolean;
}

/**
 * The AI providers used inside the app, as a short list of cards. People have
 * one to three of these, so there is no table, search, paging or bulk
 * selection: each card says what the provider is, whether it is the one in
 * use, and what it still needs.
 */
const AIProviderManagement = ({
  onProvidersChange,
  hideHeading = false,
}: AIProviderManagementProps) => {
  const { t } = useTranslation();
  const dataProvider = useDataProvider();
  const {
    providers,
    selectedProvider,
    isDialogOpen,
    setIsDialogOpen,
    isConfirmOpen,
    setIsConfirmOpen,
    handleAddClick,
    handleEditClick,
    handleDeleteClick,
    confirmDelete,
    refetch,
  } = useAIProviderManagement();

  React.useEffect(() => {
    onProvidersChange?.(providers);
  }, [providers, onProvidersChange]);

  // One click puts a provider to use, right where the list is.
  const putToUse = async (id: string) => {
    await dataProvider.setDefaultAIProvider(id);
    await refetch();
  };

  const deleteSelected = async () => {
    const id = selectedProvider?.id;
    await confirmDelete();
    // The key is useless without its provider; do not leave it behind.
    if (id) removeAiApiKeyFromStorage(id);
  };

  const fact = (label: string, value: React.ReactNode) => (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{value}</dd>
    </div>
  );

  return (
    <div className="page-container">
      <div
        className={cn(
          "flex flex-wrap items-start gap-3",
          hideHeading ? "justify-end" : "justify-between",
        )}
      >
        <div className="min-w-0 max-w-3xl">
          {!hideHeading && (
            <h2 className="text-xl font-semibold tracking-tight">
              {t("aiHub.providers.title", {
                defaultValue: "AI inside the app",
              })}
            </h2>
          )}
          {!hideHeading && (
            <ul className="tour-ai-byok list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                {t("aiHub.providers.point1", {
                  defaultValue: "Powers Auto-categorize.",
                })}
              </li>
              <li>
                {t("aiHub.providers.point2", {
                  defaultValue: "Only vendor names are sent, never amounts.",
                })}
              </li>
            </ul>
          )}
        </div>
        <div className="tour-entity-actions">
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" aria-hidden />
            {t("management.actions.add", {
              name: t("aiProviders.page.singular", {
                defaultValue: "AI Provider",
              }),
              defaultValue: "Add {{name}}",
            })}
          </Button>
        </div>
      </div>

      <div className="tour-entity-table">
        {providers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            {canUseLocalModels()
              ? t("aiHub.providers.empty", {
                  defaultValue:
                    "No provider yet. Add one to let the app suggest categories. A model on your own computer (LM Studio, Ollama) works too and needs no key.",
                })
              : t("aiHub.providers.emptyMobile", {
                  defaultValue:
                    "No provider yet. Add one to let the app suggest categories. Models running on your own computer need the desktop app.",
                })}
          </div>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {providers.map((item) => {
              const hasKey = !!readAiApiKeyFromStorage(item.id);
              const needsKey = providerNeedsApiKey(item) && !hasKey;
              const wrongModel = looksLikeEmbeddingModel(item.model);
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border bg-card p-4",
                    item.isDefault && "border-primary",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-semibold">
                        {item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABELS[item.type] ||
                          t("aiProviders.dialog.customOption", {
                            defaultValue: "Custom (OpenAI Compatible)",
                          })}
                      </p>
                    </div>
                    {item.isDefault ? (
                      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-green-600/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                        <Check className="h-3 w-3" aria-hidden />
                        {t("aiHub.providers.inUse", { defaultValue: "In use" })}
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => putToUse(item.id)}
                      >
                        {t("aiHub.providers.useThis", {
                          defaultValue: "Use this one",
                        })}
                      </Button>
                    )}
                  </div>

                  <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                    {fact(
                      t("aiProviders.columns.model", { defaultValue: "Model" }),
                      item.model ||
                        (AI_DEFAULT_MODELS[item.type]
                          ? t("aiProviders.columns.defaultModel", {
                              defaultValue: "Default: {{model}}",
                              model: AI_DEFAULT_MODELS[item.type],
                            })
                          : t("aiProviders.columns.serverModel", {
                              defaultValue: "Server default",
                            })),
                    )}
                    {fact(
                      t("aiHub.providers.keyColumn", {
                        defaultValue: "API key",
                      }),
                      hasKey
                        ? t("aiHub.providers.keySaved", {
                            defaultValue: "Saved",
                          })
                        : needsKey
                          ? t("aiHub.providers.keyMissingLong", {
                              defaultValue: "Missing",
                            })
                          : t("aiHub.providers.keyNotNeeded", {
                              defaultValue: "Not needed",
                            }),
                    )}
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-xs text-muted-foreground">
                        {t("aiProviders.columns.endpoint", {
                          defaultValue: "Endpoint",
                        })}
                      </dt>
                      <dd className="break-all font-mono text-xs">
                        {item.baseUrl}
                      </dd>
                    </div>
                  </dl>

                  {(needsKey || wrongModel) && (
                    <p className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                      <AlertTriangle
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        aria-hidden
                      />
                      <span>
                        {needsKey
                          ? t("aiHub.providers.needsKeyNote", {
                              defaultValue:
                                "This provider cannot be used until you add its API key.",
                            })
                          : t("aiHub.providers.embeddingNote", {
                              defaultValue:
                                "This looks like an embedding model, which cannot answer questions or suggest categories. Pick a chat model instead.",
                            })}
                      </span>
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={needsKey || wrongModel ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleEditClick(item)}
                      aria-label={t("aiHub.providers.editNamed", {
                        name: item.name,
                        defaultValue: "Edit {{name}}",
                      })}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden />
                      {needsKey
                        ? t("aiHub.providers.keyMissing", {
                            defaultValue: "Add key",
                          })
                        : t("aiHub.providers.edit", { defaultValue: "Edit" })}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive-text hover:text-destructive-text"
                      onClick={() => handleDeleteClick(item)}
                      aria-label={t("aiHub.providers.removeNamed", {
                        name: item.name,
                        defaultValue: "Remove {{name}}",
                      })}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden />
                      {t("aiHub.providers.remove", { defaultValue: "Remove" })}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AddEditAIProviderDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        provider={selectedProvider}
        onSuccess={refetch}
        isFirstProvider={providers.length === 0}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={deleteSelected}
        title={t("aiHub.providers.removeTitle", {
          name: selectedProvider?.name ?? "",
          defaultValue: "Remove {{name}}?",
        })}
        description={t("aiHub.providers.removeBody", {
          defaultValue:
            "The provider and its saved API key are removed from this device. Your transactions and categories are not changed.",
        })}
        confirmText={t("aiHub.providers.remove", { defaultValue: "Remove" })}
      />
    </div>
  );
};

export default AIProviderManagement;
