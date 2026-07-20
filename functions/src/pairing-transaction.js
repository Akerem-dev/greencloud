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
      const transition = finalizePairingState(currentState, input);
      finalResult = transition.result;
      return transition.state;
    },
    undefined,
    false,
  );

  if (!transaction.committed || !finalResult) {
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
