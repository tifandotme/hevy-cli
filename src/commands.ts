import { defineCommand } from "citty"
import openapi from "../docs/hevy-openapi.json" with { type: "json" }
import packageJson from "../package.json" with { type: "json" }
import { type Fetcher, fetchAllPages, request } from "./api"
import {
  clearApiKey,
  readApiKeyFromPrompt,
  resolveApiKey,
  saveApiKey,
} from "./auth"
import { readJsonBody } from "./body"
import { printJson } from "./output"
import type { Stdio } from "./stdio"
import type { ApiRequestBody } from "./types"

interface CommandDeps {
  stdio: Stdio
  fetcher?: Fetcher | undefined
  env?: Record<string, string | undefined> | undefined
}

type Args = Record<string, unknown>

function stringArg(args: Args, name: string): string | undefined {
  const value = args[name]
  return typeof value === "string" ? value : undefined
}

function requiredStringArg(args: Args, name: string): string {
  const value = stringArg(args, name)
  if (!value) {
    throw new Error(`Missing required argument: ${name}`)
  }
  return value
}

function numberArg(args: Args, name: string): number | undefined {
  const value = args[name]
  if (value === undefined) {
    return undefined
  }
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${name} must be a positive integer`)
  }
  return number
}

function boolArg(args: Args, name: string): boolean {
  return args[name] === true
}

async function apiKey(deps: CommandDeps): Promise<string> {
  return await resolveApiKey({ env: deps.env })
}

async function show<T>(deps: CommandDeps, value: T): Promise<void> {
  await printJson(deps.stdio, value)
}

function pageQuery(args: Args): Record<string, number | undefined> {
  return {
    page: numberArg(args, "page"),
    pageSize: numberArg(args, "page-size"),
  }
}

async function readBody<
  P extends keyof import("./generated/hevy-openapi").paths,
  M extends "post" | "put",
>(
  deps: CommandDeps,
  args: Args,
): Promise<
  ApiRequestBody<P, M & keyof import("./generated/hevy-openapi").paths[P]>
> {
  return await readJsonBody(stringArg(args, "body"), deps.stdio)
}

function pageArgs(pageSizeMaximum = 10, pageSizeDefault = 5) {
  return {
    page: { type: "string", description: "Page number (default 1)" },
    "page-size": {
      type: "string",
      description: `Items per page (default ${pageSizeDefault}, maximum ${pageSizeMaximum})`,
    },
    all: { type: "boolean", description: "Fetch every page" },
  } as const
}

const bodyArg = {
  body: {
    type: "string",
    description: "JSON body, @file.json, or - for stdin",
    required: true,
  },
} as const

export function createRootCommand(deps: CommandDeps) {
  return defineCommand({
    meta: {
      name: "hevy",
      version: packageJson.version,
      description: "Command-line client for the Hevy public API",
    },
    subCommands: {
      openapi: defineCommand({
        meta: { description: "Print the bundled OpenAPI specification" },
        async run() {
          await show(deps, openapi)
        },
      }),
      auth: authCommand(deps),
      user: userCommand(deps),
      workouts: workoutsCommand(deps),
      routines: routinesCommand(deps),
      "exercise-templates": exerciseTemplatesCommand(deps),
      "routine-folders": routineFoldersCommand(deps),
      "exercise-history": exerciseHistoryCommand(deps),
      "body-measurements": bodyMeasurementsCommand(deps),
    },
  })
}

function authCommand(deps: CommandDeps) {
  return defineCommand({
    meta: { name: "auth", description: "Manage local auth config" },
    subCommands: {
      login: defineCommand({
        meta: { description: "Save a Hevy API key locally" },
        args: {
          key: { type: "positional", description: "API key" },
        },
        async run({ args }) {
          const key =
            stringArg(args, "key") ?? (await readApiKeyFromPrompt(deps.stdio))
          const path = await saveApiKey(key, { env: deps.env })
          await deps.stdio.writeStderr(`Saved Hevy API key to ${path}\n`)
        },
      }),
      logout: defineCommand({
        meta: { description: "Remove the saved Hevy API key" },
        async run() {
          const removed = await clearApiKey({ env: deps.env })
          await deps.stdio.writeStderr(
            removed
              ? "Removed saved Hevy API key\n"
              : "No saved Hevy API key found\n",
          )
        },
      }),
      status: defineCommand({
        meta: { description: "Show auth status" },
        async run() {
          try {
            await apiKey(deps)
            await show(deps, { authenticated: true })
          } catch {
            await show(deps, { authenticated: false })
          }
        },
      }),
    },
  })
}

function userCommand(deps: CommandDeps) {
  return defineCommand({
    meta: { name: "user", description: "User commands" },
    subCommands: {
      info: defineCommand({
        meta: { description: "Get authenticated user info" },
        async run() {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/user/info",
              method: "get",
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
    },
  })
}

function workoutsCommand(deps: CommandDeps) {
  return defineCommand({
    meta: { name: "workouts", description: "Workout commands" },
    subCommands: {
      list: defineCommand({
        meta: { description: "List workouts" },
        args: pageArgs(),
        async run({ args }) {
          const key = await apiKey(deps)
          const query = pageQuery(args)
          if (boolArg(args, "all")) {
            await show(
              deps,
              await fetchAllPages({
                arrayKey: "workouts",
                fetchPage: (page) =>
                  request({
                    apiKey: key,
                    path: "/v1/workouts",
                    method: "get",
                    query: { ...query, page },
                    fetcher: deps.fetcher,
                  }),
              }),
            )
            return
          }
          await show(
            deps,
            await request({
              apiKey: key,
              path: "/v1/workouts",
              method: "get",
              query,
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
      count: defineCommand({
        meta: { description: "Get workout count" },
        async run() {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/workouts/count",
              method: "get",
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
      events: defineCommand({
        meta: { description: "List workout events" },
        args: {
          ...pageArgs(),
          since: { type: "string", description: "ISO 8601 date-time" },
        },
        async run({ args }) {
          const key = await apiKey(deps)
          const query = { ...pageQuery(args), since: stringArg(args, "since") }
          if (boolArg(args, "all")) {
            await show(
              deps,
              await fetchAllPages({
                arrayKey: "events",
                fetchPage: (page) =>
                  request({
                    apiKey: key,
                    path: "/v1/workouts/events",
                    method: "get",
                    query: { ...query, page },
                    fetcher: deps.fetcher,
                  }),
              }),
            )
            return
          }
          await show(
            deps,
            await request({
              apiKey: key,
              path: "/v1/workouts/events",
              method: "get",
              query,
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
      get: defineCommand({
        meta: { description: "Get a workout" },
        args: {
          "workout-id": {
            type: "positional",
            description: "Workout ID",
            required: true,
          },
        },
        async run({ args }) {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/workouts/{workoutId}",
              method: "get",
              pathParams: { workoutId: requiredStringArg(args, "workout-id") },
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
      create: defineCommand({
        meta: { description: "Create a workout" },
        args: bodyArg,
        async run({ args }) {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/workouts",
              method: "post",
              body: await readBody<"/v1/workouts", "post">(deps, args),
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
      update: defineCommand({
        meta: { description: "Update a workout" },
        args: {
          "workout-id": {
            type: "positional",
            description: "Workout ID",
            required: true,
          },
          ...bodyArg,
        },
        async run({ args }) {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/workouts/{workoutId}",
              method: "put",
              pathParams: { workoutId: requiredStringArg(args, "workout-id") },
              body: await readBody<"/v1/workouts/{workoutId}", "put">(
                deps,
                args,
              ),
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
    },
  })
}

function routinesCommand(deps: CommandDeps) {
  return pagedCrudCommand(deps, {
    name: "routines",
    arrayKey: "routines",
    listPath: "/v1/routines",
    itemPath: "/v1/routines/{routineId}",
    pathParam: "routineId",
    argName: "routine-id",
    itemName: "routine",
  })
}

function exerciseTemplatesCommand(deps: CommandDeps) {
  return defineCommand({
    meta: {
      name: "exercise-templates",
      description: "Exercise template commands",
    },
    subCommands: {
      ...pagedReadSubcommands(
        deps,
        "exercise_templates",
        "/v1/exercise_templates",
        "/v1/exercise_templates/{exerciseTemplateId}",
        "exerciseTemplateId",
        "exercise-template-id",
        "exercise template",
        100,
      ),
      create: defineCommand({
        meta: { description: "Create an exercise template" },
        args: bodyArg,
        async run({ args }) {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/exercise_templates",
              method: "post",
              body: await readBody<"/v1/exercise_templates", "post">(
                deps,
                args,
              ),
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
    },
  })
}

function routineFoldersCommand(deps: CommandDeps) {
  return defineCommand({
    meta: { name: "routine-folders", description: "Routine folder commands" },
    subCommands: {
      ...pagedReadSubcommands(
        deps,
        "routine_folders",
        "/v1/routine_folders",
        "/v1/routine_folders/{folderId}",
        "folderId",
        "folder-id",
        "routine folder",
      ),
      create: defineCommand({
        meta: { description: "Create a routine folder" },
        args: bodyArg,
        async run({ args }) {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/routine_folders",
              method: "post",
              body: await readBody<"/v1/routine_folders", "post">(deps, args),
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
    },
  })
}

function exerciseHistoryCommand(deps: CommandDeps) {
  return defineCommand({
    meta: {
      name: "exercise-history",
      description: "Exercise history commands",
    },
    subCommands: {
      list: defineCommand({
        meta: { description: "List exercise history" },
        args: {
          "exercise-template-id": {
            type: "positional",
            description: "Exercise template ID",
            required: true,
          },
          "start-date": {
            type: "string",
            description: "Start date (ISO 8601 date-time)",
          },
          "end-date": {
            type: "string",
            description: "End date (ISO 8601 date-time)",
          },
        },
        async run({ args }) {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/exercise_history/{exerciseTemplateId}",
              method: "get",
              pathParams: {
                exerciseTemplateId: requiredStringArg(
                  args,
                  "exercise-template-id",
                ),
              },
              query: {
                start_date: stringArg(args, "start-date"),
                end_date: stringArg(args, "end-date"),
              },
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
    },
  })
}

function bodyMeasurementsCommand(deps: CommandDeps) {
  return defineCommand({
    meta: {
      name: "body-measurements",
      description: "Body measurement commands",
    },
    subCommands: {
      ...pagedReadSubcommands(
        deps,
        "body_measurements",
        "/v1/body_measurements",
        "/v1/body_measurements/{date}",
        "date",
        "date",
        "body measurement",
        10,
        10,
      ),
      create: defineCommand({
        meta: { description: "Create a body measurement" },
        args: bodyArg,
        async run({ args }) {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/body_measurements",
              method: "post",
              body: await readBody<"/v1/body_measurements", "post">(deps, args),
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
      update: defineCommand({
        meta: { description: "Update a body measurement" },
        args: {
          date: {
            type: "positional",
            description: "Measurement date (YYYY-MM-DD)",
            required: true,
          },
          ...bodyArg,
        },
        async run({ args }) {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/body_measurements/{date}",
              method: "put",
              pathParams: { date: requiredStringArg(args, "date") },
              body: await readBody<"/v1/body_measurements/{date}", "put">(
                deps,
                args,
              ),
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
    },
  })
}

function pagedCrudCommand(
  deps: CommandDeps,
  config: {
    name: string
    arrayKey: string
    listPath: "/v1/routines"
    itemPath: "/v1/routines/{routineId}"
    pathParam: string
    argName: string
    itemName: string
  },
) {
  return defineCommand({
    meta: { name: config.name, description: "Routine commands" },
    subCommands: {
      ...pagedReadSubcommands(
        deps,
        config.arrayKey,
        config.listPath,
        config.itemPath,
        config.pathParam,
        config.argName,
        config.itemName,
      ),
      create: defineCommand({
        meta: { description: `Create a ${config.itemName}` },
        args: bodyArg,
        async run({ args }) {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/routines",
              method: "post",
              body: await readBody<"/v1/routines", "post">(deps, args),
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
      update: defineCommand({
        meta: { description: `Update a ${config.itemName}` },
        args: {
          [config.argName]: {
            type: "positional",
            description: `${config.itemName} ID`,
            required: true,
          },
          ...bodyArg,
        },
        async run({ args }) {
          await show(
            deps,
            await request({
              apiKey: await apiKey(deps),
              path: "/v1/routines/{routineId}",
              method: "put",
              pathParams: {
                routineId: requiredStringArg(args, config.argName),
              },
              body: await readBody<"/v1/routines/{routineId}", "put">(
                deps,
                args,
              ),
              fetcher: deps.fetcher,
            }),
          )
        },
      }),
    },
  })
}

function pagedReadSubcommands(
  deps: CommandDeps,
  arrayKey: string,
  listPath:
    | "/v1/routines"
    | "/v1/exercise_templates"
    | "/v1/routine_folders"
    | "/v1/body_measurements",
  itemPath:
    | "/v1/routines/{routineId}"
    | "/v1/exercise_templates/{exerciseTemplateId}"
    | "/v1/routine_folders/{folderId}"
    | "/v1/body_measurements/{date}",
  pathParam: string,
  argName: string,
  itemName: string,
  pageSizeMaximum = 10,
  pageSizeDefault = 5,
) {
  return {
    list: defineCommand({
      meta: { description: `List ${itemName}s` },
      args: pageArgs(pageSizeMaximum, pageSizeDefault),
      async run({ args }) {
        const key = await apiKey(deps)
        const query = pageQuery(args)
        if (boolArg(args, "all")) {
          await show(
            deps,
            await fetchAllPages({
              arrayKey,
              fetchPage: (page) =>
                request({
                  apiKey: key,
                  path: listPath,
                  method: "get",
                  query: { ...query, page },
                  fetcher: deps.fetcher,
                }),
            }),
          )
          return
        }
        await show(
          deps,
          await request({
            apiKey: key,
            path: listPath,
            method: "get",
            query,
            fetcher: deps.fetcher,
          }),
        )
      },
    }),
    get: defineCommand({
      meta: { description: `Get a ${itemName}` },
      args: {
        [argName]: {
          type: "positional",
          description:
            argName === "date"
              ? "Measurement date (YYYY-MM-DD)"
              : `${itemName} ID`,
          required: true,
        },
      },
      async run({ args }) {
        await show(
          deps,
          await request({
            apiKey: await apiKey(deps),
            path: itemPath,
            method: "get",
            pathParams: { [pathParam]: requiredStringArg(args, argName) },
            fetcher: deps.fetcher,
          }),
        )
      },
    }),
  }
}
