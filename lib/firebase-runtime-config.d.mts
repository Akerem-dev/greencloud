export type FirebaseRuntimeTarget = "production" | "emulator";

export type FirebaseRuntimeConfigInput = {
  nodeEnv?: string;
  useEmulators?: string | boolean | null;
  projectId?: string | null;
  host?: string | null;
  authPort?: string | number | null;
  databasePort?: string | number | null;
  functionsPort?: string | number | null;
};

export type ProductionFirebaseRuntimeConfig = Readonly<{
  target: "production";
  useEmulators: false;
}>;

export type EmulatorFirebaseRuntimeConfig = Readonly<{
  target: "emulator";
  useEmulators: true;
  projectId: string;
  host: string;
  authPort: number;
  databasePort: number;
  functionsPort: number;
  authUrl: string;
  databaseUrl: string;
}>;

export type FirebaseRuntimeConfig =
  | ProductionFirebaseRuntimeConfig
  | EmulatorFirebaseRuntimeConfig;

export const FIREBASE_EMULATOR_DEFAULTS: Readonly<{
  projectId: "demo-greencloud";
  host: "127.0.0.1";
  authPort: 9099;
  databasePort: 9000;
  functionsPort: 5001;
}>;

export class FirebaseRuntimeConfigurationError extends Error {
  readonly code: string;

  constructor(message: string, code: string);
}

export function resolveFirebaseRuntimeConfig(
  input?: FirebaseRuntimeConfigInput,
): FirebaseRuntimeConfig;
