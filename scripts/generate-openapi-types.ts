#!/usr/bin/env bun

import { $ } from "bun";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const inputPath = "docs/hevy-openapi.json";
const tempPath = ".tmp/hevy-openapi.codegen.json";
const outputPath = "src/generated/hevy-openapi.d.ts";

function sanitizeOpenApi(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sanitizeOpenApi);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const sanitized: { [key: string]: JsonValue } = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "required" && !Array.isArray(child) && typeof child !== "boolean") {
      continue;
    }

    if (key === "required" && typeof child === "boolean") {
      continue;
    }

    sanitized[key] = sanitizeOpenApi(child);
  }

  return sanitized;
}

const spec = (await Bun.file(inputPath).json()) as JsonValue;
const sanitized = sanitizeOpenApi(spec);

await $`mkdir -p .tmp src/generated`;
await Bun.write(tempPath, `${JSON.stringify(sanitized, null, 2)}\n`);
await $`bunx openapi-typescript ${tempPath} -o ${outputPath}`;
await $`bunx oxfmt ${outputPath}`;

console.log(`Generated ${outputPath}`);
