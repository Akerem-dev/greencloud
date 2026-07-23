"use strict";

const { DeviceUnpairError, unpairDeviceState } = require("./device-unpair");

async function unpairDeviceTransaction(rootRef, input) {
  if (
    !rootRef ||
    typeof rootRef.get !== "function" ||
    typeof rootRef.transaction !== "function"
  ) {
    throw new DeviceUnpairError(
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
        const transition = unpairDeviceState(stateForAttempt, input);
        finalResult = transition.result;
        return transition.state;
      } catch (error) {
        transactionError = error;
        return undefined;
      }
    },
    undefined,
    false,
  );

  if (!transaction.committed || !finalResult) {
    if (transactionError) throw transactionError;

    throw new DeviceUnpairError(
      "aborted",
      "Device unpair was not committed.",
    );
  }

  return finalResult;
}

module.exports = {
  unpairDeviceTransaction,
};
