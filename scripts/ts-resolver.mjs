import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith("@/")) {
      const candidateBase = path.resolve("apps/guest/src", specifier.slice(2));
      for (const ext of ["", ".ts", ".tsx", ".js", ".mjs", "/index.ts"]) {
        const candidate = candidateBase + ext;
        if (fs.existsSync(candidate)) {
          return {
            shortCircuit: true,
            url: pathToFileURL(candidate).href,
          };
        }
      }
    }
    if (
      err.code === "ERR_MODULE_NOT_FOUND" &&
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of [".ts", ".tsx", ".js", ".mjs", "/index.ts"]) {
        const candidate = path.resolve(parentDir, specifier + ext);
        if (fs.existsSync(candidate)) {
          return {
            shortCircuit: true,
            url: pathToFileURL(candidate).href,
          };
        }
      }
    }
    throw err;
  }
}
