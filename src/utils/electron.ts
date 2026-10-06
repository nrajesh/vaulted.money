export const isElectron = (): boolean => {
  return (
    typeof window !== "undefined" &&
    !!(window as unknown as { electron?: ElectronAPI }).electron
  );
};

export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  saveBackup: (
    folder: string,
    filename: string,
    content: string,
  ) => Promise<{ success: boolean; error?: string }>;
  selectDirectory: () => Promise<string | null>;
  checkDirectoryAccess: (path: string) => Promise<boolean>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  joinPath: (...paths: string[]) => Promise<string>;
  // Local REST API (desktop only)
  onApiRequest: (handler: (id: string, request: unknown) => void) => () => void;
  sendApiResponse: (id: string, response: unknown) => void;
  getApiConfig: () => Promise<ApiServerStatus>;
  setApiConfig: (update: {
    enabled?: boolean;
    port?: number;
  }) => Promise<ApiServerStatus>;
  regenerateApiToken: () => Promise<ApiServerStatus>;
}

export interface ApiServerStatus {
  enabled: boolean;
  port: number;
  token: string;
  running: boolean;
  url: string;
  error?: string;
}

export const getElectronAPI = (): ElectronAPI | null => {
  if (isElectron()) {
    return (window as unknown as { electron?: ElectronAPI }).electron || null;
  }
  return null;
};
