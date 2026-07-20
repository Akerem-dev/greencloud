"use strict";

const {
  PairingFinalizationError,
  finalizePairingState,
} = require("./pairing-finalization");

async function finalizePairingTransaction(rootRef, input) {
  if (!rootRef || typeof rootRef.transaction !== "function") {
    throw new PairingFinalizationError(
      "internal",
      "A valid GreenCloud database root reference is required.",
    );
  }

  let finalResult;
  const transaction = await rootRef.transaction(
    (currentState) => {
      // RTDB can invoke a transaction with null before the remote value is in
      // the local cache. Returning that null value lets the server reject the
      // stale attempt and retry with its current state. It also avoids
      // rebuilding deleted data from a stale pre-transaction snapshot.
      finalResult = undefined;
      if (currentState == null) {
        return currentState;
      }

      const transition = finalizePairingState(currentState, input);
      finalResult = transition.result;
      return transition.state;
    },
    undefined,
    false,
  );

  if (!transaction.committed || !finalResult) {
    const committedState = transaction.snapshot?.val?.();

    // Preserve the domain-specific error when the database really is empty.
    if (committedState == null) {
      finalizePairingState(committedState, input);
    }

    throw new PairingFinalizationError(
      "aborted",
      "Pairing finalization was not committed.",
    );
  }

  return finalResult;
}

module.exports = {
  finalizePairingTransaction,
};