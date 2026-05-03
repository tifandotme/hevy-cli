import type { Stdio } from "./stdio"

export interface AuthConfig {
  apiKey?: string
}

export interface AuthOptions {
  env?: Record<string, string | undefined> | undefined
  configHome?: string | undefined
}

function homeDir(env: Record<string, string | undefined>): string {
  const home = env.HOME
  if (!home) {
    throw new Error("HOME is required to locate Hevy config")
  }
  return home
}

export function configDir(options: AuthOptions = {}): string {
  const env = options.env ?? Bun.env
  if (options.configHome) {
    return `${options.configHome}/hevy`
  }
  if (env.XDG_CONFIG_HOME) {
    return `${env.XDG_CONFIG_HOME}/hevy`
  }
  return `${homeDir(env)}/.config/hevy`
}

export function configPath(options: AuthOptions = {}): string {
  return `${configDir(options)}/config.json`
}

export async function readLocalAuthConfig(
  options: AuthOptions = {},
): Promise<AuthConfig> {
  const path = configPath(options)
  const file = Bun.file(path)
  if (!(await file.exists())) {
    return {}
  }

  const parsed = (await file.json()) as Partial<AuthConfig>
  return typeof parsed.apiKey === "string" ? { apiKey: parsed.apiKey } : {}
}

export async function resolveApiKey(
  options: AuthOptions = {},
): Promise<string> {
  const env = options.env ?? Bun.env
  if (env.HEVY_API_KEY) {
    return env.HEVY_API_KEY
  }

  const config = await readLocalAuthConfig(options)
  if (config.apiKey) {
    return config.apiKey
  }

  throw new Error(
    "Missing Hevy API key. Set HEVY_API_KEY or run `hevy auth login`.",
  )
}

export async function saveApiKey(
  apiKey: string,
  options: AuthOptions = {},
): Promise<string> {
  const dir = configDir(options)
  const path = configPath(options)
  await Bun.$`mkdir -p ${dir}`
  await Bun.$`chmod 700 ${dir}`
  await Bun.write(path, `${JSON.stringify({ apiKey }, null, 2)}\n`)
  await Bun.$`chmod 600 ${path}`
  return path
}

export async function clearApiKey(options: AuthOptions = {}): Promise<boolean> {
  const path = configPath(options)
  const file = Bun.file(path)
  if (!(await file.exists())) {
    return false
  }
  await file.delete()
  return true
}

export async function readApiKeyFromPrompt(stdio: Stdio): Promise<string> {
  await stdio.writeStderr("Paste your Hevy API key: ")
  const input = await stdio.readStdin()
  const apiKey = input.trim()
  if (!apiKey) {
    throw new Error("API key cannot be empty")
  }
  return apiKey
}
