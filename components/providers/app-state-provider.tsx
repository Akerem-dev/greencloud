"use client";

import { useCallback, useMemo, type ReactNode } from "react";

import {
  firebaseAuth,
  firebaseFunctions,
  realtimeDatabase,
} from "@/lib/firebase";
import {
  PairingFlowError,
  pairDeviceWithProtectedClaim,
} from "@/lib/firebase-pairing-flow.mjs";
import {
  AppStateProvider as BaseAppStateProvider,
  useAppState as useBaseAppState,
  type AppStateContextValue,
  type Device,
} from "@/components/providers/app-state-provider-base";

export type {
  ActivityItem,
  ActivityStatus,
  AmbienceMode,
  AppStateContextValue,
  AutomationMode,
  AutomationState,
  ButtonStatus,
  CommandStatus,
  Device,
  DeviceStatus,
  NotificationItem,
  NotificationMode,
  OledStatus,
  PumpState,
  RainStatus,
  RelayState,
  SensorStatus,
  SessionState,
  SettingsState,
  ThemePreset,
  WaterLevelStatus,
} from "@/components/providers/app-state-provider-base";

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function pairedResultToDevice(
  result: Awaited<ReturnType<typeof pairDeviceWithProtectedClaim>>,
  requestedName?: string,
  requestedPlace?: string,
): Device {
  const source = result.device as Partial<Device>;
  const name =
    typeof source.name === "string" && source.name.trim()
      ? source.name
      : requestedName?.trim() || "GreenCloud Device";
  const place =
    typeof source.place === "string" && source.place.trim()
      ? source.place
      : requestedPlace?.trim() || "Plant zone";
  const finalizedAt = Number.isSafeInteger(result.finalizedAtMs)
    ? new Date(result.finalizedAtMs).toISOString()
    : undefined;

  return {
    ...source,
    id: result.deviceId,
    name,
    place,
    location:
      typeof source.location === "string" && source.location.trim()
        ? source.location
        : place,
    moisture: optionalNumber(source.moisture) ?? 0,
    signal: optionalNumber(source.signal) ?? 0,
    status:
      source.status === "Online" ||
      source.status === "Idle" ||
      source.status === "Syncing" ||
      source.status === "Offline"
        ? source.status
        : "Idle",
    updatedAt:
      typeof source.updatedAt === "string"
        ? source.updatedAt
        : "Waiting for device",
    pairingCode: result.pairingCode,
    pairedAt:
      typeof source.pairedAt === "string" ? source.pairedAt : finalizedAt,
    ownerUid: result.ownerUid,
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  return <BaseAppStateProvider>{children}</BaseAppStateProvider>;
}

export function useAppState(): AppStateContextValue {
  const base = useBaseAppState();

  const pairDeviceByCode = useCallback(
    async (code: string, name?: string, place?: string) => {
      const user = firebaseAuth.currentUser;

      if (!user) {
        throw new Error("Sign in before pairing a device.");
      }

      try {
        const result = await pairDeviceWithProtectedClaim({
          database: realtimeDatabase,
          functions: firebaseFunctions,
          userId: user.uid,
          code,
          name,
          place,
        });

        return pairedResultToDevice(result, name, place);
      } catch (error) {
        if (error instanceof PairingFlowError) {
          throw new Error(error.message, { cause: error });
        }

        throw error;
      }
    },
    [],
  );

  return useMemo(
    () => ({
      ...base,
      pairDeviceByCode,
    }),
    [base, pairDeviceByCode],
  );
}
