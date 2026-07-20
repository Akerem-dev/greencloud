"use strict";

const { getApps, initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const {
  PairingFinalizationError,
  finalizePairingState,
  normalizePairingCode,
} = require("./pairing-finalization");

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

    const rootRef = getDatabase().ref("greencloud");
    let finalResult;

    try {
      const transaction = await rootRef.transaction(
        (currentState) => {
          const transition = finalizePairingState(currentState, {
            pairingCode,
            requesterUid: request.auth.uid,
            nowMs: Date.now(),
          });
          finalResult = transition.result;
          return transition.state;
        },
        undefined,
        false,
      );

      if (!transaction.committed || !finalResult) {
        throw new HttpsError(
          "aborted",
          "Pairing finalization was not committed.",
        );
      }

      return finalResult;
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
