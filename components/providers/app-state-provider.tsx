"use client";

import { useCallback, useMemo, type ReactNode } from "react";

import {
  firebaseAuth,
  firebaseFunctions,
  realtimeDatabase,
} from "@/lib/firebase";
import { pairedResultToDevice } from "@/lib/firebase-pairing-device.mjs";
import {
  PairingFlowError,
  pairDeviceWithProtectedClaim,
} from "@/lib/firebase-pairing-flow.mjs";
import {
  AppStateProvider as BaseAppStateProvider,
  useAppState as useBaseAppState,
  type ActivityItem,
  type AppStateContextValue,
  type Device,
  type NotificationItem,
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

function normalizeProtectedPairingCopy(value: string) {
  return value.replaceAll("7-character", "six-character");
}

function normalizeActivityPairingCopy(item: ActivityItem): ActivityItem {
  const description = normalizeProtectedPairingCopy(item.description);
  const body = item.body
    ? normalizeProtectedPairingCopy(item.body)
    : item.body;

  if (description === item.description && body === item.body) {
    return item;
  }

  return {
    ...item,
    description,
    body,
  };
}

function normalizeNotificationPairingCopy(
  item: NotificationItem,
): NotificationItem {
  const body = normalizeProtectedPairingCopy(item.body);
  const description = normalizeProtectedPairingCopy(item.description);

  if (body === item.body && description === item.description) {
    return item;
  }

  return {
    ...item,
    body,
    description,
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

        return pairedResultToDevice(result, name, place) as Device;
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
      activityFeed: base.activityFeed.map(normalizeActivityPairingCopy),
      filteredActivity: base.filteredActivity.map(normalizeActivityPairingCopy),
      notifications: base.notifications.map(normalizeNotificationPairingCopy),
      pairDeviceByCode,
    }),
    [base, pairDeviceByCode],
  );
}
