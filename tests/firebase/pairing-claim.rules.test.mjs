import { after, before, beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { get, ref, remove, set } from "firebase/database";

const PROJECT_ID = "demo-greencloud";
const GREENCLOUD_ROOT = "greencloud";

let testEnv;
let nowMs;
let pairingA;
let pairingB;

function pairingPath(pairingCode) {
  return `${GREENCLOUD_ROOT}/pairings/${pairingCode}`;
}

function pairingClaimPath(pairingCode) {
  return `${GREENCLOUD_ROOT}/pairingClaims/${pairingCode}`;
}

function deviceContext(deviceId, authUid) {
  return testEnv.authenticatedContext(authUid, {
    actorType: "device",
    deviceId,
  });
}

function validPairing(
  pairingCode = "ABC123",
  deviceId = "device-a",
  deviceAuthUid = "device-auth-a",
  overrides = {},
) {
  const createdAtMs = nowMs - 1_000;

  return {
    code: pairingCode,
    deviceId,
    deviceAuthUid,
    status: "available",
    createdAtMs,
    expiresAtMs: createdAtMs + 10 * 60 * 1_000,
    ...overrides,
  };
}

function validClaim(
  pairingCode = "ABC123",
  deviceId = "device-a",
  requestedByUid = "user-a",
  overrides = {},
) {
  const pairing = pairingCode === "XYZ789" ? pairingB : pairingA;

  return {
    code: pairingCode,
    deviceId,
    requestedByUid,
    status: "pending",
    createdAtMs: nowMs - 500,
    expiresAtMs: pairing.expiresAtMs,
    ...overrides,
  };
}

function decidedClaim(
  claim,
  status = "approved",
  deviceAuthUid = "device-auth-a",
  overrides = {},
) {
  return {
    ...claim,
    status,
    decidedByUid: deviceAuthUid,
    decidedAtMs: nowMs,
    ...overrides,
  };
}

async function seedClaim(pairingCode, claim) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(
      ref(context.database(), pairingClaimPath(pairingCode)),
      claim,
    );
  });
}

async function replacePairing(pairingCode, pairing) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), pairingPath(pairingCode)), pairing);
  });
}

before(async () => {
  const rules = await readFile(
    new URL("../../database.rules.json", import.meta.url),
    "utf8",
  );

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearDatabase();
  nowMs = Date.now();

  pairingA = validPairing();
  pairingB = validPairing("XYZ789", "device-b", "device-auth-b");

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const database = context.database();

    await set(ref(database, `${GREENCLOUD_ROOT}/deviceActors`), {
      "device-a": {
        deviceAuthUid: "device-auth-a",
      },
      "device-b": {
        deviceAuthUid: "device-auth-b",
      },
    });

    await set(ref(database, `${GREENCLOUD_ROOT}/pairings`), {
      ABC123: pairingA,
      XYZ789: pairingB,
    });
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

test("unauthenticated user cannot read a pairing claim", async () => {
  await seedClaim("ABC123", validClaim());

  const database = testEnv.unauthenticatedContext().database();
  await assertFails(get(ref(database, pairingClaimPath("ABC123"))));
});

test("requester can read their own pairing claim", async () => {
  await seedClaim("ABC123", validClaim());

  const database = testEnv.authenticatedContext("user-a").database();
  await assertSucceeds(get(ref(database, pairingClaimPath("ABC123"))));
});

test("another user cannot read a pairing claim", async () => {
  await seedClaim("ABC123", validClaim());

  const database = testEnv.authenticatedContext("user-b").database();
  await assertFails(get(ref(database, pairingClaimPath("ABC123"))));
});

test("verified device actor can read its pairing claim", async () => {
  await seedClaim("ABC123", validClaim());

  const database = deviceContext("device-a", "device-auth-a").database();
  await assertSucceeds(get(ref(database, pairingClaimPath("ABC123"))));
});

test("another device actor cannot read a pairing claim", async () => {
  await seedClaim("ABC123", validClaim());

  const database = deviceContext("device-b", "device-auth-b").database();
  await assertFails(get(ref(database, pairingClaimPath("ABC123"))));
});

test("authenticated user cannot list all pairing claims", async () => {
  await seedClaim("ABC123", validClaim());

  const database = testEnv.authenticatedContext("user-a").database();
  await assertFails(get(ref(database, `${GREENCLOUD_ROOT}/pairingClaims`)));
});

test("authenticated user can create a valid pending claim", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertSucceeds(
    set(ref(database, pairingClaimPath("ABC123")), validClaim()),
  );
});

test("unauthenticated user cannot create a pairing claim", async () => {
  const database = testEnv.unauthenticatedContext().database();

  await assertFails(
    set(ref(database, pairingClaimPath("ABC123")), validClaim()),
  );
});

test("device actor cannot create a user pairing claim", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(ref(database, pairingClaimPath("ABC123")), validClaim()),
  );
});

test("user cannot claim a missing pairing code", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("NOPE12")),
      validClaim("NOPE12", "device-a", "user-a", {
        expiresAtMs: nowMs + 10 * 60 * 1_000,
      }),
    ),
  );
});

test("user cannot claim an expired pairing code", async () => {
  const expired = validPairing("ABC123", "device-a", "device-auth-a", {
    createdAtMs: nowMs - 20 * 60 * 1_000,
    expiresAtMs: nowMs - 10 * 60 * 1_000,
  });
  await replacePairing("ABC123", expired);

  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      validClaim("ABC123", "device-a", "user-a", {
        expiresAtMs: expired.expiresAtMs,
      }),
    ),
  );
});

test("user cannot claim an unavailable pairing code", async () => {
  const paired = {
    ...pairingA,
    status: "paired",
    ownerUid: "existing-owner",
    pairedAtMs: nowMs - 500,
  };
  await replacePairing("ABC123", paired);

  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(ref(database, pairingClaimPath("ABC123")), validClaim()),
  );
});

test("user cannot create a claim for another user", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      validClaim("ABC123", "device-a", "user-b"),
    ),
  );
});

test("user cannot create a claim for another device", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      validClaim("ABC123", "device-b", "user-a"),
    ),
  );
});

test("user cannot extend a claim beyond pairing expiry", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      validClaim("ABC123", "device-a", "user-a", {
        expiresAtMs: pairingA.expiresAtMs + 60_000,
      }),
    ),
  );
});

test("user cannot create an already approved claim", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      decidedClaim(validClaim()),
    ),
  );
});

test("user cannot add unknown pairing claim fields", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      validClaim("ABC123", "device-a", "user-a", {
        ownerUid: "user-a",
      }),
    ),
  );
});

test("user cannot overwrite or delete an existing pairing claim", async () => {
  await seedClaim("ABC123", validClaim());

  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      validClaim("ABC123", "device-a", "user-a", {
        createdAtMs: nowMs,
      }),
    ),
  );
  await assertFails(remove(ref(database, pairingClaimPath("ABC123"))));
});

test("requester cannot approve their own pairing claim", async () => {
  const pending = validClaim();
  await seedClaim("ABC123", pending);

  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      decidedClaim(pending),
    ),
  );
});

test("verified device actor can approve a pending pairing claim", async () => {
  const pending = validClaim();
  await seedClaim("ABC123", pending);

  const database = deviceContext("device-a", "device-auth-a").database();

  await assertSucceeds(
    set(
      ref(database, pairingClaimPath("ABC123")),
      decidedClaim(pending),
    ),
  );
});

test("verified device actor can reject a pending pairing claim", async () => {
  const pending = validClaim();
  await seedClaim("ABC123", pending);

  const database = deviceContext("device-a", "device-auth-a").database();

  await assertSucceeds(
    set(
      ref(database, pairingClaimPath("ABC123")),
      decidedClaim(pending, "rejected"),
    ),
  );
});

test("another device actor cannot decide a pairing claim", async () => {
  const pending = validClaim();
  await seedClaim("ABC123", pending);

  const database = deviceContext("device-b", "device-auth-b").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      decidedClaim(pending, "approved", "device-auth-b"),
    ),
  );
});

test("device identity without claims cannot decide a pairing claim", async () => {
  const pending = validClaim();
  await seedClaim("ABC123", pending);

  const database = testEnv.authenticatedContext("device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      decidedClaim(pending),
    ),
  );
});

test("device actor cannot change immutable claim fields", async () => {
  const pending = validClaim();
  await seedClaim("ABC123", pending);

  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      decidedClaim(pending, "approved", "device-auth-a", {
        requestedByUid: "different-user",
      }),
    ),
  );
});

test("device actor cannot lie about decision identity", async () => {
  const pending = validClaim();
  await seedClaim("ABC123", pending);

  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      decidedClaim(pending, "approved", "different-device"),
    ),
  );
});

test("device actor cannot approve after pairing expiry", async () => {
  const pending = validClaim();
  await seedClaim("ABC123", pending);

  await replacePairing("ABC123", {
    ...pairingA,
    expiresAtMs: nowMs - 1,
  });

  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      decidedClaim(pending),
    ),
  );
});

test("decided pairing claim cannot be changed or deleted", async () => {
  const approved = decidedClaim(validClaim());
  await seedClaim("ABC123", approved);

  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingClaimPath("ABC123")),
      {
        ...approved,
        status: "rejected",
      },
    ),
  );
  await assertFails(remove(ref(database, pairingClaimPath("ABC123"))));
});
