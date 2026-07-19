# GreenCloud Security Baseline

## Purpose

This document defines the minimum security model that GreenCloud v2 must satisfy before production Firebase or Cloudflare configuration is changed.

It is not a claim that the current application is secure. It is the acceptance standard for the upcoming implementation and automated tests.

## Current verified risks

The current Realtime Database rules protect `greencloud/users/{uid}` with UID equality, but global paths under `greencloud/pairings`, `greencloud/deviceData`, and `greencloud/deviceCommands` allow read and write access to every authenticated session.

Because Anonymous Authentication is enabled, an anonymous session also satisfies `auth != null` and can reach those global paths under the current rules.

The current validation rules mostly check that a small set of fields exists. They do not fully enforce ownership, allowed keys, data types, ranges, state transitions, timestamp bounds, replay protection, or command safety.

## Trust boundaries

### Untrusted clients

The following are untrusted:

- Browser application sessions
- Anonymous Firebase sessions
- Locally modified frontend bundles
- User-provided import files
- Device or simulator payloads before server-side verification

An authenticated browser is not automatically trusted to write global telemetry or device commands.

### Trusted services

A trusted service may include:

- A Cloudflare Worker with server-side Firebase credentials or a verified service-to-service protocol
- Firebase Admin SDK running outside the browser
- A device gateway that validates device identity and payload signatures
- Firebase Emulator Suite during local tests

Trusted services must still validate inputs and enforce least privilege.

## Ownership model

Every workspace-scoped record must be attributable to a user or workspace.

Minimum required fields:

- Workspace: `ownerUid`
- Area: `workspaceId`
- Plant: `workspaceId`, `areaId`
- Device: `workspaceId`, `ownerUid`
- Telemetry: `workspaceId`, `deviceId`, `recordedAt`
- Command: `workspaceId`, `deviceId`, `requestedBy`, `createdAt`
- Automation rule: `workspaceId`, `ownerUid`
- Alert: `workspaceId`, source reference, lifecycle status
- Activity event: `workspaceId`, actor, action, timestamp

A user may access a record only when membership or ownership is explicitly proven.

## Authentication policy

### Production

- Email/password authentication may remain enabled.
- Anonymous Authentication must not grant access to production workspaces, devices, telemetry, commands, pairings, notifications, or activity records.
- Anonymous Authentication should be disabled unless a documented production use case requires it.
- If anonymous demo access is retained, it must use a separate demo project or isolated namespace with no production device access.

### Local development

- Simulator and rules tests should use Firebase Emulator Suite.
- Test users must be generated for each rules scenario.
- Local seed data must contain no production identifiers or personal data.

## Pairing requirements

- Pairing codes must not be list-readable by normal clients.
- Pairing codes must be high-entropy, normalized consistently, expire, and be single-use.
- Pairing attempts must be rate-limited.
- Claiming a device must be atomic so two users cannot claim the same code.
- A claimed device must receive an immutable owner or workspace association unless an explicit transfer flow is completed.
- A user must not be able to write an arbitrary `ownerUid` into a global pairing record.

Preferred implementation:

1. Device or simulator registers a pairing challenge through a trusted service.
2. User submits the displayed code to a trusted claim endpoint.
3. The service verifies expiration, status, device identity, and current ownership.
4. The service atomically assigns ownership and invalidates the code.
5. The browser receives only the result required for the UI.

## Telemetry requirements

- Browsers must not write arbitrary global telemetry.
- Telemetry writes must come through a verified device or trusted gateway.
- Users may read telemetry only for devices in their workspace.
- Payloads must reject unknown keys unless intentionally versioned.
- Numeric fields must enforce finite values and domain ranges.
- Timestamps must be plausible and must not silently replace newer data with older data.
- Stale telemetry must be marked as stale rather than displayed as current.

Initial value constraints to refine with device specifications:

- Soil moisture: 0–100 percent
- Air humidity: 0–100 percent
- Water level: 0–100 percent
- pH: 0–14
- EC: non-negative and capped to an application-defined safe maximum
- Signal and battery: 0–100 percent
- Pump duration: 1–60 seconds unless a later reviewed requirement changes the limit

## Command requirements

- A user may request commands only for a device owned by their workspace.
- The browser must not mark a device command as handled on behalf of the device.
- Command lifecycle transitions must be constrained, for example:
  - `pending` → `acknowledged`
  - `acknowledged` → `running`
  - `running` → `completed` or `failed`
  - `pending` → `expired` or `cancelled`
- A request ID must be unique enough to prevent accidental replay.
- Manual irrigation must enforce duration limits, cooldowns, device status, reservoir status, safety mode, and pump enablement.
- Factory reset and ownership transfer must require stronger confirmation and trusted execution.

## Realtime Database rules strategy

- Root read and write remain denied.
- Rules must not grant broad access at a parent path that child rules attempt to restrict.
- User-scoped data remains under a UID or workspace path when possible.
- Global indexes or lookups must expose only the minimum fields required.
- Server-owned fields must not be writable by clients.
- `.validate` rules must verify types, allowed values, required keys, and immutable fields.
- Complex state transitions should move to a trusted service rather than relying only on rules.

## Cloudflare role

Cloudflare must be evaluated before implementation. A Worker is appropriate for operations that require:

- Atomic pairing claims
- Rate limiting
- Device identity verification
- Command authorization and creation
- Server-generated audit records
- PDF or export generation when server execution is required

Cloudflare environment values must be stored as secrets and never committed.

## App Check

App Check may be added as defense in depth after authorization rules are correct and tested. It does not replace authentication, ownership checks, or input validation.

Enforcement must be enabled only after observing preview or production metrics and confirming legitimate clients are registered.

## Required automated rules tests

The first rules test suite must prove:

1. Unauthenticated sessions cannot read or write GreenCloud data.
2. Anonymous sessions cannot access production workspaces, devices, telemetry, pairings, commands, notifications, or activity records.
3. A user can access their own permitted workspace data.
4. A user cannot access another user's workspace data.
5. A user cannot claim an expired, invalid, already claimed, or mismatched pairing code.
6. A user cannot assign themselves an arbitrary device.
7. A user cannot write telemetry for a device from a browser session.
8. A user cannot command a device outside their workspace.
9. Invalid command durations, statuses, timestamps, and shapes are rejected.
10. Server-owned fields cannot be changed by a normal user.
11. Deleting a device does not leave reusable ownership or pairing records.
12. Valid trusted-service flows succeed in the emulator.

## Deployment gate

Production Firebase or Cloudflare configuration may change only when:

- Rules and trusted-service code are committed in a reviewed pull request.
- Emulator tests pass from a clean checkout.
- Existing production data has a documented migration plan.
- A backup/export or rollback procedure exists.
- Preview behavior is verified.
- The production change and rollback steps are written before deployment.
