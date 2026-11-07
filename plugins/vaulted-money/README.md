# Vaulted Money plugin for Claude

Ask Claude about your money. Claude talks to the Vaulted Money desktop app on your own computer, and the plugin itself uploads nothing.

## What you get

- **Spending review**: where your money went, top categories and vendors.
- **Budget check**: what is over, what is left.
- **Import bank CSV**: preview first, import only when you say yes.
- Twelve tools behind the scenes for finding transactions, adding one or many, checking budget history, working out a loan payoff, and reaching any other part of the app.

## Before you start

1. Install the Vaulted Money desktop app and open it.
2. Go to **Settings → Local API → Connect an AI agent** (opens the Connect to agent page) and switch on **Allow agents to connect**.
3. You need [Node.js](https://nodejs.org/) 18 or newer. (The Claude Desktop bundle does not need it.)

## Install

The easiest way is the **Connect agent** page in the Vaulted Money desktop app: choose **Claude Code** and click **Set up Claude Code for me**.

Or type these inside Claude Code:

```
/plugin marketplace add nrajesh/vaulted.money
/plugin install vaulted-money@vaulted-money
```

In a normal terminal, start each with `claude` instead: `claude plugin marketplace add nrajesh/vaulted.money`.

Then ask, for example: "Where is my money going this month?"

## Good to know

- The desktop app must be running (it can sit in the tray).
- Changes (adding, deleting, importing) ask you first. Keep Claude's approval prompts on.
- Your access token is never shown to Claude. **Disconnect everything** in the same panel switches the Local API off and replaces the token, which cuts off every connected agent and script until you switch it on again. They then reconnect on their own.
- **Privacy, honestly:** when you ask a question, the answers the app returns (for example transactions, vendors and balances) are read by Claude to write its reply. That means they are sent to Anthropic, like anything else you type into Claude. Only ask about data you are happy to share that way. If you want everything to stay on your device, use a local model with the same server instead (see [mcp/README.md](../../mcp/README.md)).
- Works in Claude Code (terminal, desktop app's Code tab, IDE). It does not work in the claude.ai website, which cannot reach software on your computer.

More detail: [mcp/README.md](../../mcp/README.md).
