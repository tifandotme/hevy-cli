import { expect, test } from "bun:test"
import { runCommand } from "citty"
import openapi from "../docs/hevy-openapi.json" with { type: "json" }
import { type Fetcher } from "../src/api"
import { createRootCommand } from "../src/commands"
import { createMemoryStdio } from "../src/stdio"

const apiMethods = ["delete", "get", "patch", "post", "put"] as const
type ApiMethod = (typeof apiMethods)[number]
type CommandCase = readonly [
  command: string,
  method: ApiMethod,
  path: string,
  specPath?: string,
  query?: Record<string, string>,
]

interface OpenApiDocument {
  paths: Record<string, Partial<Record<ApiMethod, unknown>>>
}

const commandCases: CommandCase[] = [
  [
    "workouts list --page=2 --page-size=7",
    "get",
    "/v1/workouts",
    "/v1/workouts",
    { page: "2", pageSize: "7" },
  ],
  ["workouts create --body={}", "post", "/v1/workouts"],
  ["workouts count", "get", "/v1/workouts/count"],
  [
    "workouts events --page=2 --page-size=7 --since=2026-01-02T03:04:05Z",
    "get",
    "/v1/workouts/events",
    "/v1/workouts/events",
    { page: "2", pageSize: "7", since: "2026-01-02T03:04:05Z" },
  ],
  [
    "workouts get workout/id",
    "get",
    "/v1/workouts/workout%2Fid",
    "/v1/workouts/{workoutId}",
  ],
  [
    "workouts update workout/id --body={}",
    "put",
    "/v1/workouts/workout%2Fid",
    "/v1/workouts/{workoutId}",
  ],
  ["user info", "get", "/v1/user/info"],
  ["routines list", "get", "/v1/routines"],
  ["routines create --body={}", "post", "/v1/routines"],
  [
    "routines get routine-id",
    "get",
    "/v1/routines/routine-id",
    "/v1/routines/{routineId}",
  ],
  [
    "routines update routine-id --body={}",
    "put",
    "/v1/routines/routine-id",
    "/v1/routines/{routineId}",
  ],
  ["exercise-templates list", "get", "/v1/exercise_templates"],
  ["exercise-templates create --body={}", "post", "/v1/exercise_templates"],
  [
    "exercise-templates get template-id",
    "get",
    "/v1/exercise_templates/template-id",
    "/v1/exercise_templates/{exerciseTemplateId}",
  ],
  ["routine-folders list", "get", "/v1/routine_folders"],
  ["routine-folders create --body={}", "post", "/v1/routine_folders"],
  [
    "routine-folders get 42",
    "get",
    "/v1/routine_folders/42",
    "/v1/routine_folders/{folderId}",
  ],
  [
    "exercise-history list template-id --start-date=2026-01-01T00:00:00Z --end-date=2026-02-01T00:00:00Z",
    "get",
    "/v1/exercise_history/template-id",
    "/v1/exercise_history/{exerciseTemplateId}",
    {
      start_date: "2026-01-01T00:00:00Z",
      end_date: "2026-02-01T00:00:00Z",
    },
  ],
  ["body-measurements list", "get", "/v1/body_measurements"],
  ["body-measurements create --body={}", "post", "/v1/body_measurements"],
  [
    "body-measurements get 2026-01-02",
    "get",
    "/v1/body_measurements/2026-01-02",
    "/v1/body_measurements/{date}",
  ],
  [
    "body-measurements update 2026-01-02 --body={}",
    "put",
    "/v1/body_measurements/2026-01-02",
    "/v1/body_measurements/{date}",
  ],
]

test("CLI covers every OpenAPI operation", async () => {
  const observedOperations = await Promise.all(
    commandCases.map(
      async ([command, method, path, specPath = path, query = {}]) => {
        let observedRequest:
          | { url: URL; init?: RequestInit | undefined }
          | undefined
        const fetcher: Fetcher = async (input, init) => {
          observedRequest = { url: new URL(String(input)), init }
          return new Response("{}")
        }

        await runCommand(
          createRootCommand({
            stdio: createMemoryStdio(),
            fetcher,
            env: { HEVY_API_KEY: "test-key" },
          }),
          { rawArgs: command.split(" ") },
        )

        expect(observedRequest).toBeDefined()
        const { url, init } = observedRequest!
        const hasBody = method === "post" || method === "put"
        expect(url.pathname).toBe(path)
        expect(Object.fromEntries(url.searchParams)).toEqual(query)
        expect(init?.headers).toEqual({
          "api-key": "test-key",
          ...(hasBody ? { "content-type": "application/json" } : {}),
        })
        expect(init?.body).toBe(hasBody ? "{}" : undefined)
        return `${method} ${specPath}`
      },
    ),
  )

  const specOperations = Object.entries(
    (openapi as OpenApiDocument).paths,
  ).flatMap(([path, pathItem]) =>
    apiMethods
      .filter((method) => pathItem[method] !== undefined)
      .map((method) => `${method} ${path}`),
  )

  expect(observedOperations.toSorted()).toEqual(specOperations.toSorted())
})

test("openapi prints the bundled API contract", async () => {
  const stdio = createMemoryStdio()

  await runCommand(createRootCommand({ stdio }), { rawArgs: ["openapi"] })

  expect(JSON.parse(stdio.stdout.join(""))).toEqual(openapi)
})
