import { expect, test } from "bun:test"
import { printJson } from "../src/output"
import { createMemoryStdio } from "../src/stdio"

test("printJson writes compact JSON with a trailing newline", async () => {
  const stdio = createMemoryStdio()

  await printJson(stdio, { foo: "bar", nested: { count: 1 } })

  expect(stdio.stdout).toEqual(['{"foo":"bar","nested":{"count":1}}\n'])
})

test("printJson skips undefined values", async () => {
  const stdio = createMemoryStdio()

  await printJson(stdio, undefined)

  expect(stdio.stdout).toEqual([])
})
