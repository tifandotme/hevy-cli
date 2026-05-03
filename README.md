# hevy

Command-line client for the Hevy public API.

## Status

Early implementation. The CLI is planned as a thin wrapper around the Hevy OpenAPI contract in `docs/hevy-openapi.json`.

## Development

```bash
bun install
bun run generate:openapi-types
bun run format:check
bun run lint
bun run typecheck
bun test
bun run build
```

Run locally:

```bash
HEVY_API_KEY=... bun run src/cli.ts workouts list --page 1 --page-size 5
```

Build a single binary:

```bash
bun run build
./dist/hevy --help
```

## Planned install

The first supported install channel will be Homebrew through `tifandotme/homebrew-tap`.
