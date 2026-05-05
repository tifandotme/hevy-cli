# hevy

Bun-native command-line client for the Hevy public API.

Use `hevy` to inspect workouts, routines, exercise templates, body measurements, and other Hevy data from your terminal. It prints pretty JSON by default, so it works well with `jq`, shell scripts, cron jobs, and small local dashboards.

## Install

`hevy` requires [Bun](https://bun.sh/) at runtime.

```bash
bun install --global hevy
hevy --help
```

You can also install it with npm if `bun` is on your `PATH`:

```bash
npm install --global hevy
hevy --help
```

Install the agent skill for Hevy CLI workflows:

```bash
bunx skills add tifandotme/hevy-cli
```

The skill tells compatible coding agents how to use the published CLI safely.

## Authentication

Set your Hevy API key in the environment:

```bash
export HEVY_API_KEY=...
```

Or save it locally:

```bash
hevy auth login
hevy auth status
```

`HEVY_API_KEY` takes priority over local config.

## Examples

List recent workouts:

```bash
hevy workouts list --page 1 --page-size 5
```

Get the total workout count:

```bash
hevy workouts count
```

List routines:

```bash
hevy routines list
```

Fetch every page and process the JSON with `jq`:

```bash
hevy workouts list --all | jq '.workouts[].title'
```

Create or update resources from JSON:

```bash
hevy workouts create --body @workout.json
hevy body-measurements update 2026-05-06 --body @measurement.json
```

## Status

Early release. `hevy` stays close to the Hevy public API shape, so commands map directly to API resources where possible.

## Development

Install dependencies and run checks:

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
