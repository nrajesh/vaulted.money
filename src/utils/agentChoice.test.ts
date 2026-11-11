import { beforeEach, describe, expect, it } from "vitest";
import {
  agentChoiceForProvider,
  readAgentChoice,
  writeAgentChoice,
} from "./agentChoice";

describe("agentChoice", () => {
  beforeEach(() => localStorage.clear());

  it("matches the agent to the provider already in use", () => {
    expect(agentChoiceForProvider({ type: "CUSTOM" })).toBe("local");
    expect(agentChoiceForProvider({ type: "ANTHROPIC" })).toBe("claude-app");
    expect(agentChoiceForProvider({ type: "OPENAI" })).toBe("codex");
    expect(agentChoiceForProvider({ type: "GEMINI" })).toBeNull();
    expect(agentChoiceForProvider(null)).toBeNull();
  });

  it("remembers the last choice and ignores anything it does not know", () => {
    expect(readAgentChoice()).toBeNull();
    writeAgentChoice("codex");
    expect(readAgentChoice()).toBe("codex");
    localStorage.setItem("vaulted.agentChoice", "something-else");
    expect(readAgentChoice()).toBeNull();
  });
});
