import { expect, test } from "bun:test"
import { type Fetcher, fetchAllPages, HevyApiError, request } from "../src/api"

test("request builds URL, headers, and parses JSON", async () => {
  const calls: { url: string; init?: RequestInit | undefined }[] = []
  const fetcher: Fetcher = async (url, init) => {
    calls.push({ url: String(url), init })
    return new Response(JSON.stringify({ workout_count: 42 }), { status: 200 })
  }

  const response = await request({
    apiKey: "secret",
    path: "/v1/workouts/count",
    method: "get",
    fetcher,
  })

  expect(response).toEqual({ workout_count: 42 })
  expect(calls[0]?.url).toBe("https://api.hevyapp.com/v1/workouts/count")
  expect(calls[0]?.init?.headers).toEqual({ "api-key": "secret" })
})

test("request interpolates path params and query params", async () => {
  let requestedUrl = ""
  const fetcher: Fetcher = async (url) => {
    requestedUrl = String(url)
    return new Response(JSON.stringify({ id: "abc/123" }), { status: 200 })
  }

  await request({
    apiKey: "secret",
    path: "/v1/workouts/{workoutId}",
    method: "get",
    pathParams: { workoutId: "abc/123" },
    query: { page: 1, skipped: undefined },
    fetcher,
  })

  expect(requestedUrl).toBe(
    "https://api.hevyapp.com/v1/workouts/abc%2F123?page=1",
  )
})

const badRequestFetcher: Fetcher = async () =>
  new Response(JSON.stringify({ error: "bad request" }), { status: 400 })

test("request throws HevyApiError for non-success responses", async () => {
  await expect(
    request({
      apiKey: "secret",
      path: "/v1/workouts/count",
      method: "get",
      fetcher: badRequestFetcher,
    }),
  ).rejects.toBeInstanceOf(HevyApiError)
})

test("fetchAllPages returns one aggregate envelope", async () => {
  const result = await fetchAllPages({
    arrayKey: "workouts",
    fetchPage: async (page) => ({
      page,
      page_count: 2,
      workouts: [`workout-${page}`],
    }),
  })

  expect(result).toEqual({
    page: 1,
    page_count: 2,
    workouts: ["workout-1", "workout-2"],
  })
})
