import type { Device } from "@/components/providers/app-state-provider";
import {
  firebaseAuth,
  firebaseFunctions,
} from "@/lib/firebase";
import { assertDeviceMutationTarget } from "@/lib/device-mutation-safety.mjs";
import { unpairDeviceWithTrustedCallable } from "@/lib/firebase-device-unpair.mjs";

export type TrustedDeviceUnpairResult = {
  deviceId: string;
  ownerUid: string;
  pairingCode?: string;
  requestId: string;
  unpairedAtMs: number;
  idempotent: boolean;
  factoryResetQueued: true;
  selectedDeviceId: string;
};

export async function requestTrustedDeviceUnpair({
  devices,
  deviceId,
}: {
  devices: Device[];
  deviceId: string;
}) {
  const user = firebaseAuth.currentUser;
  const target = assertDeviceMutationTarget({
    authenticated: Boolean(user),
    userId: user?.uid,
    devices,
    deviceId,
  }) as Device;

  if (!user) {
    throw new Error("Sign in before removing a device.");
  }

  const result = (await unpairDeviceWithTrustedCallable({
    functions: firebaseFunctions,
    userId: user.uid,
    deviceId: target.id,
  })) as TrustedDeviceUnpairResult;

  return { target, result };
}
