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

  const initialState = (await rootRef.get()).val();
  let firstInvocation = true;
  let finalResult;
  let transactionError;

  const transaction = await rootRef.transaction(
    (currentState) => {
      const stateForAttempt =
        firstInvocation && currentState == null && initialState != null
          ? initialState
          : currentState;

      firstInvocation = false;
      finalResult = undefined;
      transactionError = undefined;

      try {
        const transition = finalizePairingState(stateForAttempt, input);
        finalResult = transition.result;
        return transition.state;
      } catch (error) {
        // Throwing from an RTDB transaction callback can leave the transaction
        // promise unresolved. Abort this attempt cleanly, then rethrow the same
        // domain error after the transaction has finished.
        transactionError = error;
        return undefined;
      }
    },
    undefined,
    false,
  );

  if (!transaction.committed || !finalResult) {
    if (transactionError) {
      throw transactionError;
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
