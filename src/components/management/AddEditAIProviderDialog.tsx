import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { useDataProvider } from "@/context/DataProviderContext";
import { AIProvider } from "@/types/dataProvider";
import { buildGeminiUrl } from "@/hooks/useAutoCategorize";
import { readAiApiKeyFromStorage } from "@/constants/aiApiKeyStorage";
import { Loader2, CheckCircle2 } from "lucide-react";
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
}

const AddEditAIProviderDialog: React.FC<AddEditAIProviderDialogProps> = ({
  isOpen,
  onOpenChange,
  provider,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const dataProvider = useDataProvider();
  const formSchema = React.useMemo(() => buildFormSchema(t), [t]);

  const form = useForm<z.infer<FormSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "CUSTOM",
      baseUrl: "",
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
        type: "CUSTOM",
        baseUrl: "",
        model: "",
        description: "",
        isDefault: false,
      });
    }
  }, [provider, form, isOpen]);

  const [isTesting, setIsTesting] = React.useState(false);

  const handleTestConnection = async () => {
    const values = form.getValues();
    const apiKey = provider?.id ? readAiApiKeyFromStorage(provider.id) : "";

    if (!apiKey) {
      showError(
        t("aiProviders.dialog.needKey", {
          defaultValue:
            "Please save the provider and set an API key in Settings first to test.",
        }),
      );
      return;
    }

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
            ? { Authorization: `Bearer ${apiKey}` }
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
                  model: values.model || "claude-3-haiku-20240307",
                  max_tokens: 10,
                  messages: [
                    {
                      role: "user",
                      content: "Say 'Success' if you can read this.",
                    },
                  ],
                }
              : {
                  model:
                    values.model ||
                    (values.type === "OPENAI" ? "gpt-4o" : undefined),
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

  const onSubmit = async (values: z.infer<FormSchema>) => {
    try {
      if (provider) {
        await dataProvider.updateAIProvider({
          ...values,
          id: provider.id,
        });
        showSuccess(
          t("aiProviders.dialog.updated", {
            defaultValue: "AI Provider updated successfully!",
          }),
        );
      } else {
        await dataProvider.addAIProvider(values);
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
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
            {provider
              ? t("aiProviders.dialog.descriptionEdit", {
                  defaultValue:
                    "Update the configuration for this AI model provider.",
                })
              : t("aiProviders.dialog.descriptionAdd", {
                  defaultValue:
                    "Add a new AI endpoint for auto-categorization.",
                })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("aiProviders.dialog.apiType", {
                        defaultValue: "API Type",
                      })}
                    </FormLabel>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value}
                      onChange={(e) => {
                        const newType = e.target
                          .value as keyof typeof PROVIDER_DOCS;
                        field.onChange(newType);

                        // Auto-fill endpoint if current is empty or matches another provider's default
                        const currentUrl = form.getValues("baseUrl");
                        const isDefaultUrl = Object.values(PROVIDER_DOCS).some(
                          (d) => d.endpoint === currentUrl,
                        );
                        if (!currentUrl || isDefaultUrl) {
                          form.setValue(
                            "baseUrl",
                            PROVIDER_DOCS[newType].endpoint,
                          );
                        }
                      }}
                    >
                      <option value="OPENAI">OpenAI</option>
                      <option value="GEMINI">Google Gemini</option>
                      <option value="ANTHROPIC">Anthropic</option>
                      <option value="MISTRAL">Mistral</option>
                      <option value="PERPLEXITY">Perplexity</option>
                      <option value="CUSTOM">
                        {t("aiProviders.dialog.customOption", {
                          defaultValue: "Custom (OpenAI Compatible)",
                        })}
                      </option>
                    </select>
                    {PROVIDER_DOCS[field.value as keyof typeof PROVIDER_DOCS]
                      ?.url && (
                      <a
                        href={
                          PROVIDER_DOCS[
                            field.value as keyof typeof PROVIDER_DOCS
                          ].url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-500 hover:underline inline-block mt-1"
                      >
                        {t("aiProviders.dialog.docs", {
                          defaultValue: "View Documentation & Models →",
                        })}
                      </a>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("aiProviders.dialog.model", {
                        defaultValue: "Model ID (Optional)",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("aiProviders.dialog.modelPlaceholder", {
                          defaultValue: "e.g., gpt-4o, llama3",
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    <Input placeholder="https://api.openai.com/v1" {...field} />
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground">
                    {t("aiProviders.dialog.baseUrlHint", {
                      defaultValue:
                        "Ensure this URL is allowed in the CSP or proxy if required.",
                    })}
                  </p>
                  <FormMessage />
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

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t("aiProviders.dialog.setDefault", {
                        defaultValue: "Set as default provider",
                      })}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between items-center sm:justify-between">
              <div className="flex gap-2">
                {provider && (
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
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {t("aiProviders.dialog.testConnection", {
                      defaultValue: "Test Connection",
                    })}
                  </Button>
                )}
              </div>
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
