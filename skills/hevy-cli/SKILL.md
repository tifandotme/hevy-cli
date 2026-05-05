---
name: hevy-cli
description: Use when the user wants to interact with Hevy through the local `hevy` CLI: view workouts, routines, exercises, body measurements, exercise history, user profile, or create/update/delete Hevy resources. Trigger for requests like "show my recent workouts", "summarize my Hevy data", "create a workout", "list my routines", "get my exercise history", or troubleshooting Hevy CLI auth and command usage.
---

# Hevy CLI

Use this skill when the user wants an agent to talk to Hevy through the published CLI.

Prefer live CLI help over this file. The skill gives operating rules, not command documentation.

## Command runner

Use the published CLI with Bun:

```bash
bunx @tifan/hevy@latest --help
```

Do not require a global `hevy` install. Use the repo-local CLI only when the user is working on this repository or testing local changes.

Always inspect help before choosing commands:

```bash
bunx @tifan/hevy@latest --help
bunx @tifan/hevy@latest <group> --help
bunx @tifan/hevy@latest <group> <command> --help
```

Write full commands. Do not rely on shell aliases or variables across tool calls.

## Auth

If the user asks for private Hevy data and auth state is unknown, check auth first:

```bash
bunx @tifan/hevy@latest auth status
```

After one authenticated command succeeds in the session, do not repeat auth checks unless a command fails.

If auth is missing, tell the user to set `HEVY_API_KEY` in their environment or run:

```bash
bunx @tifan/hevy@latest auth login
```

Never ask the user to paste an API key into chat. Never echo API keys, config file contents, token-like strings, or secret-bearing environment values.

## Safety

Read-only commands may run when auth is available.

Mutating commands require explicit natural-language confirmation in chat before execution. This applies to create, update, delete, or any command that changes the user's Hevy account. Do not rely on CLI prompts as confirmation.

Before a mutation, show a concise summary of the planned change and ask the user to confirm.

## Output handling

The CLI emits compact JSON by default. Default to concise natural-language summaries. Do not paste raw JSON unless the user asks for it, debugging requires it, or exact fields matter.

Hevy data can include notes, IDs, timestamps, measurements, and detailed set data. Omit irrelevant private details from summaries.

For broad list requests, use a small page size when the command supports it:

```bash
bunx @tifan/hevy@latest workouts list --page-size=5
```

Use larger pages or `--all` only when the user asks for comprehensive analysis.

Prefer `jq` to reduce JSON before reading or responding:

```bash
bunx @tifan/hevy@latest workouts list --page-size=5 |
  jq '.workouts[] | {title, start_time, exercise_count: (.exercises | length)}'
```

If `jq` is unavailable, fall back to `bun -e`. Do not block the task by asking the user to install `jq`.

## Development note

If the user asks to change the CLI itself, switch to the repository guidance in `AGENTS.md` and follow the project's Bun, test, and OpenAPI rules.
