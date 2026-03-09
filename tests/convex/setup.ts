/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import schema from "../../convex/schema";

// Module map for convex-test — passed explicitly so Vitest's bundler
// resolves the correct files regardless of working directory.
// The glob pattern must cover all .ts and .js files under convex/.
const modules = import.meta.glob("../../convex/**/*.*s");

export function makeTestEnv() {
  return convexTest(schema, modules);
}

export { api } from "../../convex/_generated/api";
