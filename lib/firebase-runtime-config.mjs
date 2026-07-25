export const FIREBASE_EMULATOR_DEFAULTS = Object.freeze({
  projectId: "demo-greencloud",
  host: "127.0.0.1",
  authPort: 9099,
  databasePort: 9000,
  functionsPort: 5001,
});

const CONTROL_OR_BIDI_PATTERN =
  /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u;
const DEMO_PROJECT_PATTERN = /^demo-[a-z0-9-]+$/u;

export class FirebaseRuntimeConfigurationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "FirebaseRuntimeConfigurationError";
    this.code = code;
  }
}

function normalizeTarget(value, nodeEnv) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (!normalized) {
    if (nodeEnv === "development") {
      throw new FirebaseRuntimeConfigurationError(
        "Firebase target is required in development. Use npm run dev:isolated for emulator-only development or set NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false explicitly.",
        "target-required",
      );
    }

    return false;
  }

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  throw new FirebaseRuntimeConfigurationError(
    "NEXT_PUBLIC_USE_FIREBASE_EMULATORS must be exactly true or false.",
    "invalid-target",
  );
}

function isLoopbackHost(value) {
  if (value.toLowerCase() === "localhost") return true;

  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "127") return false;

  return parts.every(
    (part) => /^\d{1,3}$/u.test(part) && Number(part) >= 0 && Number(part) <= 255,
  );
}

function normalizeHost(value) {
  const normalized =
    typeof value === "string" && value.trim()
      ? value.trim()
      : FIREBASE_EMULATOR_DEFAULTS.host;

  if (
    CONTROL_OR_BIDI_PATTERN.test(normalized) ||
    !isLoopbackHost(normalized)
  ) {
    throw new FirebaseRuntimeConfigurationError(
      "Firebase emulator host must be localhost or a 127.0.0.0/8 loopback address.",
      "invalid-host",
    );
  }

  return normalized;
}

function normalizePort(value, fallback, label) {
  if (value === undefined || value === null || value === "") return fallback;

  const normalized =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/u.test(value.trim())
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 65535) {
    throw new FirebaseRuntimeConfigurationError(
      `${label} emulator port must be an integer between 1 and 65535.`,
      "invalid-port",
    );
  }

  return normalized;
}

function normalizeDemoProjectId(value) {
  const normalized =
    typeof value === "string" && value.trim()
      ? value.trim()
      : FIREBASE_EMULATOR_DEFAULTS.projectId;

  if (!DEMO_PROJECT_PATTERN.test(normalized)) {
    throw new FirebaseRuntimeConfigurationError(
      "Emulator mode requires a demo-* Firebase project ID so non-emulated services cannot reach a real project.",
      "unsafe-emulator-project",
    );
  }

  return normalized;
}

export function resolveFirebaseRuntimeConfig({
  nodeEnv = "production",
  useEmulators,
  projectId,
  host,
  authPort,
  databasePort,
  functionsPort,
} = {}) {
  const emulatorMode = normalizeTarget(useEmulators, nodeEnv);

  if (!emulatorMode) {
    return Object.freeze({
      target: "production",
      useEmulators: false,
    });
  }

  const resolvedProjectId = normalizeDemoProjectId(projectId);
  const resolvedHost = normalizeHost(host);
  const resolvedAuthPort = normalizePort(
    authPort,
    FIREBASE_EMULATOR_DEFAULTS.authPort,
    "Authentication",
  );
  const resolvedDatabasePort = normalizePort(
    databasePort,
    FIREBASE_EMULATOR_DEFAULTS.databasePort,
    "Realtime Database",
  );
  const resolvedFunctionsPort = normalizePort(
    functionsPort,
    FIREBASE_EMULATOR_DEFAULTS.functionsPort,
    "Functions",
  );

  return Object.freeze({
    target: "emulator",
    useEmulators: true,
    projectId: resolvedProjectId,
    host: resolvedHost,
    authPort: resolvedAuthPort,
    databasePort: resolvedDatabasePort,
    functionsPort: resolvedFunctionsPort,
    authUrl: `http://${resolvedHost}:${resolvedAuthPort}`,
    databaseUrl: `http://${resolvedHost}:${resolvedDatabasePort}?ns=${resolvedProjectId}-default-rtdb`,
  });
}
