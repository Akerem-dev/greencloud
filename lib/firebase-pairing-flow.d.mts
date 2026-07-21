import type { Database } from "firebase/database";
import type { Functions } from "firebase/functions";

export type PairingFlowDevice = Record<string, unknown> & {
  id: string;
  ownerUid: string;
  name?: string;
  place?: string;
};

export type PairingFlowResult = Record<string, unknown> & {
  pairingCode: string;
  deviceId: string;
  ownerUid: string;
  finalizedAtMs: number;
  idempotent: boolean;
  workspaceProjected: boolean;
  claimResumed: boolean;
  device: PairingFlowDevice;
};

export type PairingFlowOptions = {
  database: Database;
  functions: Functions;
  userId: string;
  code: string;
  name?: string;
  place?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  now?: () => number;
};

export class PairingFlowError extends Error {
  readonly code: string;
  readonly cause?: unknown;

  constructor(code: string, message: string, cause?: unknown);
}

export function normalizePairingCode(value: string): string;

export function pairDeviceWithProtectedClaim(
  options: PairingFlowOptions,
): Promise<PairingFlowResult>;
