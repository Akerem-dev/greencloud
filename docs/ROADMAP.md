# GreenCloud v2 Delivery Roadmap

## Product direction

GreenCloud v2 will be a user-friendly plant monitoring, soil health, irrigation, and device management product. The interface must remain calm, clear, and understandable while the technical complexity stays behind well-defined application services.

The target product contains 13 primary user-facing screens:

1. Overview
2. Plants and Areas
3. Plant Detail
4. Devices
5. Device Detail
6. Live Readings
7. Soil Health
8. Irrigation
9. Automations
10. Alerts
11. History
12. Reports
13. Settings

Developer-only tools such as the ESP32 simulator, Firebase emulator controls, diagnostics, and seed-data management must not appear as normal user navigation.

## Non-negotiable quality rules

- No unfinished controls, fake actions, or placeholder routes in production.
- No fabricated measurements, hardware claims, performance results, or security claims.
- No monolithic components that combine domain types, persistence, UI, and remote access.
- No direct global device writes from an untrusted browser session.
- No sensitive configuration committed to source control.
- No feature is complete without loading, empty, error, offline, and permission-denied behavior where applicable.
- Every destructive action requires an explicit confirmation and a recoverable or clearly documented outcome.
- Every pull request must have a narrow purpose, test notes, and known limitations.
- Production Firebase and Cloudflare configuration must not change before emulator or preview validation passes.

## Delivery phases

### Phase 0 — Preserve and baseline

Status: In progress

Deliverables:

- Preserve the current repository state in a backup branch.
- Create an isolated GreenCloud v2 foundation branch.
- Record the current production deployment status.
- Inventory environment variables, Firebase paths, routes, features, and unfinished controls.
- Create a verified issue list grouped by security, correctness, architecture, UX, and documentation.

Exit criteria:

- Existing production branch remains unchanged.
- A documented rollback point exists.
- The current application build and deployment status are recorded.

### Phase 1 — Security and configuration foundation

Deliverables:

- Move Firebase client configuration to validated environment variables.
- Add `.env.example` without real credentials.
- Add `firebase.json`, database rules, and emulator configuration.
- Add Realtime Database rules tests.
- Remove global authenticated read/write access to pairings, telemetry, and device commands.
- Define ownership rules for users, areas, devices, telemetry, and commands.
- Decide which operations belong in Firebase Rules and which require a trusted Cloudflare Worker or server endpoint.
- Define anonymous-authentication policy for production, preview, and local simulation.

Exit criteria:

- An unauthenticated or anonymous user cannot read or modify production device data.
- A user cannot access another user's workspace, device, telemetry, command, notification, or activity data.
- Invalid command payloads and invalid sensor values are rejected by automated tests.
- Production rules are not deployed until emulator tests pass.

### Phase 2 — Domain model and application boundaries

Deliverables:

- Define versioned models for Workspace, Area, Plant, Device, Sensor, Telemetry, IrrigationEvent, AutomationRule, Alert, ActivityEvent, Report, and SoilReading.
- Add runtime validation at system boundaries.
- Separate domain models from Firebase persistence shapes.
- Separate Firebase access, Cloudflare access, local storage, and simulator adapters.
- Split the current application-state provider into feature-focused services and stores.

Exit criteria:

- UI components do not perform raw Firebase path construction.
- Domain modules can be unit tested without Firebase.
- Persisted schemas have an explicit version and migration strategy.

### Phase 3 — Deterministic ESP32 simulator

Deliverables:

- Add a simulator that uses the same telemetry and command contracts as a real device.
- Support normal, dry-soil, overwatering, low-tank, high-temperature, invalid-pH, nutrient-warning, offline-device, sensor-failure, and command-timeout scenarios.
- Add deterministic seeds so tests are reproducible.
- Clearly label simulated data in development and demo modes.

Exit criteria:

- All user-facing device and irrigation flows can be tested without physical hardware.
- Simulator behavior is covered by automated tests.
- Production users never see developer simulator controls unless an explicit demo mode is enabled.

### Phase 4 — Design system and application shell

Deliverables:

- Implement design tokens for typography, spacing, radii, colors, borders, elevations, motion, and data visualization.
- Implement shared buttons, fields, tables, cards, badges, dialogs, drawers, tabs, tooltips, charts, status indicators, and feedback components.
- Implement the desktop application shell, sidebar, top bar, command search, routing, notifications entry point, and user menu.
- Add accessible focus, keyboard, contrast, reduced-motion, and screen-reader behavior.

Exit criteria:

- Shared UI components cover all 13 approved screens.
- Screens do not duplicate visual primitives or invent local spacing systems.
- Navigation and global actions work with keyboard and pointer input.

### Phase 5 — Core overview and asset management

Screens:

- Overview
- Plants and Areas
- Plant Detail
- Devices
- Device Detail

Deliverables:

- Real filters, searches, sorting, pagination, and meaningful empty states.
- Area and plant lifecycle management.
- Device pairing, assignment, status, maintenance, and removal flows.
- Honest distinction between measured, estimated, manually entered, and simulated values.

Exit criteria:

- Every visible control is functional.
- Ownership and permission failures are handled clearly.
- Critical interactions are covered by component or integration tests.

### Phase 6 — Monitoring and operations

Screens:

- Live Readings
- Soil Health
- Irrigation
- Automations
- Alerts

Deliverables:

- Live telemetry subscriptions with stale-data detection.
- pH, EC, moisture, temperature, humidity, light, reservoir, rain, signal, and power status where supported.
- Rule-based soil-health interpretations with explicit data-source labels.
- Safe manual irrigation, cooldowns, tank checks, rain blocks, and command acknowledgements.
- Versioned automation rules with execution history.
- Alert creation, acknowledgement, resolution, and audit trail.

Exit criteria:

- No irrigation command can bypass ownership and safety validation.
- Stale or invalid readings cannot silently appear as healthy current data.
- Automation behavior is deterministic and testable.

### Phase 7 — History, reports, and settings

Screens:

- History
- Reports
- Settings

Deliverables:

- Immutable or append-only activity records for important actions.
- Date, actor, device, area, type, and status filtering.
- CSV export and real PDF generation only when implemented and tested.
- Notification, unit, language, session, backup, export, and deletion settings.
- No fictional subscription plan, storage quota, or support service in the interface.

Exit criteria:

- Reports derive from real stored events and readings.
- Exported files have validated contents and filenames.
- Destructive account and data actions require re-authentication or an equivalent safety gate.

### Phase 8 — Verification and release

Deliverables:

- Type checking, linting, formatting, unit tests, component tests, rules tests, integration tests, and smoke E2E coverage.
- Dependency, secret, and vulnerability scans.
- Cloudflare preview deployment and production deployment checklist.
- Architecture, security, database, testing, troubleshooting, and simulator documentation.
- Professional README, screenshots, changelog, known issues, release notes, and tagged release.

Exit criteria:

- CI passes from a clean checkout.
- Preview deployment is manually reviewed before production promotion.
- README claims match verified behavior.
- Known limitations are documented rather than hidden.

## Planned pull-request sequence

1. Foundation: roadmap, configuration inventory, security baseline, and test scaffolding.
2. Firebase ownership rules and emulator tests.
3. Domain models, validation, repositories, and state separation.
4. Deterministic device simulator and demo dataset.
5. Design system and application shell.
6. Overview, Plants and Areas, and Plant Detail.
7. Devices, Device Detail, and pairing flow.
8. Live Readings and Soil Health.
9. Irrigation safety and command lifecycle.
10. Automations and Alerts.
11. History, Reports, and Settings.
12. Accessibility, performance, CI, documentation, and release preparation.

## Definition of done for every feature

A feature is complete only when:

- Its user purpose and acceptance criteria are written.
- Its data source and ownership model are clear.
- Its main, loading, empty, error, offline, and permission states are handled.
- Validation exists at the UI boundary and trusted persistence boundary.
- Relevant tests pass.
- No unused dependency, route, button, or placeholder remains.
- Documentation and screenshots reflect the final behavior.
- The pull request explains how the feature was verified and what remains out of scope.
