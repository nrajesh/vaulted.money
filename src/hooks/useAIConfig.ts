import { useState, useEffect, useCallback } from "react";
import { AIProvider } from "@/types/dataProvider";
import { useDataProvider } from "@/context/DataProviderContext";
import { useAiFeatures } from "@/hooks/useAiFeatures";
import {
  readAiApiKeyFromStorage,
  writeAiApiKeyToStorage,
} from "@/constants/aiApiKeyStorage";

export interface AIConfig {
  provider: AIProvider | null;
  apiKey: string;
}

const EMPTY_CONFIG: AIConfig = { provider: null, apiKey: "" };

export const useAIConfig = () => {
  const dataProvider = useDataProvider();
  const { enabled: aiEnabled } = useAiFeatures();
  const [config, setConfig] = useState<AIConfig>({
    provider: null,
    apiKey: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const providers = await dataProvider.getAIProviders();
      const activeProvider = providers.find((p) => p.isDefault) || null;

      let apiKey = "";
      if (activeProvider) {
        apiKey = readAiApiKeyFromStorage(activeProvider.id);
      }

      setConfig({
        provider: activeProvider,
        apiKey,
      });
    } catch (error) {
      console.error("Failed to load AI config", error);
    } finally {
      setIsLoading(false);
    }
  }, [dataProvider]);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const saveConfig = async (providerId: string, newApiKey: string) => {
    writeAiApiKeyToStorage(providerId, newApiKey);
    await refreshConfig();
  };

  return {
    // With AI features off, no provider is active, so every AI button hides.
    config: aiEnabled ? config : EMPTY_CONFIG,
    saveConfig,
    refreshConfig,
    isLoading,
  };
};
