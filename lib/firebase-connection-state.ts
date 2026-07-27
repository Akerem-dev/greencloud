import { goOnline, onValue, ref } from "firebase/database";

import {
  firebaseRuntimeConfig,
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
};

const CONNECTION_GRACE_MS = 4_000;

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
  let graceTimer: ReturnType<typeof setTimeout> | null = null;

  function clearGraceTimer() {
    if (graceTimer !== null) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }
  }

  function emit(status: GreenCloudSyncStatus) {
    onChange({
      status,
      browserOnline,
      firebaseConnected,
      errorMessage,
      ...runtime,
    });
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

  const unsubscribe = onValue(
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
    unsubscribe();
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

export function retryGreenCloudConnection() {
  if (typeof window === "undefined" || !navigator.onLine) return false;
  goOnline(realtimeDatabase);
  return true;
}
