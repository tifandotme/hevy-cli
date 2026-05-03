export interface Stdio {
  writeStdout(text: string): Promise<void>
  writeStderr(text: string): Promise<void>
  readStdin(): Promise<string>
  isInteractive(): boolean
}

export const defaultStdio: Stdio = {
  async writeStdout(text) {
    await Bun.write(Bun.stdout, text)
  },
  async writeStderr(text) {
    await Bun.write(Bun.stderr, text)
  },
  async readStdin() {
    return await Bun.stdin.text()
  },
  isInteractive() {
    const stdin = Bun.stdin as { isTTY?: boolean }
    const stdout = Bun.stdout as { isTTY?: boolean }
    return Boolean(stdin.isTTY && stdout.isTTY)
  },
}

export function createMemoryStdio(input = ""): Stdio & {
  stdout: string[]
  stderr: string[]
} {
  const stdout: string[] = []
  const stderr: string[] = []
  return {
    stdout,
    stderr,
    async writeStdout(text) {
      stdout.push(text)
    },
    async writeStderr(text) {
      stderr.push(text)
    },
    async readStdin() {
      return input
    },
    isInteractive() {
      return false
    },
  }
}
