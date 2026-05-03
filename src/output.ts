import { HevyApiError } from "./api"
import type { Stdio } from "./stdio"

export async function printJson(stdio: Stdio, value: unknown): Promise<void> {
  if (value === undefined) {
    return
  }
  await stdio.writeStdout(`${JSON.stringify(value, null, 2)}\n`)
}

export async function printError(
  stdio: Stdio,
  error: unknown,
  debug = false,
): Promise<void> {
  if (error instanceof HevyApiError) {
    const body = parseErrorBody(error.body)
    await stdio.writeStderr(
      `Hevy API error ${error.status}${body ? `: ${body}` : ""}\n`,
    )
    if (debug) {
      await stdio.writeStderr(`URL: ${error.url}\nRaw body: ${error.body}\n`)
    }
    return
  }

  const message = error instanceof Error ? error.message : String(error)
  await stdio.writeStderr(`${message}\n`)
}

function parseErrorBody(body: string): string {
  if (!body) {
    return ""
  }

  try {
    const parsed = JSON.parse(body) as { error?: unknown; message?: unknown }
    if (typeof parsed.error === "string") {
      return parsed.error
    }
    if (typeof parsed.message === "string") {
      return parsed.message
    }
  } catch {
    return body
  }

  return body
}
