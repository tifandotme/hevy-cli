---
name: bun
description: Use when building JavaScript/TypeScript applications, running scripts, managing packages, testing code, or bundling for production. Bun is an all-in-one toolkit that replaces Node.js, npm, Jest, and esbuild with a single fast binary.
metadata:
  mintlify-proj: bun
  version: "1.0"
---

# Bun Skill

## Product summary

Bun is an all-in-one JavaScript/TypeScript toolkit that ships as a single binary. It includes a runtime (drop-in Node.js replacement), package manager, test runner, and bundler. Use `bun run` to execute scripts, `bun install` to manage dependencies, `bun test` to run tests, and `bun build` to bundle code. Configuration lives in `bunfig.toml` (optional, Bun works zero-config) and `package.json`. Key CLI commands: `bun run <script>`, `bun install`, `bun add <pkg>`, `bun test`, `bun build <entry>`. Primary docs: https://bun.com/docs

## When to use

Reach for this skill when:

- Running TypeScript/JSX files directly without compilation (`bun run app.ts`)
- Installing or managing npm packages faster than npm/yarn (`bun install`, `bun add`)
- Writing and running tests with Jest-compatible API (`bun test`)
- Bundling JavaScript/TypeScript for browsers or servers (`bun build`)
- Building HTTP servers with `Bun.serve()` and native APIs
- Executing package.json scripts (`bun run start`)
- Working with file I/O, environment variables, or system processes
- Migrating from Node.js projects (Bun is mostly compatible)
- Setting up monorepos with workspaces

## Quick reference

### Core commands

| Task                 | Command                                         |
| -------------------- | ----------------------------------------------- |
| Run a file           | `bun run app.ts`                                |
| Run a script         | `bun run start`                                 |
| Install dependencies | `bun install`                                   |
| Add a package        | `bun add lodash`                                |
| Add dev dependency   | `bun add -d typescript`                         |
| Remove a package     | `bun remove lodash`                             |
| Run tests            | `bun test`                                      |
| Bundle code          | `bun build ./index.ts --outdir ./dist`          |
| Watch for changes    | `bun run --watch app.ts` or `bun build --watch` |
| Execute a package    | `bunx cowsay "Hello"`                           |

### Configuration files

- **bunfig.toml** — Bun-specific settings (optional). Searched at `./bunfig.toml`, `$HOME/.bunfig.toml`, or `$XDG_CONFIG_HOME/.bunfig.toml`. Local overrides global.
- **package.json** — Standard npm metadata. Bun reads `scripts`, `dependencies`, `devDependencies`, `workspaces`.
- **tsconfig.json** — TypeScript configuration. Bun respects `compilerOptions` for JSX, module resolution, and paths.
- **bun.lock** or **bun.lockb** — Lockfile (auto-generated). Text or binary format.

### File type support

Bun natively transpiles and executes:

- `.ts`, `.tsx` — TypeScript and JSX
- `.js`, `.jsx` — JavaScript and JSX
- `.json`, `.jsonc`, `.toml`, `.yaml` — Data files (parsed at build time)
- `.html` — HTML with asset bundling
- `.css` — CSS bundling

### Environment variables

Access via `process.env`, `Bun.env`, or `import.meta.env` (all equivalent):

```ts
const apiUrl = process.env.API_URL
const token = Bun.env.AUTH_TOKEN
```

Bun auto-loads `.env`, `.env.local`, `.env.[NODE_ENV]` files.

## Decision guidance

### When to use `bun run` vs `bun build`

| Use case                            | Tool        | Notes                                           |
| ----------------------------------- | ----------- | ----------------------------------------------- |
| Execute a script or server locally  | `bun run`   | Fast startup, no bundling overhead              |
| Prepare code for production/browser | `bun build` | Minifies, tree-shakes, outputs optimized bundle |
| Run tests                           | `bun test`  | Built-in test runner, Jest-compatible           |
| Execute a package CLI               | `bunx`      | Runs package binaries without install           |

### When to use `bun install` vs `bun add`

| Scenario                                   | Command                           |
| ------------------------------------------ | --------------------------------- |
| Install all dependencies from package.json | `bun install`                     |
| Add a new package to dependencies          | `bun add lodash`                  |
| Add a dev-only package                     | `bun add -d @types/node`          |
| Add optional dependency                    | `bun add --optional optional-pkg` |
| Install from git                           | `bun add github:user/repo`        |

### Bundler target selection

| Target    | Use                   | Notes                                             |
| --------- | --------------------- | ------------------------------------------------- |
| `browser` | Client-side code      | Default. Optimizes for browsers.                  |
| `bun`     | Server-side code      | Optimizes for Bun runtime. Adds `// @bun` pragma. |
| `node`    | Node.js compatibility | Prioritizes Node.js export conditions.            |

## Workflow

### 1. Set up a new project

```bash
bun init my-app
cd my-app
```

Choose a template (Blank, React, Library). Bun creates `package.json`, `tsconfig.json`, and `index.ts`.

### 2. Install dependencies

```bash
bun install
# or add a specific package
bun add express
bun add -d @types/node
```

Bun creates `bun.lock` (or `bun.lockb`). Check `node_modules` structure.

### 3. Write and run code

Create `app.ts`:

```ts
const server = Bun.serve({
  port: 3000,
  routes: {
    "/": () => new Response("Hello"),
  },
})
console.log(`Listening on ${server.url}`)
```

Run it:

```bash
bun run app.ts
```

### 4. Add a script to package.json

```json
{
  "scripts": {
    "dev": "bun run --watch app.ts",
    "build": "bun build ./app.ts --outdir ./dist"
  }
}
```

Run with `bun run dev` or `bun run build`.

### 5. Write tests

Create `math.test.ts`:

```ts
import { test, expect } from "bun:test"

test("2 + 2 = 4", () => {
  expect(2 + 2).toBe(4)
})
```

Run tests:

```bash
bun test
bun test --watch
bun test --coverage
```

### 6. Bundle for production

```bash
bun build ./app.ts --outdir ./dist --minify
```

Check `dist/` for bundled output. Use `--target browser|bun|node` to optimize for your environment.

### 7. Configure with bunfig.toml (optional)

```toml
[install]
optional = true
dev = true

[test]
coverage = true
coverageThreshold = 0.8

[serve]
port = 3000
```

## Common gotchas

- **TypeScript errors on `Bun` global** — Install `@types/bun` and add `"lib": ["ESNext"]` to `tsconfig.json` compilerOptions.
- **Auto-install disabled in production** — Set `[install] auto = "disable"` in bunfig.toml if you want strict dependency management.
- **Lockfile format changes** — `bun.lock` is text by default (v1.2+). Use `[install] saveTextLockfile = false` to generate binary `bun.lockb`.
- **Node.js compatibility gaps** — Not all Node.js APIs are implemented. Check `/runtime/nodejs-compat` for current status. Use `node:` prefix for built-in modules.
- **Bundler is not a type-checker** — Use `tsc` separately for type checking. Bun's bundler only transpiles.
- **Test files must match patterns** — Tests are auto-discovered as `*.test.ts`, `*_test.ts`, `*.spec.ts`, `*_spec.ts`. Adjust with `[test] pathIgnorePatterns` in bunfig.toml.
- **Environment variables in bundles** — Use `env: "inline"` or `env: "PREFIX_*"` in `bun build` to inject env vars. Default is `env: "disable"`.
- **Workspaces require `workspace:*` syntax** — When linking packages in a monorepo, use `"workspace:*"` in dependencies, not `"*"`.

## Verification checklist

Before submitting work with Bun:

- [ ] Code runs without errors: `bun run app.ts`
- [ ] All tests pass: `bun test` (check coverage if required)
- [ ] Dependencies are installed: `bun install` succeeds
- [ ] No TypeScript errors: `tsc --noEmit` (if type-checking is needed)
- [ ] Bundle builds successfully: `bun build ./entry.ts --outdir ./dist`
- [ ] Environment variables are set correctly (check `.env` files)
- [ ] Lockfile is committed: `bun.lock` or `bun.lockb` in version control
- [ ] Scripts in package.json work: `bun run <script-name>`
- [ ] Watch mode works if needed: `bun run --watch` or `bun build --watch`

## Resources

- **Comprehensive navigation**: https://bun.com/docs/llms.txt — Full page-by-page listing for agent reference
- **Runtime API reference**: https://bun.com/docs/runtime — Core APIs, file I/O, HTTP, networking, workers
- **Package manager docs**: https://bun.com/docs/pm/cli/install — Install, add, workspaces, registries
- **Bundler docs**: https://bun.com/docs/bundler — Build options, plugins, code splitting, executables

---

> For additional documentation and navigation, see: https://bun.com/docs/llms.txt
