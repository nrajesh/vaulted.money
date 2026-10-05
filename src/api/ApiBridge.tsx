import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDataProvider } from "@/context/DataProviderContext";
import { useLedger } from "@/contexts/LedgerContext";
import { getElectronAPI } from "@/utils/electron";
import { handleApiRequest } from "./handleRequest";
import type { ApiRequest, ApiResponse } from "./http";

/**
 * Headless component that lets the Electron main process drive the data layer.
 *
 * The main process owns the HTTP socket but cannot touch IndexedDB, so it relays
 * each authorised request here. We run it through the same DataProvider the UI
 * uses, answer over IPC, then refresh whatever the open UI is showing.
 */
const ApiBridge = () => {
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();
  const { refreshLedgers } = useLedger();

  useEffect(() => {
    const electron = getElectronAPI();
    if (!electron?.onApiRequest) return;

    return electron.onApiRequest(async (id, raw) => {
      const request = raw as ApiRequest;
      const response: ApiResponse = await handleApiRequest(request, {
        dataProvider,
      });
      // `reloadUi` is a renderer-side hint, not part of the HTTP response.
      const { reloadUi, ...payload } = response;
      electron.sendApiResponse(id, payload);

      if (request.method === "GET" || response.status >= 400) return;
      // Keep the open UI in step with what the API just changed.
      await queryClient.invalidateQueries();
      await refreshLedgers();
      if (reloadUi) window.setTimeout(() => window.location.reload(), 250);
    });
  }, [dataProvider, queryClient, refreshLedgers]);

  return null;
};

export default ApiBridge;
