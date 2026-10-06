import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as Security from "./security";
import { ApiServer, type RelayRequest, type RelayResponse } from "./apiServer";
import { DEFAULT_API_PORT, generateToken, isValidPort } from "./apiAuth";

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;
let authorizedBackupFolders = new Set<string>();

// --- Local REST API -------------------------------------------------------
// Opt-in and loopback-only. The server lives here; the data lives in the
// renderer, so requests are relayed to it over IPC (see src/api/ApiBridge).
interface ApiConfig {
  enabled: boolean;
  port: number;
  token: string;
}

const API_RELAY_TIMEOUT_MS = 2 * 60 * 1000;
const pendingApiRequests = new Map<
  string,
  { resolve: (r: RelayResponse) => void; timer: NodeJS.Timeout }
>();
let apiRequestCounter = 0;
let apiConfig: ApiConfig = {
  enabled: false,
  port: DEFAULT_API_PORT,
  token: "",
};

const apiConfigPath = () =>
  path.join(app.getPath("userData"), "api-config.json");

function loadApiConfig(): ApiConfig {
  let stored: Partial<ApiConfig> = {};
  try {
    stored = JSON.parse(fs.readFileSync(apiConfigPath(), "utf-8"));
  } catch {
    // First run or unreadable file: fall through to defaults.
  }
  return {
    enabled: stored.enabled === true,
    port: isValidPort(stored.port) ? stored.port : DEFAULT_API_PORT,
    token:
      typeof stored.token === "string" && stored.token.length >= 32
        ? stored.token
        : generateToken(),
  };
}

function saveApiConfig() {
  // The token is a credential: keep the file private to the current user.
  fs.writeFileSync(apiConfigPath(), JSON.stringify(apiConfig, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
}

function relayToRenderer(request: RelayRequest): Promise<RelayResponse> {
  return new Promise((resolve) => {
    const target = mainWindow?.webContents;
    if (!target || target.isLoading()) {
      resolve({
        status: 503,
        body: {
          error: {
            code: "ui_not_ready",
            message: "The app is still starting; retry shortly",
          },
        },
      });
      return;
    }
    const id = String(++apiRequestCounter);
    const timer = setTimeout(() => {
      pendingApiRequests.delete(id);
      resolve({
        status: 504,
        body: {
          error: {
            code: "timeout",
            message: "The app did not respond in time",
          },
        },
      });
    }, API_RELAY_TIMEOUT_MS);
    pendingApiRequests.set(id, { resolve, timer });
    target.send("api:request", id, request);
  });
}

const apiServer = new ApiServer(relayToRenderer);

function apiStatus() {
  return {
    enabled: apiConfig.enabled,
    port: apiConfig.port,
    token: apiConfig.token,
    running: apiServer.running,
    url: `http://127.0.0.1:${apiConfig.port}/api/v1`,
  };
}

async function applyApiConfig(): Promise<string | null> {
  try {
    if (apiConfig.enabled) {
      await apiServer.start(apiConfig.port, apiConfig.token);
    } else {
      await apiServer.stop();
    }
    return null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api] Failed to apply configuration:", message);
    return message;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(
      `${process.env.VITE_DEV_SERVER_URL.replace(/\/$/, "")}/#/ledgers`,
    );
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/ledgers",
    });
  }

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      return false;
    }
  });
}

app.on("before-quit", () => {
  isQuitting = true;
  void apiServer.stop();
});

app.whenReady().then(() => {
  createWindow();

  // Initialize authorized folders from config
  const backupConfigPath = path.join(
    app.getPath("userData"),
    "backup-config.json",
  );
  authorizedBackupFolders = Security.loadAuthorizedFolders(backupConfigPath);

  // --- Local REST API wiring ---
  apiConfig = loadApiConfig();
  saveApiConfig();
  void applyApiConfig();

  ipcMain.on("api:response", (event, id: string, response: RelayResponse) => {
    // Only our own window may answer relayed requests.
    if (event.sender !== mainWindow?.webContents) return;
    const pending = pendingApiRequests.get(id);
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingApiRequests.delete(id);
    pending.resolve(response);
  });

  ipcMain.handle("api:get-config", () => apiStatus());

  ipcMain.handle(
    "api:set-config",
    async (_event, update: { enabled?: boolean; port?: number }) => {
      const previous = { ...apiConfig };
      if (typeof update?.enabled === "boolean")
        apiConfig.enabled = update.enabled;
      if (update?.port !== undefined) {
        if (!isValidPort(update.port)) {
          return {
            ...apiStatus(),
            error: "Port must be between 1024 and 65535",
          };
        }
        apiConfig.port = update.port;
      }
      const error = await applyApiConfig();
      if (error) {
        // Roll back so the stored config matches what is actually running.
        apiConfig = previous;
        await applyApiConfig();
      }
      saveApiConfig();
      return { ...apiStatus(), ...(error && { error }) };
    },
  );

  ipcMain.handle("api:regenerate-token", () => {
    apiConfig.token = generateToken();
    apiServer.setToken(apiConfig.token);
    saveApiConfig();
    return apiStatus();
  });

  ipcMain.handle("path-join", (_event, ...segments: unknown[]) => {
    if (!segments.every((segment) => typeof segment === "string")) {
      throw new Error("path-join expects string segments");
    }
    return path.join(...(segments as string[]));
  });

  ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled) return null;

    const selectedPath = result.filePaths[0];
    // SECURITY: Authorize the selected folder
    authorizedBackupFolders.add(selectedPath);
    Security.saveAuthorizedFolders(backupConfigPath, authorizedBackupFolders);

    return selectedPath;
  });

  ipcMain.handle(
    "write-backup-file",
    async (_event, folder: string, filename: string, content: string) => {
      try {
        // SECURITY: Prevent path traversal
        if (
          path.basename(filename) !== filename ||
          filename === ".." ||
          filename === "."
        ) {
          console.error(
            "Security alert: Attempted path traversal in filename",
            filename,
          );
          throw new Error("Invalid filename: Path traversal detected");
        }

        // SECURITY: Enforce file extension to prevent arbitrary file write
        if (
          !filename.endsWith(".json") &&
          !filename.endsWith(".lock") &&
          !filename.endsWith(".csv")
        ) {
          console.error("Security alert: Invalid file extension", filename);
          throw new Error(
            "Invalid filename: Only .json, .csv, and .lock files are allowed",
          );
        }

        // SECURITY: Validate folder authorization
        // Prevent arbitrary file writes to unauthorized locations
        if (!Security.isFolderAuthorized(folder, authorizedBackupFolders)) {
          console.error(
            "Security alert: Unauthorized backup folder attempt",
            folder,
          );
          throw new Error(
            "Unauthorized backup folder. Please re-select the folder in settings.",
          );
        }

        // Ensure directory exists
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true });
        }
        const filePath = path.join(folder, filename);
        await fs.promises.writeFile(filePath, content, "utf-8");
        return { success: true };
      } catch (error: unknown) {
        console.error("Backup write failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return { success: false, error: errorMessage };
      }
    },
  );

  ipcMain.handle("select-directory", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled) return null;

    const selectedPath = result.filePaths[0];
    authorizedBackupFolders.add(selectedPath);
    Security.saveAuthorizedFolders(backupConfigPath, authorizedBackupFolders);
    return selectedPath;
  });

  ipcMain.handle(
    "check-directory-access",
    async (_event, dirPath: string) => {
      try {
        await fs.promises.access(
          dirPath,
          fs.constants.R_OK | fs.constants.W_OK,
        );
        return true;
      } catch {
        return false;
      }
    },
  );

  ipcMain.handle("read-file", async (_event, filePath: string) => {
    const dir = path.dirname(filePath);
    if (!Security.isFolderAuthorized(dir, authorizedBackupFolders)) {
      throw new Error("Unauthorized file path");
    }
    return await fs.promises.readFile(filePath, "utf-8");
  });

  ipcMain.handle(
    "write-file",
    async (_event, filePath: string, content: string) => {
      const filename = path.basename(filePath);
      if (
        !filename.endsWith(".json") &&
        !filename.endsWith(".csv") &&
        !filename.endsWith(".lock")
      ) {
        throw new Error(
          "Invalid file extension: only .json, .csv, and .lock are allowed",
        );
      }
      const dir = path.dirname(filePath);
      if (!Security.isFolderAuthorized(dir, authorizedBackupFolders)) {
        throw new Error("Unauthorized file path");
      }
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await fs.promises.writeFile(filePath, content, "utf-8");
    },
  );

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
