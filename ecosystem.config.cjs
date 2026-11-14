const path = require("node:path");

const NEXT_BIN = path.join(__dirname, "node_modules", "next", "dist", "bin", "next");

const GUEST_PORT = Number(process.env.QAFNEST_GUEST_PORT || 3000);
const HOST_PORT = Number(process.env.QAFNEST_HOST_PORT || 3001);
const CMS_PORT = Number(process.env.QAFNEST_CMS_PORT || 3002);
const ADMIN_PORT = Number(process.env.QAFNEST_ADMIN_PORT || 3003);

const SHARED_PUBLIC_URLS = {
  NEXT_PUBLIC_GUEST_URL: process.env.NEXT_PUBLIC_GUEST_URL || "https://qafnest.com",
  NEXT_PUBLIC_HOST_PORTAL_URL:
    process.env.NEXT_PUBLIC_HOST_PORTAL_URL || "https://business.qafnest.com",
  NEXT_PUBLIC_CMS_PORTAL_URL:
    process.env.NEXT_PUBLIC_CMS_PORTAL_URL || "https://cms.qafnest.com",
  NEXT_PUBLIC_ADMIN_PORTAL_URL:
    process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || "https://admin.qafnest.com",
};

module.exports = {
  apps: [
    {
      name: "qafnest-guest",
      cwd: path.join(__dirname, "apps", "guest"),
      script: NEXT_BIN,
      args: `start -H 127.0.0.1 -p ${GUEST_PORT}`,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "900M",
      env: {
        NODE_ENV: "production",
        PORT: GUEST_PORT,
        NEXT_PUBLIC_SITE_URL: SHARED_PUBLIC_URLS.NEXT_PUBLIC_GUEST_URL,
        ...SHARED_PUBLIC_URLS,
      },
    },
    {
      name: "qafnest-host",
      cwd: path.join(__dirname, "apps", "host"),
      script: NEXT_BIN,
      args: `start -H 127.0.0.1 -p ${HOST_PORT}`,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "900M",
      env: {
        NODE_ENV: "production",
        PORT: HOST_PORT,
        NEXT_PUBLIC_SITE_URL: SHARED_PUBLIC_URLS.NEXT_PUBLIC_HOST_PORTAL_URL,
        ...SHARED_PUBLIC_URLS,
      },
    },
    {
      name: "qafnest-cms",
      cwd: path.join(__dirname, "apps", "cms"),
      script: NEXT_BIN,
      args: `start -H 127.0.0.1 -p ${CMS_PORT}`,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production",
        PORT: CMS_PORT,
        NEXT_PUBLIC_SITE_URL: SHARED_PUBLIC_URLS.NEXT_PUBLIC_CMS_PORTAL_URL,
        ...SHARED_PUBLIC_URLS,
      },
    },
    {
      name: "qafnest-admin",
      cwd: path.join(__dirname, "apps", "admin"),
      script: NEXT_BIN,
      args: `start -H 127.0.0.1 -p ${ADMIN_PORT}`,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "900M",
      env: {
        NODE_ENV: "production",
        PORT: ADMIN_PORT,
        NEXT_PUBLIC_SITE_URL: SHARED_PUBLIC_URLS.NEXT_PUBLIC_ADMIN_PORTAL_URL,
        ...SHARED_PUBLIC_URLS,
      },
    },
  ],
};
