#!/usr/bin/env bun

import { $ } from "bun"

const swaggerUiInitUrl = "https://api.hevyapp.com/docs/swagger-ui-init.js"
const docsDir = "docs"
const jsonPath = `${docsDir}/hevy-openapi.json`
const toonPath = `${docsDir}/hevy-openapi.toon`

function extractSwaggerDoc(source: string): unknown {
  const propertyIndex = source.indexOf('"swaggerDoc"')
  if (propertyIndex === -1) {
    throw new Error('Could not find "swaggerDoc" in swagger-ui-init.js')
  }

  const colonIndex = source.indexOf(":", propertyIndex)
  if (colonIndex === -1) {
    throw new Error('Could not find "swaggerDoc" value in swagger-ui-init.js')
  }

  const objectStart = source.indexOf("{", colonIndex)
  if (objectStart === -1) {
    throw new Error('Could not find "swaggerDoc" object in swagger-ui-init.js')
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === "{") {
      depth += 1
    } else if (char === "}") {
      depth -= 1
      if (depth === 0) {
        return JSON.parse(source.slice(objectStart, index + 1))
      }
    }
  }

  throw new Error('Could not parse "swaggerDoc" object from swagger-ui-init.js')
}

await $`mkdir -p ${docsDir}`

let response: Response
try {
  response = await fetch(swaggerUiInitUrl)
} catch (error) {
  console.error(`Failed to fetch ${swaggerUiInitUrl}`)
  console.error(error)
  process.exit(1)
}

if (!response.ok) {
  console.error(
    `Failed to fetch ${swaggerUiInitUrl}: ${response.status} ${response.statusText}`,
  )
  process.exit(1)
}

const source = await response.text()
const spec = extractSwaggerDoc(source)

await Bun.write(jsonPath, `${JSON.stringify(spec, null, 2)}\n`)
await $`bunx oxfmt ${jsonPath}`
await $`bunx --yes @toon-format/cli --encode ${jsonPath} --output ${toonPath}`
await $`bun run generate:openapi-types`

console.log(`Updated ${jsonPath}`)
console.log(`Updated ${toonPath}`)
