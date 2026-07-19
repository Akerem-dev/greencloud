# GreenCloud Firebase Path Inventory

## Purpose

This document records the Firebase Realtime Database paths currently used by GreenCloud.
It describes the existing implementation before ownership-safe production rules are designed.

No rule changes documented here may be deployed before emulator tests and explicit review.

## Database root

- greencloud

## User workspace

Path: greencloud/users/{uid}

Current children:

- devices/{deviceId}
- selectedDeviceId
- automation
- settings
- activityFeed/{activityId}
- notifications/{notificationId}
- commands/{deviceId}
- pairings/{pairingCode}
- meta

Required ownership condition:

- auth must exist
- auth.uid must equal the uid in the path
- one user must never access another user workspace

## Live device data

Path: greencloud/deviceData/{deviceId}

Current usage:

- live telemetry
- device status
- soil and environmental sensor values
- command status
- factory-reset flags
- ownerUid stored inside the record

Security requirements:

- global device data must not be listable
- only the canonical owner may read telemetry
- web users must not freely write device telemetry
- ownerUid inside a client-writable record is not proof of ownership
- device or simulator writes require a separately verified identity

## Device commands

Path: greencloud/deviceCommands/{deviceId}

Current command types:

- IRRIGATE
- FACTORY_RESET

Security requirements:

- only the canonical device owner may create commands
- users must not command another users device
- command duration and type must be validated
- device acknowledgement must be separated from web command creation
- global command paths must not be listable

## Pairing registry

Path: greencloud/pairings/{pairingCode}

Current fields include:

- code
- deviceId
- ownerUid
- deviceAuthUid
- status
- createdAt
- expiresAt
- pairedAt

Security requirements:

- pairing codes must not be globally listable
- only a specific code may be queried
- available codes may be claimed only once
- paired or expired codes must not be claimed
- ownership assignment must be atomic
- client-provided ownerUid must not be trusted by itself

## Multi-location operations

Pairing currently updates:

- users/{uid}/devices/{deviceId}
- users/{uid}/selectedDeviceId
- users/{uid}/pairings/{pairingCode}
- pairings/{pairingCode}
- users/{uid}/meta

Device removal currently updates:

- deviceCommands/{deviceId}
- deviceData/{deviceId}
- users/{uid}/devices/{deviceId}
- users/{uid}/commands/{deviceId}
- users/{uid}/pairings/{pairingCode}
- pairings/{pairingCode}
- users/{uid}/meta

Irrigation commands currently update:

- deviceCommands/{deviceId}
- users/{uid}/commands/{deviceId}
- users/{uid}/devices/{deviceId}
- deviceData/{deviceId}
- users/{uid}/meta

## Security invariants

1. Users may access only users/{auth.uid}.
2. Authentication alone must not grant global device access.
3. Anonymous authentication must not bypass ownership checks.
4. Client-written ownerUid values are data, not authorization.
5. Global parent paths must not be listable.
6. Device commands require canonical ownership.
7. Telemetry writes require a verified device or isolated simulator.
8. Pairing ownership changes must be atomic and single-owner.
9. Unknown fields and invalid state transitions should be rejected.
10. Production deployment is blocked until emulator tests pass.

## Next emulator tests

1. User A can access users/user-a.
2. User A cannot access users/user-b.
3. Unauthenticated users cannot access user workspaces.
4. A device owner can read only their device telemetry.
5. Another user cannot read or write that telemetry.
6. Only the device owner can create valid commands.
7. Pairing codes cannot be listed.
8. A valid pairing code can be claimed once.
9. Paired and expired codes cannot be claimed again.
10. Invalid multi-location updates fail atomically.
