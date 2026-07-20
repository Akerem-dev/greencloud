"use strict";

const {
  PairingFinalizationError,
  finalizePairingState,
} = require("./pairing-finalization");

async function finalizePairingTransaction(rootRef, input) {
  if (
    !rootRef ||
    typeof rootRef.get !== "function" ||
    typeof rootRef.transaction !== "function"
  ) {
    throw new PairingFinalizationError(
      "internal",
      "A valid GreenCloud database root reference is required.",
    );
  }

  // RTDB may invoke a cold transaction callback with null before its local
  // cache has loaded the server state. Prime the cache once, then let the
  // transaction retry with the latest server value if concurrent writes occur.
  await rootRef.get();

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
