import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

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

const firebaseConfig: FirebaseOptions = {
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

export const GREENCLOUD_ROOT = "greencloud";