"use client";

import { useCallback, useMemo, type ReactNode } from "react";

import {
  firebaseAuth,
  firebaseFunctions,
  realtimeDatabase,
} from "@/lib/firebase";
import {
  AUTOMATION_COMMAND_BLOCKED_EVENT,
  getManualIrrigationDecision,
  normalizeAutomationPatch,
} from "@/lib/automation-safety.mjs";
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
  type AutomationState,
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

function hasAutomationTelemetry(device: Device) {
  return (
    device.status === "Online" ||
    typeof device.lastSeenMs === "number" ||
    device.signal > 0
  );
}

function emitBlockedAutomationCommand(reason: string) {
  window.dispatchEvent(
    new CustomEvent(AUTOMATION_COMMAND_BLOCKED_EVENT, {
      detail: { reason },
    }),
  );
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  return <BaseAppStateProvider>{children}</BaseAppStateProvider>;
}

export function useAppState(): AppStateContextValue {
  const base = useBaseAppState();
  const {
    automation,
    devices,
    selectedDevice,
    startIrrigation: startBaseIrrigation,
    updateAutomation: updateBaseAutomation,
  } = base;

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

  const updateAutomation = useCallback(
    (
      keyOrPatch: keyof AutomationState | Partial<AutomationState>,
      value?: AutomationState[keyof AutomationState],
    ) => {
      const patch =
        typeof keyOrPatch === "string"
          ? ({ [keyOrPatch]: value } as Partial<AutomationState>)
          : keyOrPatch;

      const normalized = normalizeAutomationPatch(
        automation,
        patch,
      ) as AutomationState;

      updateBaseAutomation(normalized);
    },
    [automation, updateBaseAutomation],
  ) as AppStateContextValue["updateAutomation"];

  const startIrrigation = useCallback(
    (deviceId?: string) => {
      const targetId = deviceId ?? selectedDevice.id;
      const target = devices.find((device) => device.id === targetId);
      const hasRealDevice = Boolean(target && target.id !== "device-waiting");
      const commandTarget = target ?? selectedDevice;

      const decision = getManualIrrigationDecision({
        authenticated: Boolean(firebaseAuth.currentUser),
        hasRealDevice,
        manualOverrideEnabled: automation.manualOverrideEnabled,
        telemetryReady: hasAutomationTelemetry(commandTarget),
        deviceStatus: commandTarget.status,
        sensorStatus: commandTarget.sensorStatus,
        rainStatus: commandTarget.rainStatus,
        waterLevelStatus: commandTarget.waterLevelStatus,
      });

      if (!decision.allowed) {
        emitBlockedAutomationCommand(decision.reason);
        return;
      }

      startBaseIrrigation(commandTarget.id);
    },
    [
      automation.manualOverrideEnabled,
      devices,
      selectedDevice,
      startBaseIrrigation,
    ],
  );

  return useMemo(
    () => ({
      ...base,
      activityFeed: base.activityFeed.map(normalizeActivityPairingCopy),
      filteredActivity: base.filteredActivity.map(normalizeActivityPairingCopy),
      notifications: base.notifications.map(normalizeNotificationPairingCopy),
      pairDeviceByCode,
      updateAutomation,
      startIrrigation,
    }),
    [base, pairDeviceByCode, startIrrigation, updateAutomation],
  );
}
