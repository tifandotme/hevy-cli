import type { Stdio } from "./stdio"

export async function readJsonBody<T = unknown>(
  source: string | undefined,
  stdio: Stdio,
): Promise<T> {
  if (!source) {
    throw new Error(
      "Missing request body. Pass --body <json>, --body @file.json, or --body -.",
    )
  }

  let text: string
  if (source === "-") {
    text = await stdio.readStdin()
  } else if (source.startsWith("@")) {
    text = await Bun.file(source.slice(1)).text()
  } else {
    text = source
  }

  try {
    return JSON.parse(text) as T
  } catch (error) {
    throw new Error(
      `Invalid JSON body: ${error instanceof Error ? error.message : String(error)}`,
      {
        cause: error,
      },
    )
  }
}
