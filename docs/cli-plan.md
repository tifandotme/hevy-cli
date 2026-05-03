# Hevy CLI plan

## Goal

Build `hevy`, a single-binary command-line client for the Hevy public API. The first release is a thin API wrapper: commands mirror the OpenAPI contract, print JSON, and avoid higher-level workflows unless they are explicitly requested.

## V1 decisions

- Binary name: `hevy`.
- Runtime: Bun, compiled with `bun build --compile`.
- CLI framework: Citty.
- Install channel: Homebrew only.
- Source repo: `tifandotme/hevy-cli`.
- Tap repo: `tifandotme/homebrew-tap`.
- Release target: macOS Apple Silicon only.
- API base URL: `https://api.hevyapp.com`.
- Auth lookup order: `HEVY_API_KEY`, then local config.
- Local config path: `$XDG_CONFIG_HOME/hevy/config.json`, or `~/.config/hevy/config.json` when `XDG_CONFIG_HOME` is unset.
- Local config permissions: directory `0700`, file `0600`.
- Output: pretty JSON on stdout for successful API responses.
- Errors: human-readable stderr, non-zero exit. `--debug` includes status, URL, and raw response body.
- Request bodies: JSON only, supplied inline, from `@file.json`, or from stdin.
- Runtime request validation: parse JSON syntax only. Do not validate bodies against the OpenAPI schema in v1.
- Destructive commands: prompt in interactive terminals, require `--yes` in scripts.

## OpenAPI contract

The app reads `docs/hevy-openapi.json` when it needs runtime metadata. Development reads should prefer `docs/hevy-openapi.toon` because it is smaller.

Hevy does not expose a standalone OpenAPI JSON endpoint. `bun run update:openapi` fetches `https://api.hevyapp.com/docs/swagger-ui-init.js`, extracts the embedded `swaggerDoc` object, writes `docs/hevy-openapi.json`, regenerates `docs/hevy-openapi.toon`, and updates generated TypeScript declarations.

Generate and commit TypeScript declarations from the JSON contract:

```bash
bun run generate:openapi-types
```

Application code imports the generated types for request and response typing.

## Command shape

Use group-then-verb names:

```bash
hevy workouts list
hevy workouts get <workout-id>
hevy workouts create --body @workout.json
hevy workouts update <workout-id> --body @workout.json
```

Planned groups from the current OpenAPI contract:

- `auth`
  - `login`
  - `logout`
  - `status`
- `user`
  - `info`
- `workouts`
  - `list [--page <n>] [--page-size <n>] [--all]`
  - `count`
  - `events [--page <n>] [--page-size <n>] [--since <iso-date>] [--all]`
  - `get <workout-id>`
  - `create --body <json|@file|->`
  - `update <workout-id> --body <json|@file|->`
- `routines`
  - `list [--page <n>] [--page-size <n>] [--all]`
  - `get <routine-id>`
  - `create --body <json|@file|->`
  - `update <routine-id> --body <json|@file|->`
- `exercise-templates`
  - `list [--page <n>] [--page-size <n>] [--all]`
  - `get <exercise-template-id>`
  - `create --body <json|@file|->`
- `routine-folders`
  - `list [--page <n>] [--page-size <n>] [--all]`
  - `get <folder-id>`
  - `create --body <json|@file|->`
- `exercise-history`
  - `list <exercise-template-id> [--start-date <iso-date>] [--end-date <iso-date>]`
- `body-measurements`
  - `list [--page <n>] [--page-size <n>] [--all]`
  - `get <date>`
  - `create --body <json|@file|->`
  - `update <date> --body <json|@file|->`

For `--all`, fetch every page and print one aggregate response envelope. Keep the endpoint's object shape and concatenate the main array field.

## Tooling

Required package scripts:

```json
{
  "scripts": {
    "format": "oxfmt",
    "format:check": "oxfmt --check",
    "lint": "oxlint",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "build": "bun build src/cli.ts --compile --outfile dist/hevy",
    "generate:openapi-types": "openapi-typescript docs/hevy-openapi.json -o src/generated/hevy-openapi.d.ts",
    "update:openapi": "bun run scripts/update-openapi.ts"
  }
}
```

Use Bun.test for unit tests. Mock `fetch` and filesystem boundaries. Do not call the live Hevy API in v1 tests.

## CI

Pull-request CI runs:

```bash
bun install --frozen-lockfile
bun run format:check
bun run lint
bun run typecheck
bun test
bun run build
```

## Release

A tag-triggered workflow runs on `v*` tags:

1. Install Bun.
2. Run full CI checks.
3. Build `dist/hevy` for macOS Apple Silicon.
4. Create or update the GitHub release.
5. Compute the binary SHA256.
6. Open or update a PR in `tifandotme/homebrew-tap` with `Formula/hevy.rb`.

Use `gh`, not a third-party PR action, for release and tap PR operations.

## Later

- Add schema validation against `docs/hevy-openapi.json` for better local request errors.
- Add table output for obvious list commands.
- Add Linux and macOS Intel binaries if users ask for them.
- Add convenience workflows such as export, sync, or create-from-template.
- Add `--all` performance guards if a user has very large datasets.
- Add live smoke tests gated behind `HEVY_API_KEY` if needed.
