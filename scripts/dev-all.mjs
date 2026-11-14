import { spawn, execSync } from "node:child_process";

const apps = [
  { name: "GUEST :3000", cwd: "apps/guest", color: "\x1b[36m", port: 3000 },
  { name: "HOST  :3001", cwd: "apps/host", color: "\x1b[35m", port: 3001 },
  { name: "CMS   :3002", cwd: "apps/cms", color: "\x1b[32m", port: 3002 },
  { name: "ADMIN :3003", cwd: "apps/admin", color: "\x1b[33m", port: 3003 },
];

const reset = "\x1b[0m";
const children = [];

// Kill any stale orphan processes on the target ports before starting (especially on Windows)
function killStalePortProcesses() {
  if (process.platform === "win32") {
    try {
      execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,3001,3002,3003 -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -ne $PID) { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }"`,
        { stdio: "ignore" }
      );
    } catch {}
  }
}

console.log("\n========================================================");
console.log("🚀 Starting QafNest 4-App Monorepo Ecosystem...");
console.log("   🌐 Guest App : http://localhost:3000            (Prod: https://qafnest.com)");
console.log("   🏢 Host App  : http://localhost:3001            (Prod: https://business.qafnest.com)");
console.log("   📝 CMS App   : http://localhost:3002            (or cms.localhost:3002 · Prod: https://cms.qafnest.com)");
console.log("   🛡️  Admin App : http://localhost:3003            (or admin.localhost:3003 · Prod: https://admin.qafnest.com)");
console.log("========================================================\n");

killStalePortProcesses();

for (const app of apps) {
  const child = spawn("npm", ["run", "dev"], {
    cwd: app.cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
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

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${prefix}Process exited with code ${code}`);
    }
  });

  children.push(child);
}

function shutdown() {
  for (const child of children) {
    try {
      if (process.platform === "win32" && child.pid) {
        execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
      } else {
        child.kill("SIGTERM");
      }
    } catch {}
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Keep event loop alive indefinitely
setInterval(() => {}, 60000);
