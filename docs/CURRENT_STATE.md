# GreenCloud v2 Starting State

## Snapshot

- Baseline commit: `ee462d5fab62f9dacc3180e92f92dde3e69a9299`
- Production branch: `main`
- Backup branch: `backup/pre-greencloud-v2-2026-07-19`
- Foundation branch: `refactor/greencloud-v2-foundation`
- Existing deployment check observed on baseline: Vercel status reported success

## Confirmed Firebase configuration

Authentication providers currently enabled:

- Email/Password
- Anonymous

Realtime Database root namespace:

- `greencloud`

Observed top-level paths:

- `automation`
- `deviceCommands`
- `deviceData`
- `notifications`
- `pairings`
- `selectedDeviceId`
- `settings`
- `users`

Current rules deny root access but grant every authenticated session read and write access to global pairing, device-data, and device-command paths. Anonymous sessions are authenticated sessions and therefore currently satisfy those conditions.

## Confirmed repository concerns

- Firebase client configuration was changed from environment-based configuration to hardcoded values in commit history.
- Pairing-code normalization behavior changed multiple times in commit history.
- The application state provider currently contains unrelated responsibilities, including domain models, normalization, persisted state, settings, device state, and integration behavior.
- Production security rules and automated rules tests are not currently stored as a verified repository-controlled deployment unit.
- The current repository does not yet provide evidence that global device ownership, telemetry writes, and device commands are isolated between users.

## First implementation investigation

Before changing runtime behavior, the foundation pull request will inventory:

1. Current environment variable names and deployment providers.
2. Firebase initialization and authentication entry points.
3. Every Realtime Database path read or written by the frontend.
4. Pairing, ownership, device removal, factory reset, and command lifecycle behavior.
5. Current routes, visible controls, placeholders, and incomplete interactions.
6. Current scripts for type checking, linting, tests, and production builds.
7. Cloudflare files and the actual role of Cloudflare in the deployed system.

## Safety rule

No production Firebase rule, authentication provider, database record, Cloudflare secret, domain, or deployment setting will be changed until the replacement configuration is represented in the repository, validated in an emulator or preview environment, and accompanied by a rollback procedure.
