# Hevy CLI

A command-line client for the Hevy public API.

## Language

**Hevy CLI**:
A single-binary command-line client named `hevy`.
_Avoid_: wrapper, app

**API resource command**:
A kebab-case command group with verb subcommands that maps directly to one Hevy API resource or endpoint.
_Avoid_: workflow command, automation, path command

**Convenience command**:
A higher-level command that combines API resource commands into a user task.
_Avoid_: raw API command

**Hevy API key**:
A secret token that authorizes requests to the Hevy public API.
_Avoid_: password, login token

**Local auth config**:
A user-local JSON file at `$XDG_CONFIG_HOME/hevy/config.json`, or `~/.config/hevy/config.json` when `XDG_CONFIG_HOME` is unset, that stores the **Hevy API key** with restricted file permissions for interactive CLI use.
_Avoid_: account, session, Keychain

**OpenAPI contract**:
The checked-in Hevy API specification in `docs/hevy-openapi.json`.
_Avoid_: schema dump, docs JSON

**Command runtime**:
The code that parses arguments, routes subcommands, and renders help.
_Avoid_: framework, shell

**Pretty JSON output**:
Indented JSON printed by default from API resource commands.
_Avoid_: table output, formatted report

**JSON body input**:
A request body supplied as JSON text, a JSON file, or stdin.
_Avoid_: endpoint field flags

**Schema validation**:
Local validation of request data against the **OpenAPI contract** before calling Hevy.
_Avoid_: typecheck, JSON parsing

**Source repository**:
The personal GitHub repository `tifandotme/hevy-cli` that hosts the Hevy CLI source and releases.
_Avoid_: company repo, tap repo

**Homebrew tap**:
The personal GitHub repository `tifandotme/homebrew-tap` that publishes the `hevy` formula.
_Avoid_: source repo formula, company tap

**Release binary**:
The Bun-compiled macOS Apple Silicon executable published as `hevy`.
_Avoid_: npm package, Node script

**Hevy API base URL**:
The fixed production origin `https://api.hevyapp.com` used for all Hevy public API requests.
_Avoid_: configurable environment, mock URL

**All-pages option**:
An explicit list-command option that fetches every page from a paginated Hevy endpoint and prints one aggregate response envelope.
_Avoid_: default pagination, sync, array-only output

**API error output**:
A concise human-readable error printed to stderr when Hevy returns a non-success response.
_Avoid_: stdout error, raw default error

**Core unit test**:
A Bun.test test that mocks network and filesystem boundaries instead of calling the live Hevy API.
_Avoid_: live API test, integration smoke test

**Typecheck script**:
The `package.json` script that runs `tsc --noEmit`.
_Avoid_: build check, transpile check

**Destructive command**:
An API resource command that deletes Hevy data.
_Avoid_: write command, update command

**Release workflow**:
A tag-triggered GitHub Actions workflow that builds the **Release binary**, publishes a GitHub release, and opens or updates a **Homebrew tap** PR.
_Avoid_: manual release, npm publish

**Full CI check**:
The pull-request workflow that runs install, format check, lint, typecheck, unit tests, and binary build.
_Avoid_: typecheck-only CI, release workflow

## Relationships

- The **Hevy CLI** exposes **API resource commands** for all endpoints in the **OpenAPI contract**.
- An **API resource command** uses group-then-verb naming, such as `hevy workouts list`.
- A **Convenience command** may be added later, but it must not replace the lower-level **API resource command**.
- The **Hevy CLI** reads the **Hevy API key** from `HEVY_API_KEY` before falling back to **Local auth config**.
- The **Local auth config** directory uses mode `0700`, and the config file uses mode `0600`.
- The **OpenAPI contract** generates committed TypeScript declarations for API request and response types.
- The **Command runtime** uses Citty to define nested command groups and options.
- An **API resource command** prints **Pretty JSON output** by default.
- A write **API resource command** accepts **JSON body input** first, not endpoint-specific field flags.
- In v1, the **Hevy CLI** parses **JSON body input** but does not perform **Schema validation**.
- The **Homebrew tap** is the supported install channel for the **Release binary**.
- v1 publishes a **Release binary** for macOS Apple Silicon only.
- The **Hevy CLI** uses one fixed **Hevy API base URL** in v1.
- Paginated **API resource commands** expose raw page options by default and support an explicit **All-pages option**.
- Failed API requests print **API error output** to stderr and exit non-zero; `--debug` includes status, URL, and raw body.
- v1 test coverage uses **Core unit tests** only.
- The **Typecheck script** is required for v1 development and CI.
- A **Destructive command** prompts for confirmation in an interactive terminal and requires `--yes` in scripts.
- The **Source repository** must exist before the **Release workflow** can publish releases.
- The **Release workflow** runs on `v*` tags in the **Source repository** and updates the **Homebrew tap** through `gh`.
- Pull requests must pass the **Full CI check**.

## Example dialogue

> **Dev:** "Should `hevy workouts list` hide pagination and sync all workouts?"
> **Domain expert:** "No. Start with the API shape. A sync workflow can come later as a convenience command."

## Flagged ambiguities

- "CLI wrapper" means **Hevy CLI** when discussing the product, and **API resource command** when discussing endpoint-shaped commands.
- "login" means saving a **Hevy API key** locally. It does not mean OAuth or browser-based authentication.
- "validation" can mean JSON syntax checks or **Schema validation**. v1 only does JSON syntax checks; **Schema validation** is a later improvement.
