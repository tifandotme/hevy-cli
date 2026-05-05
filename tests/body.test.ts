import { expect, test } from "bun:test"
import { readJsonBody } from "../src/body"
import { createMemoryStdio } from "../src/stdio"

test("readJsonBody parses inline JSON", async () => {
  await expect(readJsonBody('{"a":1}', createMemoryStdio())).resolves.toEqual({
    a: 1,
  })
})

test("readJsonBody parses stdin JSON", async () => {
  await expect(
    readJsonBody("-", createMemoryStdio('{"a":1}')),
  ).resolves.toEqual({ a: 1 })
})

test("readJsonBody reports invalid JSON", async () => {
  await expect(readJsonBody("not json", createMemoryStdio())).rejects.toThrow(
    "Invalid JSON body",
  )
})
