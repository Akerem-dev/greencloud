"use strict";

const { getApps, initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const {
  PairingFinalizationError,
  normalizePairingCode,
} = require("./pairing-finalization");
const { finalizePairingTransaction } = require("./pairing-transaction");
const {
  DeviceUnpairError,
  normalizeDeviceId,
} = require("./device-unpair");
const { unpairDeviceTransaction } = require("./device-unpair-transaction");

if (getApps().length === 0) {
  initializeApp();
}

exports.finalizePairing = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    let pairingCode;
    try {
      pairingCode = normalizePairingCode(request.data?.pairingCode);
    } catch (error) {
      if (error instanceof PairingFinalizationError) {
        throw new HttpsError(error.code, error.message);
      }
      throw error;
    }

    try {
      return await finalizePairingTransaction(getDatabase().ref("greencloud"), {
        pairingCode,
        requesterUid: request.auth.uid,
        nowMs: Date.now(),
        deviceName: request.data?.name,
        devicePlace: request.data?.place,
      });
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      if (error instanceof PairingFinalizationError) {
        throw new HttpsError(error.code, error.message);
      }
      throw new HttpsError("internal", "Pairing finalization failed.");
    }
  },
);

exports.unpairDevice = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    let deviceId;
    try {
      deviceId = normalizeDeviceId(request.data?.deviceId);
    } catch (error) {
      if (error instanceof DeviceUnpairError) {
        throw new HttpsError(error.code, error.message);
      }
      throw error;
    }

    try {
      return await unpairDeviceTransaction(getDatabase().ref("greencloud"), {
        deviceId,
        requesterUid: request.auth.uid,
        nowMs: Date.now(),
      });
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      if (error instanceof DeviceUnpairError) {
        throw new HttpsError(error.code, error.message);
      }
      throw new HttpsError("internal", "Device unpair failed.");
    }
  },
);
