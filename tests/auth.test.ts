import { afterEach, expect, test } from "bun:test";
import { clearApiKey, configPath, resolveApiKey, saveApiKey } from "../src/auth";

const tempDirs: string[] = [];

function tempConfigHome(): string {
  const dir = `${Bun.env.PWD}/.tmp/test-${crypto.randomUUID()}`;
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => Bun.$`rm -rf ${dir}`));
});

test("HEVY_API_KEY takes precedence over local config", async () => {
  const configHome = tempConfigHome();
  await saveApiKey("local-key", { configHome, env: { HOME: configHome } });

  await expect(
    resolveApiKey({
      configHome,
      env: { HOME: configHome, HEVY_API_KEY: "env-key" },
    }),
  ).resolves.toBe("env-key");
});

test("saved API key is read from XDG config", async () => {
  const configHome = tempConfigHome();
  const path = await saveApiKey("local-key", {
    configHome,
    env: { HOME: configHome },
  });

  expect(path).toBe(configPath({ configHome, env: { HOME: configHome } }));
  await expect(resolveApiKey({ configHome, env: { HOME: configHome } })).resolves.toBe("local-key");
});

test("clearApiKey removes saved key", async () => {
  const configHome = tempConfigHome();
  await saveApiKey("local-key", { configHome, env: { HOME: configHome } });

  await expect(clearApiKey({ configHome, env: { HOME: configHome } })).resolves.toBe(true);
  await expect(clearApiKey({ configHome, env: { HOME: configHome } })).resolves.toBe(false);
});
