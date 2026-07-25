import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  FIREBASE_EMULATOR_DEFAULTS,
  resolveFirebaseRuntimeConfig,
} from "../lib/firebase-runtime-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = resolveFirebaseRuntimeConfig({
  nodeEnv: "development",
  useEmulators: "true",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    FIREBASE_EMULATOR_DEFAULTS.projectId,
  host:
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST ||
    FIREBASE_EMULATOR_DEFAULTS.host,
  authPort: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT,
  databasePort: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_EMULATOR_PORT,
  functionsPort: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT,
});

function probePort(host, port, label) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`${label} emulator did not respond on ${host}:${port}.`));
    }, 1500);

    socket.once("connect", () => {
      clearTimeout(timer);
      socket.end();
      resolve();
    });

    socket.once("error", (error) => {
      clearTimeout(timer);
      socket.destroy();
      reject(
        new Error(
          `${label} emulator is unavailable on ${host}:${port}: ${error.message}`,
        ),
      );
    });
  });
}

async function verifyEmulators() {
  const checks = [
    probePort(runtime.host, runtime.authPort, "Authentication"),
    probePort(runtime.host, runtime.databasePort, "Realtime Database"),
    probePort(runtime.host, runtime.functionsPort, "Functions"),
  ];

  const results = await Promise.allSettled(checks);
  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason.message);

  if (failures.length > 0) {
    console.error("\n[GreenCloud] Isolated development was blocked safely.\n");
    for (const failure of failures) console.error(`- ${failure}`);
    console.error(
      "\nStart the local Firebase stack in another terminal with:\n  npm run emulators:start\n",
    );
    process.exitCode = 1;
    return false;
  }

  return true;
}

function startNextDevelopmentServer() {
  const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextCli, "dev"], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: runtime.projectId,
      NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: runtime.host,
      NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: String(runtime.authPort),
      NEXT_PUBLIC_FIREBASE_DATABASE_EMULATOR_PORT: String(
        runtime.databasePort,
      ),
      NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT: String(
        runtime.functionsPort,
      ),
    },
  });

  const forwardSignal = (signal) => {
    if (!child.killed) child.kill(signal);
  };

  process.once("SIGINT", () => forwardSignal("SIGINT"));
  process.once("SIGTERM", () => forwardSignal("SIGTERM"));

  child.once("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exitCode = code ?? 1;
  });
}

if (await verifyEmulators()) {
  console.log(
    `[GreenCloud] Firebase isolation verified for ${runtime.projectId} at ${runtime.host}.`,
  );
  startNextDevelopmentServer();
}
