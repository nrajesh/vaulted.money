# Documentation map

There are a lot of Markdown files in this repository. This page shows what each one is for, who it is written for, and how they point at each other.

## Pick your path

```mermaid
flowchart LR
    Start(["📖 README<br/>start here"]):::hub

    subgraph Use["🙂 I want to use the app"]
        direction TB
        GS["Getting Started<br/>first run, first ledger"]:::ui
        UG["User Guide<br/>everyday workflows"]:::ui
        WHY["Why Vaulted Money<br/>the motivation"]:::ui
        SUP["Support<br/>getting help"]:::ui
    end

    subgraph Script["🔌 I want to script it or connect an agent"]
        direction TB
        API["Local API<br/>every endpoint"]:::data
        COOK["API Cookbook<br/>recipes"]:::data
        PM["Postman collection"]:::data
        MCP["MCP server<br/>for AI agents"]:::data
        PLUG["Claude Code plugin"]:::data
    end

    subgraph Build["🛠️ I want to build or change it"]
        direction TB
        SETUP["Setup and Builds<br/>every command"]:::logic
        DEV["Developer Guide<br/>project shape"]:::logic
        ARCH["Architecture<br/>how it fits together"]:::logic
        CONTRIB["Contributing<br/>+ Code Review<br/>+ Code of Conduct"]:::logic
    end

    subgraph Rules["📐 House rules and standards"]
        direction TB
        AGENT["AI agent rules<br/>CLAUDE.md"]:::native
        UX["UI/UX Standards<br/>+ Brand Design"]:::native
        I18N["Translations<br/>+ Demo Data"]:::native
        MOBILE["iOS and Android rules"]:::native
    end

    Start --> Use
    Start --> Script
    Start --> Build
    Build --> Rules

    style Use fill:none,stroke:#2563eb,stroke-width:2px
    style Script fill:none,stroke:#0f766e,stroke-width:2px
    style Build fill:none,stroke:#7c3aed,stroke-width:2px
    style Rules fill:none,stroke:#b45309,stroke-width:2px
    classDef ui fill:#2563eb,stroke:#93c5fd,stroke-width:2px,color:#ffffff
    classDef logic fill:#7c3aed,stroke:#c4b5fd,stroke-width:2px,color:#ffffff
    classDef data fill:#0f766e,stroke:#5eead4,stroke-width:2px,color:#ffffff
    classDef native fill:#b45309,stroke:#fcd34d,stroke-width:2px,color:#ffffff
    classDef hub fill:#0d1520,stroke:#2dd4bf,stroke-width:3px,color:#ffffff
    linkStyle default stroke:#64748b,stroke-width:2px
```

## Every page, by reader

### Using the app

| Page | What you get |
| --- | --- |
| [README](../README.md) | What the app is, a quick setup, and how to connect an AI agent. |
| [Getting Started](GETTING_STARTED.md) | A non-technical first run and first ledger. |
| [User Guide](USER_GUIDE.md) | The main workflows, screen by screen. |
| [Why Vaulted Money Exists](WHY_VAULTED_MONEY.md) | Motivation and privacy stance. |
| [Support](SUPPORT.md) | How to get help. |

### Scripting it and connecting agents

| Page | What you get |
| --- | --- |
| [Local API](API.md) | Reference for the desktop REST API: endpoints, filters, errors, security model. |
| [API Cookbook](API_COOKBOOK.md) | Recipes: month-end routines, using the app without the GUI, building your own interface. |
| [Postman collection](postman/README.md) | A ready-made collection that doubles as the API's test suite. |
| [MCP server](../mcp/README.md) | How an AI agent (Claude, Codex, a local model) reaches your ledger. |
| [Claude Code plugin](../plugins/vaulted-money/README.md) | The plugin and its skills (budget check, bank CSV import, spending review). |

### Building and changing it

| Page | What you get |
| --- | --- |
| [Setup and Builds](SETUP.md) | Every install, run and build command, with a picture of what each one produces. |
| [Developer Guide](DEVELOPER_GUIDE.md) | Project structure, quality checks, state and data conventions, deployment. |
| [Architecture](ARCHITECTURE.md) | Diagrams of the web, desktop and phone apps, search, the Local API and AI. |
| [Contributing](../CONTRIBUTING.md) | How to propose a change. |
| [Code Review](CODE_REVIEW.md) | What reviewers look for. |
| [Code of Conduct](../CODE_OF_CONDUCT.md) | How we treat each other. |
| [Security policy](../.github/SECURITY.md) | How to report a vulnerability. |

### House rules and standards

| Page | What you get |
| --- | --- |
| [AI agent rules](CLAUDE.md) | The rules an AI coding agent must follow here, and the lessons behind them. Useful for humans too. |
| [UI/UX Standards](UI_UX_STANDARDS.md) | Layout, contrast and interaction rules. |
| [Brand Design](DESIGN.md) | Logo geometry, colours and icon usage. |
| [Translations](I18N.md) | How text is translated into the five shipped languages. |
| [Demo Data](DEMO_DATA.md) | What "Generate demo data" creates and how to extend it. |
| [iOS rules](IOS_RULES.md) and [Android rules](ANDROID_RULES.md) | Platform-specific constraints. |
| [Migration Specs](MIGRATION_SPECS.md) | Notes for data migrations. |

### Behind the scenes

| Page | What you get |
| --- | --- |
| [Search demo video](../marketing/search-demo/README.md) | How the natural-language search video is recorded. |
| [API demo video](../marketing/api-demo/README.md) | How the Local API video is rendered. |
| [Launch kit](../marketing/LAUNCH_KIT.md) | Ready-to-post announcement copy and listing sites. |
| [`specs/`](../specs) | One folder per feature: the original spec and plan, kept as a history of decisions. |

## Which page links to which

Each arrow is a real link inside a page. A dotted arrow is a mention by file name without a link.

Two pages are left out of the picture because they point almost everywhere and would bury it: the **README** links to every page in the first three groups, and the **Developer Guide** links to Architecture, the API pages, the AI agent rules, both design pages, Why Vaulted Money and Support.

```mermaid
flowchart LR
    subgraph Use["Using the app"]
        direction TB
        UG["User Guide"]:::ui
        GS["Getting Started"]:::ui
        WHY["Why Vaulted Money"]:::ui
        SUP["Support"]:::ui
    end

    subgraph Build["Building"]
        direction TB
        SETUP["Setup and Builds"]:::logic
        ARCH["Architecture"]:::logic
        CONTRIB["Contributing"]:::logic
        CR["Code Review"]:::logic
    end

    subgraph Script["Scripts and agents"]
        direction TB
        COOK["API Cookbook"]:::data
        API["Local API"]:::hub
        PM["Postman"]:::data
        MCP["MCP server"]:::data
        PLUG["Claude Code plugin"]:::data
    end

    subgraph Rules["Rules and standards"]
        direction TB
        AGENT["AI agent rules"]:::native
        UX["UI/UX Standards"]:::native
        DESIGN["Brand Design"]:::native
        I18N["Translations"]:::native
        DEMO["Demo Data"]:::native
        IOS["iOS rules"]:::native
        AND["Android rules"]:::native
    end

    subgraph Mkt["Marketing"]
        direction TB
        AD["API demo"]:::out
        SD["Search demo"]:::out
    end

    UG --> API & COOK
    SETUP --> API & ARCH
    ARCH --> API & MCP & SETUP & IOS & AND
    CONTRIB --> CR

    API <--> COOK
    API <--> PM
    API <--> MCP
    COOK --> PM
    PLUG --> MCP
    PM --> AGENT

    UX --> DESIGN
    AGENT -.-> UX & I18N & DEMO & IOS & AND
    AGENT -.-> API

    AD --> API & MCP
    SD -.-> AGENT

    style Use fill:none,stroke:#2563eb,stroke-width:2px
    style Script fill:none,stroke:#0f766e,stroke-width:2px
    style Build fill:none,stroke:#7c3aed,stroke-width:2px
    style Rules fill:none,stroke:#b45309,stroke-width:2px
    style Mkt fill:none,stroke:#475569,stroke-width:2px
    classDef ui fill:#2563eb,stroke:#93c5fd,stroke-width:2px,color:#ffffff
    classDef logic fill:#7c3aed,stroke:#c4b5fd,stroke-width:2px,color:#ffffff
    classDef data fill:#0f766e,stroke:#5eead4,stroke-width:2px,color:#ffffff
    classDef native fill:#b45309,stroke:#fcd34d,stroke-width:2px,color:#ffffff
    classDef out fill:#334155,stroke:#94a3b8,stroke-width:2px,color:#ffffff
    classDef hub fill:#0d1520,stroke:#2dd4bf,stroke-width:3px,color:#ffffff
    linkStyle default stroke:#64748b,stroke-width:2px
```

Reading the picture: **Local API** (outlined) is the page most others lean on. Getting Started, Why Vaulted Money, Support, Translations, Demo Data and the platform rules are end points: they are linked to, but send you nowhere else. This map is the one place that lists them all.

## How commands turn into files

The build picture, command by command, lives in [Setup and Builds](SETUP.md#what-each-command-builds).
