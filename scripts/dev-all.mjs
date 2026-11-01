import { spawn } from "node:child_process";

const apps = [
  { name: "GUEST :3000", cwd: "apps/guest", color: "\x1b[36m", port: "3000" },
  { name: "HOST  :3001", cwd: "apps/host", color: "\x1b[35m", port: "3001" },
  { name: "CMS   :3002", cwd: "apps/cms", color: "\x1b[32m", port: "3002" },
];

const reset = "\x1b[0m";
const children = [];

console.log("\n========================================================");
console.log("🚀 Starting QafNest 3-App Monorepo Ecosystem...");
console.log("   🌐 Guest App : http://localhost:3000");
console.log("   🏢 Host App  : http://localhost:3001");
console.log("   🛡️  CMS App   : http://localhost:3002");
console.log("========================================================\n");

for (const app of apps) {
  const child = spawn("npx", ["next", "dev", "-p", app.port], {
    cwd: app.cwd,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  const prefix = `${app.color}[${app.name}]${reset} `;

  child.stdout.on("data", (chunk) => {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      if (line.trim()) process.stdout.write(`${prefix}${line}\n`);
    }
  });

  child.stderr.on("data", (chunk) => {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      if (line.trim()) process.stderr.write(`${prefix}${line}\n`);
    }
  });

  children.push(child);
}

function shutdown() {
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {}
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
