import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseOptions,
} from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { resolveFirebaseRuntimeConfig } from "@/lib/firebase-runtime-config.mjs";

type EmulatorConnectionState = {
  auth: boolean;
  database: boolean;
  functions: boolean;
};

declare global {
  var __greenCloudFirebaseEmulatorConnections:
    | EmulatorConnectionState
    | undefined;
}

function requirePublicEnv(name: string, value: string | undefined) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(
      `[GreenCloud] Missing required environment variable: ${name}`,
    );
  }

  return normalizedValue;
}

function optionalPublicEnv(value: string | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue || undefined;
}

export const firebaseRuntimeConfig = resolveFirebaseRuntimeConfig({
  nodeEnv: process.env.NODE_ENV,
  useEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  host: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST,
  authPort: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT,
  databasePort: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_EMULATOR_PORT,
  functionsPort: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT,
});

const firebaseConfig: FirebaseOptions = firebaseRuntimeConfig.useEmulators
  ? {
      apiKey: "demo-api-key",
      authDomain: `${firebaseRuntimeConfig.projectId}.firebaseapp.com`,
      databaseURL: firebaseRuntimeConfig.databaseUrl,
      projectId: firebaseRuntimeConfig.projectId,
    }
  : {
      apiKey: requirePublicEnv(
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      ),
      authDomain: requirePublicEnv(
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      ),
      databaseURL: requirePublicEnv(
        "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
        process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      ),
      projectId: requirePublicEnv(
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      ),
      storageBucket: optionalPublicEnv(
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      ),
      messagingSenderId: optionalPublicEnv(
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      ),
      appId: optionalPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
    };

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const realtimeDatabase = getDatabase(firebaseApp);
export const firebaseFunctions = getFunctions(firebaseApp, "europe-west1");

function connectConfiguredFirebaseEmulators() {
  if (
    typeof window === "undefined" ||
    !firebaseRuntimeConfig.useEmulators
  ) {
    return;
  }

  const state =
    globalThis.__greenCloudFirebaseEmulatorConnections ??
    (globalThis.__greenCloudFirebaseEmulatorConnections = {
      auth: false,
      database: false,
      functions: false,
    });

  if (!state.auth) {
    connectAuthEmulator(firebaseAuth, firebaseRuntimeConfig.authUrl, {
      disableWarnings: true,
    });
    state.auth = true;
  }

  if (!state.database) {
    connectDatabaseEmulator(
      realtimeDatabase,
      firebaseRuntimeConfig.host,
      firebaseRuntimeConfig.databasePort,
    );
    state.database = true;
  }

  if (!state.functions) {
    connectFunctionsEmulator(
      firebaseFunctions,
      firebaseRuntimeConfig.host,
      firebaseRuntimeConfig.functionsPort,
    );
    state.functions = true;
  }
}

connectConfiguredFirebaseEmulators();

export const GREENCLOUD_ROOT = "greencloud";
