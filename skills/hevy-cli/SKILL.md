---
name: hevy-cli
description: "Helps an agent use the published `hevy` CLI for natural-language requests about workouts, routines, exercise templates, routine folders, body measurements, exercise history, user info, or the bundled OpenAPI contract. Also covers authenticated create or update requests and Hevy CLI auth troubleshooting."
---

# Hevy CLI

Use this skill when the user wants an agent to talk to Hevy through the published CLI.

Prefer live CLI help over this file. The skill gives operating rules, not command documentation.

## Command runner

Run the published CLI directly with `bunx`. Do not install the package first.

```bash
bunx @tifan/hevy --help
```

Do not run `bun install`, `bun add`, `npm install -g`, or ask the user to install `hevy` just to use the CLI. Use the repo-local CLI only when the user is working on this repository or testing local changes.

Always inspect help before choosing commands:

```bash
bunx @tifan/hevy --help
bunx @tifan/hevy <group> --help
bunx @tifan/hevy <group> <command> --help
```

The `openapi` command is read-only and does not require authentication. Inspect its bundled operation before constructing a request that help does not fully describe:

```bash
bunx @tifan/hevy openapi |
  jq '.paths["/v1/workouts"].post'
```

When the operation uses a named request schema, inspect that schema too:

```bash
bunx @tifan/hevy openapi |
  jq '.components.schemas.PostWorkoutsRequestBody'
```

Follow nested `$ref` values into `.components.schemas` as needed. Write full commands. Do not rely on shell aliases or variables across tool calls.

## Auth

If the user asks for private Hevy data and auth state is unknown, check auth first:

```bash
bunx @tifan/hevy auth status
```

After one authenticated command succeeds in the session, do not repeat auth checks unless a command fails.

If auth is missing, tell the user to set `HEVY_API_KEY` in their environment or run:

```bash
bunx @tifan/hevy auth login
```

Never ask the user to paste an API key into chat. Never echo API keys, config file contents, token-like strings, or secret-bearing environment values.

## Safety

Read-only commands may run when auth is available.

Commands that change the user's Hevy account, including `create` and `update`, require explicit natural-language confirmation in chat before execution. Do not rely on CLI prompts as confirmation.

Before a mutation, inspect its OpenAPI request schema, show a concise summary of the planned change, and ask the user to confirm.

## Output handling

The CLI emits compact JSON by default. Default to concise natural-language summaries. Do not paste raw JSON unless the user asks for it, debugging requires it, or exact fields matter.

Hevy data can include notes, IDs, timestamps, measurements, and detailed set data. Omit irrelevant private details from summaries.

For broad list requests, use a small page size when the command supports it:

```bash
bunx @tifan/hevy workouts list --page-size=5
```

Use larger pages or `--all` only when the user asks for comprehensive analysis.

Prefer `jq` to reduce JSON before reading or responding:

```bash
bunx @tifan/hevy workouts list --page-size=5 |
  jq '.workouts[] | {title, start_time, exercise_count: (.exercises | length)}'
```

If `jq` is unavailable, fall back to `bun -e`. Do not block the task by asking the user to install `jq`.

## Development note

If the user asks to change the CLI itself, switch to the repository guidance in `AGENTS.md` and follow the project's Bun, test, and OpenAPI rules.
