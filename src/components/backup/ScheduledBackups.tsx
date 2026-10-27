import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  FolderOpen,
  Play,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { parseFrequency, formatFrequency } from "@/utils/frequencyParser";
import { showSuccess, showError } from "@/utils/toast";
import { BackupConfig } from "@/types/dataProvider";
import { useDataProvider } from "@/context/DataProviderContext";

import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";
import { getElectronAPI } from "@/utils/electron";
import { selectSyncDirectory } from "@/utils/fs-adapter";
import { Capacitor } from "@capacitor/core";

// Fading Undo Component
const FadingUndo: React.FC<{ onUndo: () => void }> = ({ onUndo }) => {
  const [opacity, setOpacity] = React.useState(1);

  React.useEffect(() => {
    const timer = setTimeout(() => setOpacity(0), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onUndo();
      }}
      style={{
        transition: "opacity 15000ms linear", // 15 seconds
        opacity: opacity,
        cursor: "pointer",
        textDecoration: "underline",
        marginLeft: "8px",
        fontWeight: 600,
        color: "#3b82f6",
      }}
      className="hover:underline"
    >
      Undo
    </span>
  );
};

const ScheduledBackups = () => {
  const dataProvider = useDataProvider();
  const [frequencyInput, setFrequencyInput] = React.useState("");
  const [isEncrypted, setIsEncrypted] = React.useState(false);
  const [password, setPassword] = React.useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dirHandle, setDirHandle] = React.useState<any>(null); // FileSystemDirectoryHandle
  const [backupPath, setBackupPath] = React.useState<string | null>(null); // Electron Path

  const { toast, dismiss } = useToast();
  const lastToastIdRef = React.useRef<string | null>(null);
  const undoStackRef = React.useRef<
    {
      id: string; // Action ID
      type: "DELETE_BACKUP";
      payload: { id: string };
      timeoutId: NodeJS.Timeout;
    }[]
  >([]);

  const [hiddenBackupIds, setHiddenBackupIds] = React.useState<Set<string>>(
    new Set(),
  );

  const parsedFreq = React.useMemo(
    () => parseFrequency(frequencyInput),
    [frequencyInput],
  );

  const [backups, setBackups] = React.useState<BackupConfig[]>([]);

  // Undo Function
  const undoLastAction = React.useCallback(() => {
    if (lastToastIdRef.current) {
      dismiss(lastToastIdRef.current);
      lastToastIdRef.current = null;
    }

    const lastAction = undoStackRef.current.pop();
    if (!lastAction) return;

    clearTimeout(lastAction.timeoutId);

    if (lastAction.type === "DELETE_BACKUP") {
      setHiddenBackupIds((prev) => {
        const next = new Set(prev);
        next.delete(lastAction.payload.id);
        return next;
      });
      showSuccess("Deletion undone.");
    }
  }, [dismiss]);

  // Keyboard Shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoLastAction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undoLastAction]);

  const displayBackups = React.useMemo(() => {
    return backups.filter((b) => !hiddenBackupIds.has(b.id));
  }, [backups, hiddenBackupIds]);

  React.useEffect(() => {
    const fetchBackups = async () => {
      const result = await dataProvider.getBackupConfigs();
      setBackups(result);
    };
    fetchBackups();
    const interval = setInterval(fetchBackups, 2000); // Poll every 2s to see updates
    return () => clearInterval(interval);
  }, [dataProvider]);

  const handleSelectFolder = async () => {
    try {
      const result = await selectSyncDirectory();
      if (result) {
        if (typeof result === "string") {
          setBackupPath(result);
          setDirHandle(null);
        } else {
          setDirHandle(result);
          setBackupPath(null);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name !== "AbortError") {
        showError("Failed to select folder: " + error.message);
      }
    }
  };

  const handleCreateBackup = async () => {
    if (!parsedFreq) {
      showError(
        "Please enter a valid frequency (e.g., '1h', '1 day'). Minimum 1 minute.",
      );
      return;
    }
    if (!dirHandle && !backupPath) {
      showError("Please select a folder for backups.");
      return;
    }
    if (isEncrypted && !password) {
      showError("Please enter a password for encryption.");
      return;
    }

    try {
      const newBackup: BackupConfig = {
        id: uuidv4(),
        frequency: parsedFreq,
        isActive: true,
        nextBackup: new Date(Date.now() + parsedFreq).toISOString(),
        directoryHandle: dirHandle || undefined,
        path: backupPath || undefined,
        encrypted: isEncrypted,
        // For now, we store the password in the config to allow fully automated background backups.
        // In a real production app, we might want to store a derived key or handle this more securely,
        // but for this local-first requirement where users want "set and forget", this is the tradeoff.
        // We'll store a hash or the raw password?
        // The requirement says "checkbox... enable a password field".
        // To run in background without prompting, we effectively need the secret.
        passwordHash: isEncrypted ? password : undefined,
      };

      await dataProvider.addBackupConfig(newBackup);
      showSuccess("Scheduled backup created!");

      // Reset form
      setFrequencyInput("");
      setPassword("");
      setIsEncrypted(false);
      setDirHandle(null);
      setBackupPath(null);
    } catch (e: unknown) {
      showError("Failed to create backup schedule: " + (e as Error).message);
    }
  };

  const verifyPermission = async (backup: BackupConfig) => {
    if (backup.path) return; // Electron doesn't need permission
    if (!backup.directoryHandle) return;
    try {
      const mode = { mode: "readwrite" };

      const handle = backup.directoryHandle;

      // Check first

      if (
        (await (
          handle as unknown as {
            queryPermission: (m: unknown) => Promise<string>;
          }
        ).queryPermission(mode)) === "granted"
      ) {
        showSuccess("Permission is already granted.");
        return;
      }

      // Request

      if (
        (await (
          handle as unknown as {
            requestPermission: (m: unknown) => Promise<string>;
          }
        ).requestPermission(mode)) === "granted"
      ) {
        showSuccess("Permission granted! Backups will resume.");
      } else {
        showError("Permission denied. Backups cannot run.");
      }
    } catch (e: unknown) {
      showError("Error checking permission: " + (e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    // 1. Soft Delete: Hide immediately
    setHiddenBackupIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // 2. Schedule Permanent Delete (15 seconds)
    const timeoutId = setTimeout(async () => {
      await dataProvider.deleteBackupConfig(id);

      // Clean up stack
      undoStackRef.current = undoStackRef.current.filter(
        (a) => a.timeoutId !== timeoutId,
      );

      // Clean up hidden list (optional, but good for cleanup)
      setHiddenBackupIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 15000);

    // 3. Push to Undo Stack
    undoStackRef.current.push({
      id: uuidv4(),
      type: "DELETE_BACKUP",
      payload: { id },
      timeoutId,
    });

    // 4. Show Toast
    const { id: toastId } = toast({
      title: "Scheduled Backup Deleted",
      description: (
        <div className="flex items-center">
          <span>Backup schedule removed.</span>
          <FadingUndo onUndo={undoLastAction} />
        </div>
      ),
      duration: 15000,
    });
    lastToastIdRef.current = toastId;
  };

  return (
    <div className="space-y-6">
      {!Capacitor.isNativePlatform() &&
        !("showDirectoryPicker" in window) &&
        !getElectronAPI() && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Browser Not Supported
            </div>
            <p className="mt-1 text-sm">
              Scheduled backups require the File System Access API
              (Chrome/Edge/Opera), the Desktop App, or a Native Mobile App.
            </p>
          </div>
        )}

      <Card
        className={
          !Capacitor.isNativePlatform() &&
          !("showDirectoryPicker" in window) &&
          !getElectronAPI()
            ? "opacity-60 pointer-events-none"
            : ""
        }
      >
        <CardHeader>
          <CardTitle>Create Scheduled Backup</CardTitle>
          <CardDescription>
            Automatically back up your data to a local folder.
            <br />
            <span className="text-muted-foreground font-medium flex items-center gap-1 mt-1">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Backups run automatically in the background while the application
              is running.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="freq">Frequency</Label>
              <div className="flex gap-2">
                <Input
                  id="freq"
                  placeholder="e.g. 7m, 1h, 1 day"
                  value={frequencyInput}
                  onChange={(e) => setFrequencyInput(e.target.value)}
                  disabled={
                    !Capacitor.isNativePlatform() &&
                    !("showDirectoryPicker" in window) &&
                    !getElectronAPI()
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Parsed: {parsedFreq ? formatFrequency(parsedFreq) : "Invalid"}{" "}
                (Min: 1m)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Target Folder</Label>
              <div className="flex gap-2">
                <Button
                  variant={dirHandle ? "secondary" : "outline"}
                  onClick={handleSelectFolder}
                  className="w-full justify-start"
                  disabled={
                    !Capacitor.isNativePlatform() &&
                    !("showDirectoryPicker" in window) &&
                    !getElectronAPI()
                  }
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {backupPath
                    ? backupPath
                    : dirHandle
                      ? dirHandle.name
                      : "Select Folder"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="encrypt"
              checked={isEncrypted}
              onCheckedChange={(c: boolean | string) =>
                setIsEncrypted(c === true)
              }
              disabled={
                !Capacitor.isNativePlatform() &&
                !("showDirectoryPicker" in window) &&
                !getElectronAPI()
              }
            />
            <Label htmlFor="encrypt">Encrypt Backup</Label>
          </div>

          {isEncrypted && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="password">Backup Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter encryption password"
                disabled={
                  !Capacitor.isNativePlatform() &&
                  !("showDirectoryPicker" in window) &&
                  !getElectronAPI()
                }
              />
            </div>
          )}

          <Button
            onClick={handleCreateBackup}
            disabled={
              !parsedFreq ||
              (!dirHandle && !backupPath) ||
              (isEncrypted && !password) ||
              (!Capacitor.isNativePlatform() &&
                !("showDirectoryPicker" in window) &&
                !getElectronAPI())
            }
          >
            <Play className="mr-2 h-4 w-4" />
            Start Scheduled Backup
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {displayBackups.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No active backups.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Config ID</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Encryption</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayBackups.map((b: BackupConfig) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">
                      {b.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{formatFrequency(b.frequency)}</TableCell>
                    <TableCell>
                      {b.path ? (
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3 text-muted-foreground" />
                          <span
                            className="font-mono text-xs truncate max-w-[150px]"
                            title={b.path}
                          >
                            {b.path}
                          </span>
                        </div>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help underline decoration-dotted underline-offset-4 decoration-muted-foreground/30">
                              <FolderOpen className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[120px]">
                                {(
                                  b.directoryHandle as FileSystemDirectoryHandle
                                )?.name || "Unknown"}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">
                              {
                                (b.directoryHandle as FileSystemDirectoryHandle)
                                  ?.name
                              }
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Full path is hidden by browser security.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.encrypted ? (
                        <Badge variant="default">Encrypted</Badge>
                      ) : (
                        <Badge variant="secondary">Plain</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center">
                            {b.isActive ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {b.isActive ? (
                            <p>Backup active and permission granted.</p>
                          ) : (
                            <p>
                              Backup disabled. Info: Folder missing or
                              permission denied.
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {b.isActive ? (
                        <>
                          {new Date(b.nextBackup).toLocaleString()}
                          {b.lastBackup && (
                            <div className="text-xs text-muted-foreground">
                              Last:{" "}
                              {new Date(b.lastBackup).toLocaleTimeString()}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">NA</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!b.path && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => verifyPermission(b)}
                              className="text-amber-500 hover:text-amber-600"
                              aria-label="Verify permission"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Verify permission</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(b.id)}
                            className="text-red-500 hover:text-red-600"
                            aria-label="Delete schedule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete schedule</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduledBackups;
