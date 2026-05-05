# Hevy CLI

## Project Snapshot

- Single-package Bun repository for the `hevy` command-line client.
- Primary code lives in `src/`; tests live in `tests/`; OpenAPI inputs live in `docs/`; codegen helpers live in `scripts/`.
- Command runtime uses Citty. Network calls target the Hevy public API. Generated types come from `docs/hevy-openapi.json`.
- Output is compact JSON by default. Auth reads `HEVY_API_KEY` first, then falls back to local config.
- Current status: early implementation. Prefer small, direct changes over broad polish work.

## Root Setup Commands

```bash
bun install
bun run generate:openapi-types
bun run lint
bun run typecheck
bun test
bun run build
```

Run the CLI locally:

```bash
HEVY_API_KEY=... bun run src/cli.ts workouts list --page 1 --page-size 5
```

Run only smoke tests:

```bash
bun test tests/smoke.test.ts
```

## Universal Conventions

- Keep the CLI thin and close to the Hevy API shape.
- Prefer resource-group plus verb commands such as `hevy workouts list`.
- Preserve compact JSON output by default for API resource commands.
- Read auth from `HEVY_API_KEY` first; keep local config fallback working.
- For request bodies, prefer shared JSON body input paths over endpoint-specific flag sprawl.
- Use Bun-native APIs and Bun test patterns already present in `tests/`.
- Keep edits surgical. Do not rewrite generated files manually unless the source contract or generator changed.

## Checks after Code Changes

After changing code, run typecheck before anything else that may depend on code fixes:

```bash
bun run typecheck
```

Then run the relevant tests and build:

```bash
bun test
bun run build
```

Run format last:

```bash
bun run format
```

Use `bun run format:check` when you only want verification.

## Testing Notes

- Core tests are Bun unit tests in `tests/*.test.ts`.
- `tests/smoke.test.ts` calls the live Hevy API and skips when `HEVY_API_KEY` is unset.
- Do not rely on smoke tests for response logging; they currently assert response shape only.
- Prefer targeted test runs while iterating, then run the broader suite before finishing.

## Security and Secrets

- Never commit real API keys, tokens, or local config contents.
- Treat `HEVY_API_KEY` as the primary auth secret.
- Keep any user-local auth config under the existing restricted-permission model.
- Do not add alternate base URLs or secret-bearing debug output unless explicitly required.

## JIT Index

Quick searches:

```bash
rg -n "defineCommand|subCommands|args" src
rg -n "request\(|fetch\(" src tests
rg -n "HEVY_API_KEY|config.json|XDG_CONFIG_HOME" src tests
rg -n "pretty|JSON\.stringify|stdout|stderr" src
rg -n "openapi|generated" src scripts docs
rg -n "smoke:|bun:test|test\.skip" tests
```

## Definition of Done

- Relevant tests pass.
- `bun run typecheck` passes.
- `bun run build` passes.
- `bun run format` is run last after code changes settle.
- If generated files changed, the source change that required regeneration is clear in the diff.
