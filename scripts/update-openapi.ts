#!/usr/bin/env bun

import { $ } from "bun";

const specUrl = Bun.env.HEVY_OPENAPI_URL;

if (!specUrl) {
  console.error("HEVY_OPENAPI_URL is required");
  process.exit(1);
}

const docsDir = "docs";
const jsonPath = `${docsDir}/hevy-openapi.json`;
const toonPath = `${docsDir}/hevy-openapi.toon`;

await $`mkdir -p ${docsDir}`;

let response: Response;
try {
  response = await fetch(specUrl, {
    headers: {
      Accept: "application/json, application/yaml, text/yaml, */*",
    },
  });
} catch (error) {
  console.error(`Failed to fetch OpenAPI spec from ${specUrl}`);
  console.error(error);
  process.exit(1);
}

if (!response.ok) {
  console.error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const contentType = response.headers.get("content-type") ?? "";
const body = await response.text();

let spec: unknown;
try {
  spec = JSON.parse(body);
} catch (error) {
  console.error(`Expected ${specUrl} to return JSON. Content-Type: ${contentType}`);
  console.error(error);
  process.exit(1);
}

await Bun.write(jsonPath, `${JSON.stringify(spec, null, 2)}\n`);
await $`bunx --yes @toon-format/cli --encode ${jsonPath} --output ${toonPath}`;

console.log(`Updated ${jsonPath}`);
console.log(`Updated ${toonPath}`);
