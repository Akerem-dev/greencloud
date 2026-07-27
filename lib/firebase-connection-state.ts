import { onAuthStateChanged } from "firebase/auth";
import { goOnline, onValue, ref } from "firebase/database";

import {
  firebaseAuth,
  firebaseRuntimeConfig,
  GREENCLOUD_ROOT,
  realtimeDatabase,
} from "@/lib/firebase";

export type GreenCloudSyncStatus =
  | "checking"
  | "live"
  | "reconnecting"
  | "browser-offline"
  | "firebase-unavailable"
  | "emulator-unavailable";

export type GreenCloudConnectionSnapshot = {
  status: GreenCloudSyncStatus;
  browserOnline: boolean;
  firebaseConnected: boolean;
  runtimeLabel: string;
  runtimeTarget: string;
  errorMessage: string;
  lastSuccessfulSyncMs: number | null;
};

const CONNECTION_GRACE_MS = 4_000;
const LAST_SYNC_STORAGE_KEY = "greencloud-last-successful-sync-ms";

function runtimeDetails() {
  if (firebaseRuntimeConfig.useEmulators) {
    return {
      runtimeLabel: "Local Firebase Emulator Suite",
      runtimeTarget: `${firebaseRuntimeConfig.host}:${firebaseRuntimeConfig.databasePort}`,
    };
  }

  return {
    runtimeLabel: "Configured Firebase project",
    runtimeTarget: firebaseRuntimeConfig.projectId,
  };
}

function unavailableStatus(): GreenCloudSyncStatus {
  return firebaseRuntimeConfig.useEmulators
    ? "emulator-unavailable"
    : "firebase-unavailable";
}

function readStoredLastSync() {
  try {
    const stored = Number(window.localStorage.getItem(LAST_SYNC_STORAGE_KEY));
    return Number.isSafeInteger(stored) && stored > 0 ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredLastSync(value: number) {
  try {
    window.localStorage.setItem(LAST_SYNC_STORAGE_KEY, String(value));
  } catch {
    // Private mode or storage quotas can block this optional evidence cache.
  }
}

export function subscribeToGreenCloudConnection(
  onChange: (snapshot: GreenCloudConnectionSnapshot) => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const runtime = runtimeDetails();
  let browserOnline = navigator.onLine;
  let firebaseConnected = false;
  let hasConnectedOnce = false;
  let errorMessage = "";
  let lastSuccessfulSyncMs = readStoredLastSync();
  let graceTimer: ReturnType<typeof setTimeout> | null = null;
  let workspaceUnsubscribe: (() => void) | null = null;

  function clearGraceTimer() {
    if (graceTimer !== null) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }
  }

  function currentStatus(): GreenCloudSyncStatus {
    if (!browserOnline) return "browser-offline";
    if (firebaseConnected) return "live";
    return hasConnectedOnce ? "reconnecting" : "checking";
  }

  function emit(status: GreenCloudSyncStatus = currentStatus()) {
    onChange({
      status,
      browserOnline,
      firebaseConnected,
      errorMessage,
      lastSuccessfulSyncMs,
      ...runtime,
    });
  }

  function recordSuccessfulSync() {
    if (!browserOnline || !firebaseConnected) return;
    lastSuccessfulSyncMs = Date.now();
    writeStoredLastSync(lastSuccessfulSyncMs);
    emit("live");
  }

  function scheduleUnavailable() {
    clearGraceTimer();
    graceTimer = setTimeout(() => {
      if (!browserOnline || firebaseConnected) return;
      emit(unavailableStatus());
    }, CONNECTION_GRACE_MS);
  }

  function handleOnline() {
    browserOnline = true;
    errorMessage = "";
    emit(hasConnectedOnce ? "reconnecting" : "checking");
    goOnline(realtimeDatabase);
    scheduleUnavailable();
  }

  function handleOffline() {
    browserOnline = false;
    firebaseConnected = false;
    clearGraceTimer();
    emit("browser-offline");
  }

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  emit(browserOnline ? "checking" : "browser-offline");
  if (browserOnline) scheduleUnavailable();

  const authUnsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
    workspaceUnsubscribe?.();
    workspaceUnsubscribe = null;

    if (!user) {
      emit();
      return;
    }

    workspaceUnsubscribe = onValue(
      ref(realtimeDatabase, `${GREENCLOUD_ROOT}/users/${user.uid}`),
      () => {
        recordSuccessfulSync();
      },
      (error) => {
        errorMessage = error.message;
        emit(browserOnline ? unavailableStatus() : "browser-offline");
      },
    );
  });

  const connectionUnsubscribe = onValue(
    ref(realtimeDatabase, ".info/connected"),
    (snapshot) => {
      firebaseConnected = snapshot.val() === true;
      errorMessage = "";

      if (!browserOnline) {
        emit("browser-offline");
        return;
      }

      if (firebaseConnected) {
        hasConnectedOnce = true;
        clearGraceTimer();
        emit("live");
        return;
      }

      emit(hasConnectedOnce ? "reconnecting" : "checking");
      scheduleUnavailable();
    },
    (error) => {
      firebaseConnected = false;
      errorMessage = error.message;
      clearGraceTimer();
      emit(browserOnline ? unavailableStatus() : "browser-offline");
    },
  );

  return () => {
    clearGraceTimer();
    workspaceUnsubscribe?.();
    authUnsubscribe();
    connectionUnsubscribe();
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

export function retryGreenCloudConnection() {
  if (typeof window === "undefined" || !navigator.onLine) return false;
  goOnline(realtimeDatabase);
  return true;
}
