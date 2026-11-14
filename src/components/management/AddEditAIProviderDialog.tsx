import { defaultModel } from "@/constants/aiDefaultModels";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { useDataProvider } from "@/context/DataProviderContext";
import { AIProvider } from "@/types/dataProvider";
import { buildGeminiUrl } from "@/hooks/useAutoCategorize";
import {
  readAiApiKeyFromStorage,
  removeAiApiKeyFromStorage,
  writeAiApiKeyToStorage,
} from "@/constants/aiApiKeyStorage";
import {
  bearerHeader,
  fetchProviderModels,
  isAiReady,
  looksLikeEmbeddingModel,
  providerNeedsApiKey,
} from "@/utils/aiModels";
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import {
  canUseLocalModels,
  isLoopbackUrl,
  isPrivateNetworkUrl,
} from "@/utils/localModels";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const buildFormSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(
      1,
      t("aiProviders.dialog.errors.name", {
        defaultValue: "Name is required",
      }),
    ),
    type: z.enum([
      "OPENAI",
      "GEMINI",
      "ANTHROPIC",
      "MISTRAL",
      "PERPLEXITY",
      "CUSTOM",
    ]),
    baseUrl: z.string().url(
      t("aiProviders.dialog.errors.url", {
        defaultValue: "Must be a valid URL",
      }),
    ),
    model: z.string().optional(),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
  });

type FormSchema = ReturnType<typeof buildFormSchema>;

const PROVIDER_DOCS: Record<string, { url: string; endpoint: string }> = {
  OPENAI: {
    url: "https://platform.openai.com/docs/models",
    endpoint: "https://api.openai.com/v1",
  },
  GEMINI: {
    url: "https://ai.google.dev/gemini-api/docs/models/gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1",
  },
  ANTHROPIC: {
    url: "https://docs.anthropic.com/en/docs/about-claude/models",
    endpoint: "https://api.anthropic.com/v1/messages",
  },
  MISTRAL: {
    url: "https://docs.mistral.ai/platform/endpoints/",
    endpoint: "https://api.mistral.ai/v1",
  },
  PERPLEXITY: {
    url: "https://docs.perplexity.ai/docs/model-cards",
    endpoint: "https://api.perplexity.ai",
  },
  CUSTOM: {
    url: "https://platform.openai.com/docs/api-reference",
    endpoint: "",
  },
};

interface AddEditAIProviderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  provider?: AIProvider | null;
  onSuccess?: () => void;
  /** True when no provider exists yet, so the new one is put to use at once. */
  isFirstProvider?: boolean;
}

const AddEditAIProviderDialog: React.FC<AddEditAIProviderDialogProps> = ({
  isOpen,
  onOpenChange,
  provider,
  onSuccess,
  isFirstProvider = false,
}) => {
  const { t } = useTranslation();
  const dataProvider = useDataProvider();
  const formSchema = React.useMemo(() => buildFormSchema(t), [t]);

  // Only the desktop app can reach a model on "this computer". Everywhere
  // else (the website, phones) the local option is not offered and a new
  // provider starts as a hosted one.
  const localOk = React.useMemo(() => canUseLocalModels(), []);
  const startType = localOk ? "CUSTOM" : "OPENAI";
  const startUrl = localOk ? "" : PROVIDER_DOCS.OPENAI.endpoint;

  const form = useForm<z.infer<FormSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: startType,
      baseUrl: startUrl,
      model: "",
      description: "",
      isDefault: false,
    },
  });

  React.useEffect(() => {
    if (provider) {
      form.reset({
        name: provider.name,
        type: provider.type,
        baseUrl: provider.baseUrl,
        model: provider.model,
        description: provider.description || "",
        isDefault: provider.isDefault || false,
      });
    } else {
      form.reset({
        name: "",
        type: startType,
        baseUrl: startUrl,
        model: "",
        description: "",
        // The first provider is the one to use; nobody should have to go and
        // switch it on somewhere else.
        isDefault: isFirstProvider,
      });
    }
    // The key lives beside the provider it belongs to, never in the database.
    setApiKey(provider?.id ? readAiApiKeyFromStorage(provider.id) : "");
    setModels([]);
    setTypeModelByHand(false);
  }, [provider, form, isOpen, isFirstProvider, startType, startUrl]);

  const [apiKey, setApiKey] = React.useState("");
  const [isTesting, setIsTesting] = React.useState(false);
  const [models, setModels] = React.useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(false);
  // After a list has loaded the field is a dropdown; this switches it back.
  const [typeModelByHand, setTypeModelByHand] = React.useState(false);

  // A local model has no key, so only hosted providers are stopped here.
  const hasUsableKey = (values: z.infer<FormSchema>) => {
    if (
      !localOk &&
      (isLoopbackUrl(values.baseUrl) || isPrivateNetworkUrl(values.baseUrl))
    ) {
      showError(
        t("aiHub.dialog.noLocalNetworkHere", {
          defaultValue:
            "A model on your own computer or home network works in the Mac app only.",
        }),
      );
      return false;
    }
    if (isAiReady(values, apiKey)) return true;
    showError(
      t("aiHub.dialog.needKey", {
        defaultValue: "Enter the API key for this provider first.",
      }),
    );
    return false;
  };

  // Asks the provider which models this key can use, so the list is never stale.
  const handleLoadModels = async () => {
    const values = form.getValues();
    if (!hasUsableKey(values)) return;
    setIsLoadingModels(true);
    try {
      const found = await fetchProviderModels(values, apiKey);
      setModels(found ?? []);
      setTypeModelByHand(false);
      showSuccess(
        t("aiProviders.dialog.modelsLoaded", {
          count: found?.length ?? 0,
          defaultValue: "{{count}} models found",
        }),
      );
    } catch (error: unknown) {
      showError(
        t("aiProviders.dialog.modelsFailed", {
          message:
            // A browser says only "Failed to fetch" when nothing answers.
            error instanceof TypeError
              ? t("aiHub.dialog.unreachable", {
                  url: values.baseUrl,
                  defaultValue:
                    "nothing answered at {{url}}. Check the server is running and allows requests from other apps (CORS).",
                })
              : error instanceof Error
                ? error.message
                : String(error),
          defaultValue: "Could not load models: {{message}}",
        }),
      );
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleTestConnection = async () => {
    const values = form.getValues();
    if (!hasUsableKey(values)) return;

    setIsTesting(true);
    try {
      let url = values.baseUrl;
      if (values.type === "GEMINI") {
        url = buildGeminiUrl(
          { ...values, id: provider?.id || "temp" } as AIProvider,
          apiKey,
        );
      } else if (
        values.type === "OPENAI" ||
        values.type === "CUSTOM" ||
        values.type === "MISTRAL" ||
        values.type === "PERPLEXITY"
      ) {
        url = `${values.baseUrl.replace(/\/$/, "")}/chat/completions`;
      } else if (values.type === "ANTHROPIC") {
        url = values.baseUrl; // Anthropic is usually a full URL
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(values.type === "OPENAI" ||
          values.type === "CUSTOM" ||
          values.type === "PERPLEXITY" ||
          values.type === "MISTRAL"
            ? bearerHeader(apiKey)
            : {}),
          ...(values.type === "ANTHROPIC"
            ? {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "dangerously-allow-browser": "true",
              }
            : {}),
        },
        body: JSON.stringify(
          values.type === "GEMINI"
            ? {
                contents: [
                  { parts: [{ text: "Say 'Success' if you can read this." }] },
                ],
              }
            : values.type === "ANTHROPIC"
              ? {
                  model: values.model || defaultModel("ANTHROPIC"),
                  max_tokens: 10,
                  messages: [
                    {
                      role: "user",
                      content: "Say 'Success' if you can read this.",
                    },
                  ],
                }
              : {
                  model: values.model || defaultModel(values.type),
                  messages: [
                    {
                      role: "user",
                      content: "Say 'Success' if you can read this.",
                    },
                  ],
                },
        ),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `${response.status} ${response.statusText}${errorData.error?.message ? `: ${errorData.error.message}` : ""}`,
        );
      }

      showSuccess(
        t("aiProviders.dialog.testOk", {
          defaultValue: "Connection test successful!",
        }),
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("ERR_FAILED")
      ) {
        showError(
          t("aiProviders.dialog.corsBlocked", {
            defaultValue:
              "Connection failed: Likely a CORS block. Some providers restricted direct browser access. Consider a proxy or another provider.",
          }),
        );
      } else {
        showError(
          t("aiProviders.dialog.testFailed", {
            message: errorMessage,
            defaultValue: "Connection failed: {{message}}",
          }),
        );
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Keys stay in this device's local storage and never enter a backup.
  const saveKey = (providerId: string) => {
    if (apiKey.trim()) writeAiApiKeyToStorage(providerId, apiKey.trim());
    else removeAiApiKeyFromStorage(providerId);
  };

  const onSubmit = async (values: z.infer<FormSchema>) => {
    if (
      !localOk &&
      (isLoopbackUrl(values.baseUrl) || isPrivateNetworkUrl(values.baseUrl))
    ) {
      showError(
        t("aiHub.dialog.noLocalNetworkHere", {
          defaultValue:
            "A model on your own computer or home network works in the Mac app only.",
        }),
      );
      return;
    }
    try {
      if (provider) {
        await dataProvider.updateAIProvider({
          ...values,
          id: provider.id,
        });
        saveKey(provider.id);
        showSuccess(
          t("aiProviders.dialog.updated", {
            defaultValue: "AI Provider updated successfully!",
          }),
        );
      } else {
        const created = await dataProvider.addAIProvider(values);
        saveKey(created.id);
        showSuccess(
          t("aiProviders.dialog.added", {
            defaultValue: "AI Provider added successfully!",
          }),
        );
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      showError(
        t("aiProviders.dialog.error", {
          message: error instanceof Error ? error.message : String(error),
          defaultValue: "Error: {{message}}",
        }),
      );
    }
  };

  const watchedType = form.watch("type");
  const watchedModel = form.watch("model");
  // Where no local model can exist, a custom provider is a hosted service
  // and is worded like one.
  const keyNeeded = providerNeedsApiKey({ type: watchedType }) || !localOk;
  const sectionTitle = "text-sm font-semibold";
  const hint = "text-xs text-muted-foreground";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Header and footer stay put; only the fields scroll on short screens. */}
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1.5rem)] flex-col gap-0 p-0 sm:max-w-[540px]">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle>
            {provider
              ? t("aiProviders.dialog.titleEdit", {
                  defaultValue: "Edit AI Provider",
                })
              : t("aiProviders.dialog.titleAdd", {
                  defaultValue: "Add AI Provider",
                })}
          </DialogTitle>
          <DialogDescription>
            {t("aiHub.dialog.intro", {
              defaultValue:
                "Say where the AI is, pick a model, then test it. Three short steps.",
            })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
              <section className="space-y-4">
                <h3 className={sectionTitle}>
                  {t("aiHub.dialog.stepWhere", {
                    defaultValue: "1. Where the AI is",
                  })}
                </h3>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("aiHub.dialog.kind", { defaultValue: "Provider" })}
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          const newType = value as keyof typeof PROVIDER_DOCS;
                          field.onChange(newType);

                          // Auto-fill endpoint if current is empty or matches another provider's default
                          const currentUrl = form.getValues("baseUrl");
                          const isDefaultUrl = Object.values(
                            PROVIDER_DOCS,
                          ).some((d) => d.endpoint === currentUrl);
                          if (!currentUrl || isDefaultUrl) {
                            form.setValue(
                              "baseUrl",
                              PROVIDER_DOCS[newType].endpoint,
                            );
                          }
                          // Another provider has other models.
                          setModels([]);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="text-left [&>span]:text-left">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {localOk && (
                            <SelectItem value="CUSTOM">
                              {t("aiHub.dialog.customOption", {
                                defaultValue:
                                  "A model on my computer (OpenAI-compatible)",
                              })}
                            </SelectItem>
                          )}
                          <SelectItem value="OPENAI">OpenAI</SelectItem>
                          <SelectItem value="GEMINI">Google Gemini</SelectItem>
                          <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                          <SelectItem value="MISTRAL">Mistral</SelectItem>
                          <SelectItem value="PERPLEXITY">Perplexity</SelectItem>
                          {/* On a phone the same type is still useful for a
                              hosted service; it just is not called local. */}
                          {!localOk && (
                            <SelectItem value="CUSTOM">
                              {t("aiHub.dialog.customHosted", {
                                defaultValue:
                                  "Another OpenAI-compatible service",
                              })}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {!localOk && (
                        <p className="text-xs text-muted-foreground">
                          {t("aiHub.dialog.localMacOnly", {
                            defaultValue:
                              "Models running on your own computer or home network, such as LM Studio or Ollama, work in the Mac app only.",
                          })}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("aiProviders.dialog.name", {
                          defaultValue: "Provider Name",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("aiProviders.dialog.namePlaceholder", {
                            defaultValue: "e.g., Local Llama, Mistral Beta",
                          })}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("aiProviders.dialog.baseUrl", {
                          defaultValue: "Base URL (Endpoint)",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://api.openai.com/v1"
                          inputMode="url"
                          autoCapitalize="none"
                          spellCheck={false}
                          {...field}
                        />
                      </FormControl>
                      <p className={hint}>
                        {keyNeeded
                          ? t("aiHub.dialog.urlHintHosted", {
                              defaultValue:
                                "Filled in for you. Change it only if you use a proxy.",
                            })
                          : t("aiHub.dialog.urlHintLocal", {
                              defaultValue:
                                "The address your model server shows. LM Studio uses http://localhost:1234/v1 and Ollama http://localhost:11434/v1.",
                            })}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label htmlFor="ai-provider-api-key">
                    {keyNeeded
                      ? t("aiHub.dialog.apiKey", { defaultValue: "API key" })
                      : t("aiHub.dialog.apiKeyOptional", {
                          defaultValue:
                            "API key (not needed for a local model)",
                        })}
                  </Label>
                  <Input
                    id="ai-provider-api-key"
                    name="apiKey"
                    type="password"
                    autoComplete="off"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={
                      keyNeeded
                        ? t("aiHub.dialog.apiKeyPlaceholder", {
                            defaultValue: "Paste your key",
                          })
                        : t("aiHub.dialog.apiKeyBlank", {
                            defaultValue: "Leave blank",
                          })
                    }
                  />
                  <p className={hint}>
                    {t("aiHub.dialog.apiKeyHint", {
                      defaultValue:
                        "Stored on this device only. It is never included in backups or exports.",
                    })}{" "}
                    {keyNeeded && PROVIDER_DOCS[watchedType]?.url && (
                      <a
                        href={PROVIDER_DOCS[watchedType].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4 hover:text-foreground"
                      >
                        {t("aiHub.dialog.docs", {
                          defaultValue: "Provider documentation",
                        })}
                      </a>
                    )}
                  </p>
                </div>
              </section>

              <section className="space-y-4 border-t pt-5">
                <h3 className={sectionTitle}>
                  {t("aiHub.dialog.stepModel", {
                    defaultValue: "2. Which model",
                  })}
                </h3>
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => {
                    const showList = models.length > 0 && !typeModelByHand;
                    // Keep a model that was typed earlier selectable.
                    const options =
                      field.value && !models.includes(field.value)
                        ? [field.value, ...models]
                        : models;
                    return (
                      <FormItem>
                        <div className="flex items-center justify-between gap-2">
                          <FormLabel>
                            {t("aiHub.dialog.model", { defaultValue: "Model" })}
                          </FormLabel>
                          {form.watch("type") !== "PERPLEXITY" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              disabled={isLoadingModels}
                              onClick={handleLoadModels}
                            >
                              {isLoadingModels && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              {isLoadingModels
                                ? t("aiProviders.dialog.loadingModels", {
                                    defaultValue: "Loading…",
                                  })
                                : t("aiProviders.dialog.loadModels", {
                                    defaultValue: "Load models",
                                  })}
                            </Button>
                          )}
                        </div>
                        {showList ? (
                          <Select
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("aiHub.dialog.selectModel", {
                                    defaultValue: "Select your model",
                                  })}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {options.map((id) => (
                                <SelectItem key={id} value={id}>
                                  {id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <FormControl>
                            <Input
                              placeholder={
                                defaultModel(form.watch("type")) ??
                                t("aiProviders.dialog.modelPlaceholder", {
                                  defaultValue: "e.g., gpt-4o, llama3",
                                })
                              }
                              {...field}
                            />
                          </FormControl>
                        )}
                        <p
                          className="text-xs text-muted-foreground"
                          aria-live="polite"
                        >
                          {showList ? (
                            <>
                              {t("aiHub.dialog.modelsFoundHint", {
                                count: models.length,
                                defaultValue:
                                  "{{count}} models found. Select the one to use from the list above.",
                              })}{" "}
                              <button
                                type="button"
                                className="underline underline-offset-4 hover:text-foreground"
                                onClick={() => setTypeModelByHand(true)}
                              >
                                {t("aiHub.dialog.typeInstead", {
                                  defaultValue: "Type a model name instead",
                                })}
                              </button>
                            </>
                          ) : (
                            t("aiHub.dialog.modelHint", {
                              defaultValue:
                                "Click Load models to pick from a list, or type a model name. Leave it blank to use the provider's default.",
                            })
                          )}
                        </p>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                {looksLikeEmbeddingModel(watchedModel) && (
                  <p className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      aria-hidden
                    />
                    {t("aiHub.providers.embeddingNote", {
                      defaultValue:
                        "This looks like an embedding model, which cannot answer questions or suggest categories. Pick a chat model instead.",
                    })}
                  </p>
                )}
              </section>

              <section className="space-y-4 border-t pt-5">
                <h3 className={sectionTitle}>
                  {t("aiHub.dialog.stepUse", {
                    defaultValue: "3. Use it",
                  })}
                </h3>
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          {t("aiHub.dialog.useThis", {
                            defaultValue: "Use this provider in the app",
                          })}
                        </FormLabel>
                        <p className={hint}>
                          {t("aiHub.dialog.useThisHint", {
                            defaultValue:
                              "Auto-categorize uses one provider at a time.",
                          })}
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("aiProviders.dialog.description", {
                          defaultValue: "Description (Optional)",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          className="min-h-0"
                          placeholder={t(
                            "aiProviders.dialog.descriptionPlaceholder",
                            { defaultValue: "Notes about this endpoint..." },
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>
            </div>

            <DialogFooter className="flex-row items-center justify-between gap-2 border-t px-5 py-3 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="gap-2"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-400" />
                )}
                {t("aiProviders.dialog.testConnection", {
                  defaultValue: "Test Connection",
                })}
              </Button>
              <Button type="submit">
                {t("aiProviders.dialog.save", {
                  defaultValue: "Save Provider",
                })}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditAIProviderDialog;
