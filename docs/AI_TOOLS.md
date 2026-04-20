# AI Tools — Kalakaarian Development Guide

Multi-AI setup for PWA development. All tools share the same project conventions via their respective context files.

## Tools

| Tool | Interface | Best for |
|---|---|---|
| **Claude Code** | `claude` CLI | Architecture, security, multi-file changes, complex logic |
| **RuFlo swarm** | Built into Claude Code | Parallel tasks (implement + test + docs simultaneously) |
| **GPT-4o** via opencode | `opencode` CLI | Quick UI components, Tailwind snippets, React boilerplate |
| **Gemini 2.5 Pro** via opencode | `opencode` CLI | Full codebase audit, Lighthouse review, large-context analysis |

---

## Install

```bash
# OpenCode CLI (supports Claude, GPT, Gemini in one terminal tool)
npm i -g opencode

# Google Gemini CLI (optional standalone)
npm i -g @google/gemini-cli

# Verify
opencode --version
gemini --version
```

---

## Configure API keys

Add to your `.env` (local) and Vercel project env (production):

```
# AI Development Tools (not used by the app — dev tools only)
ANTHROPIC_API_KEY=sk-ant-...      # Claude via opencode
OPENAI_API_KEY=sk-...             # GPT-4o via opencode
GEMINI_API_KEY=AIza...            # Gemini 2.5 Pro via opencode / gemini CLI
```

Also add these three lines to `.env.example` to document them for the team.

---

## Using OpenCode

```bash
# Start with default model (Claude Sonnet, from opencode.json)
opencode

# Switch model mid-session
/model openai/gpt-4o-mini          # GPT-4o for quick UI work
/model google/gemini-2.5-pro       # Gemini for full codebase review
/model anthropic/claude-sonnet-4-6 # Back to Claude

# Run a one-shot task
opencode run --model openai/gpt-4o-mini "Create a shadcn Card component for influencer stats"
```

The `opencode.json` at the project root auto-loads project instructions (CLAUDE.md rules) into every session regardless of which model you use.

---

## Using Gemini CLI

```bash
# Start Gemini session (reads GEMINI.md automatically)
gemini

# One-shot
gemini "Audit the PWA service worker caching strategy and suggest improvements"
```

`GEMINI.md` (root), `client/GEMINI.md`, and `server/GEMINI.md` are loaded automatically by the Gemini CLI.

---

## Using the RuFlo Multi-AI Workflow

The workflow at `.claude-flow/workflows/pwa-multi-ai.yaml` auto-routes tasks to the right provider:

```
# Inside Claude Code session — ask Claude to run the workflow
/workflow pwa-multi-ai "Add a push notification opt-in banner to the PWA"
```

The workflow classifies the task (ui-component → GPT, codebase-review → Gemini, architecture → Claude, parallel → swarm) and shells out to `opencode` for non-Claude models.

---

## Task routing cheat-sheet

| Task | Use |
|---|---|
| New React component or page | `opencode` → GPT-4o |
| Tailwind styling, layout tweaks | `opencode` → GPT-4o |
| Full audit of service worker / Workbox | `opencode` → Gemini 2.5 Pro |
| Lighthouse performance review | `opencode` → Gemini 2.5 Pro |
| Review entire client/src for patterns | `opencode` → Gemini 2.5 Pro |
| New API endpoint, DB schema change | Claude Code |
| Auth flow, security change | Claude Code |
| Feature requiring impl + tests + docs | Claude Code + RuFlo swarm |
| Multi-file refactor | Claude Code + RuFlo swarm |

---

## Context files (auto-loaded per tool)

| File | Loaded by |
|---|---|
| `CLAUDE.md` | Claude Code (all sessions) |
| `client/CLAUDE.md` | Claude Code (UI sessions) |
| `server/CLAUDE.md` | Claude Code (API sessions) |
| `opencode.json` | opencode CLI (all sessions, all models) |
| `GEMINI.md` | Gemini CLI + opencode Gemini sessions |
| `client/GEMINI.md` | Gemini CLI (from client/) |
| `server/GEMINI.md` | Gemini CLI (from server/) |
