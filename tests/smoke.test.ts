import { expect, test } from "bun:test"
import { request } from "../src/api"

const apiKey = Bun.env.HEVY_API_KEY
const smokeTest = apiKey ? test : test.skip

smokeTest("smoke: user info", async () => {
  const response = await request({
    apiKey: apiKey!,
    path: "/v1/user/info",
    method: "get",
  })

  expect(response).toBeObject()
  expect(response).not.toBeNull()
})

smokeTest("smoke: workouts count", async () => {
  const response = await request({
    apiKey: apiKey!,
    path: "/v1/workouts/count",
    method: "get",
  })

  expect(response).toBeObject()
  expect(response).toHaveProperty("workout_count")
  expect(typeof (response as { workout_count: unknown }).workout_count).toBe(
    "number",
  )
})
