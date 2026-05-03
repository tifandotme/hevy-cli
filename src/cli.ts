#!/usr/bin/env bun

import { runMain } from "citty";
import { createRootCommand } from "./commands";
import { printError } from "./output";
import { defaultStdio } from "./stdio";

const debug = Bun.argv.includes("--debug");

try {
  await runMain(createRootCommand({ stdio: defaultStdio }));
} catch (error) {
  await printError(defaultStdio, error, debug);
  process.exit(1);
}
