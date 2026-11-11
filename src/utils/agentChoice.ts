import type { AIProvider } from "@/types/dataProvider";

/** The ways to chat with your data that the Connect agent steps cover. */
export type AgentChoice = "claude-app" | "local" | "claude-code" | "codex";

const STORAGE_KEY = "vaulted.agentChoice";
const CHOICES: AgentChoice[] = ["claude-app", "local", "claude-code", "codex"];

/**
 * The agent that matches the AI provider already in use inside the app, so the
 * agent steps open on what the user set up instead of starting from scratch.
 * A custom endpoint is a model on this computer; the others map to the agent
 * made by the same company. Null when there is no obvious match.
 */
export const agentChoiceForProvider = (
  provider: Pick<AIProvider, "type"> | null | undefined,
): AgentChoice | null => {
  switch (provider?.type) {
    case "CUSTOM":
      return "local";
    case "ANTHROPIC":
      return "claude-app";
    case "OPENAI":
      return "codex";
    default:
      return null;
  }
};

/** The choice the user last picked on this device, if any. */
export const readAgentChoice = (): AgentChoice | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY) as AgentChoice | null;
    return value && CHOICES.includes(value) ? value : null;
  } catch {
    return null;
  }
};

export const writeAgentChoice = (choice: AgentChoice) => {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Not remembered; the page still works.
  }
};
