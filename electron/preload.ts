import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  saveBackup: (folder: string, filename: string, content: string) =>
    ipcRenderer.invoke("write-backup-file", folder, filename, content),
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  checkDirectoryAccess: (dirPath: string) =>
    ipcRenderer.invoke("check-directory-access", dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke("write-file", filePath, content),
  // A sandboxed preload cannot load Node's path module; main joins the paths.
  joinPath: (...paths: string[]) => ipcRenderer.invoke("path-join", ...paths),
  // Local REST API: the renderer executes requests the main process relays.
  onApiRequest: (
    handler: (id: string, request: unknown) => void,
  ): (() => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      id: string,
      request: unknown,
    ) => handler(id, request);
    ipcRenderer.on("api:request", listener);
    return () => ipcRenderer.removeListener("api:request", listener);
  },
  sendApiResponse: (id: string, response: unknown) =>
    ipcRenderer.send("api:response", id, response),
  getApiConfig: () => ipcRenderer.invoke("api:get-config"),
  setApiConfig: (update: { enabled?: boolean; port?: number }) =>
    ipcRenderer.invoke("api:set-config", update),
  regenerateApiToken: () => ipcRenderer.invoke("api:regenerate-token"),
});
