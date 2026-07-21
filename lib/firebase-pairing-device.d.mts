import type { PairingFlowResult } from "./firebase-pairing-flow.mjs";

export type PairingMappedDevice = Record<string, unknown> & {
  id: string;
  name: string;
  place: string;
  location: string;
  moisture: number;
  signal: number;
  status: "Online" | "Idle" | "Syncing" | "Offline";
  updatedAt: string;
  pairingCode: string;
  pairedAt?: string;
  ownerUid: string;
};

export function pairedResultToDevice(
  result: PairingFlowResult,
  requestedName?: string,
  requestedPlace?: string,
): PairingMappedDevice;
