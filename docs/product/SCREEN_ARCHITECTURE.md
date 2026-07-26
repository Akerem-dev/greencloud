# GreenCloud Screen Architecture

Status: **Phase 1 scope lock**  
Branch: `design/greencloud-ui-architecture`  
Base: `security/local-firebase-emulator-isolation`  
Implementation status: **documentation only; no production UI code changed**

## 1. Purpose

This document freezes the product-level screen inventory before the visual overhaul begins.

GreenCloud must feel like one deliberately designed product across public, authentication, onboarding, monitoring, device-management and safety workflows. The redesign must preserve the verified Firebase Authentication, Realtime Database, Functions, pairing, command, settings and trusted-unpair behavior already present in the functional base.

The target product language is:

> Horticulture control studio + field notebook + industrial device console.

The interface must not resemble a generic AI-generated dashboard, a component-library demo or a collection of unrelated glass cards.

## 2. Current route audit

The current functional base exposes these principal product routes:

| Current route | Current responsibility | Target decision |
| --- | --- | --- |
| `/` | Public marketing landing | Keep and redesign |
| `/auth` | Combined login/register experience | Replace with compatibility redirect after `/login` and `/register` exist |
| `/dashboard` | Live workspace overview | Keep and redesign |
| `/devices` | Device list, pairing, telemetry and management in one large page | Split into index, add-device and device-detail routes |
| `/automation` | Irrigation rules and safety state | Keep and redesign |
| `/activity` | Event and operation history | Keep and redesign |
| `/settings` | Theme, notification, ambience and workspace preferences | Keep and reorganize |
| `/profile` | Account identity and sign-out | Keep and redesign |

### Current functional capabilities that must survive

- Firebase Authentication registration, login, session restoration and sign-out
- Protected-route gating
- Workspace/profile identity validation
- Device pairing through a six-character OLED code
- Pairing claim, trusted device decision and callable finalization
- Canonical device ownership and private user projection
- Live telemetry and device status
- Device selection and rename
- Manual irrigation command creation
- Automation and hardware safety boundaries
- Activity/audit events
- Trusted unpair and queued `FACTORY_RESET`
- Theme, notification, ambience, animation and compact-mode preferences
- Local emulator isolation for development

## 3. Final information architecture

### Public navigation

- Product
- Workflow
- Security
- Sign in
- Create account

### Authenticated primary navigation

1. Overview
2. Devices
3. Automation
4. Activity
5. Analytics

### Authenticated secondary navigation

- Settings
- Profile

### Global top-bar utilities

- Workspace/device switcher
- Connection and synchronization state
- Notification center
- Global search/command palette
- User menu

The primary navigation must remain compact. Operational depth belongs inside each workspace, not in a long sidebar of shallow pages.

## 4. Locked twenty-screen visual inventory

The twenty items below are the complete full-screen visual delivery scope. Some are permanent routes; some are critical product states that require independent full-screen designs.

## Batch A — first ten screens

These ten visuals are already selected as the first implementation batch.

### GC-01 — Public landing

- Target route: `/`
- Audience: signed-out visitors
- Core purpose: explain the real GreenCloud hardware-to-cloud workflow
- Must show:
  - Product value without empty marketing slogans
  - ESP32, sensors, relay, pump, Firebase and GreenCloud relationship
  - Observe → Decide → Irrigate → Audit workflow
  - Security and protected irrigation positioning
  - Sign-in and account creation entry points
- Must not show:
  - Generic AI hero glow
  - Decorative dashboards unrelated to real product data
  - Repeated feature-card grid as the primary story

### GC-02 — Login

- Target route: `/login`
- Compatibility: `/auth` login mode redirects here
- Core purpose: secure Firebase Authentication entry
- Must cover:
  - Email and password
  - Password visibility
  - Safe validation and authentication errors
  - Session-checking state
  - Account recovery link
  - Registration link
  - Emulator/connection failure messaging in development

### GC-03 — Register

- Target route: `/register`
- Compatibility: `/auth` register mode redirects here
- Core purpose: create account and private workspace identity
- Must cover:
  - Workspace owner name
  - Email and password
  - Existing runtime identity validation
  - Account-creation progress and errors
  - Clear hand-off to setup

### GC-04 — Setup: workspace identity

- Target route: `/setup/workspace`
- Core purpose: define the initial workspace context
- Must cover:
  - Workspace name
  - Garden/project name
  - Primary plant/zone name
  - Protected validation
  - Persistent progress
  - Back/continue behavior

### GC-05 — Setup: preferences and first-device hand-off

- Target route: `/setup/preferences`
- Core purpose: select essential preferences and choose whether to pair now
- Must cover:
  - Notification mode
  - Animation preference
  - Compact-mode preference
  - Initial appearance choice
  - Pair first ESP32 now / later
- Must not expose every advanced Settings option during onboarding

### GC-06 — Dashboard / Overview

- Target route: `/dashboard`
- Core purpose: answer “Is the garden healthy and is irrigation safe right now?”
- Must cover:
  - Selected workspace/device
  - Soil moisture
  - Water level
  - Rain state
  - Signal and connection health
  - Last telemetry time
  - Relay, pump and safe-mode state
  - Active automation
  - Last command
  - Critical alerts
  - Recent activity
  - Manual irrigation entry
- Layout rule: one operational composition, not a uniform KPI-card grid

### GC-07 — Devices index

- Target route: `/devices`
- Core purpose: browse, filter and manage every paired node
- Must cover:
  - Device list
  - Search
  - Status filters
  - Online/offline/pending state
  - Plant zone
  - Last seen
  - Signal
  - Telemetry summary
  - Selected-device summary
  - Add-device entry
  - Route to detail
- Pairing controls must not be hidden below an oversized first viewport

### GC-08 — Add device / Pairing studio

- Target route: `/devices/add`
- Core purpose: complete the secure device-pairing lifecycle
- Required stages:
  1. Enter OLED code
  2. Assign device name and plant zone
  3. Create pairing claim
  4. Wait for ESP32 approval
  5. Finalize canonical ownership
  6. Wait for first telemetry
  7. Finish and open device detail
- Every stage needs explicit pending, success, failure and retry behavior
- This workflow is a route, not a clipped inline card

### GC-09 — Device detail

- Target route: `/devices/[deviceId]`
- Core purpose: inspect and operate one trusted ESP32 node
- Must cover:
  - Device identity, ownership and firmware
  - Online/offline and last-seen state
  - Soil moisture and raw soil reading
  - Soil voltage
  - Temperature, pressure and humidity where available
  - Rain and water-level status
  - OLED, sensor, relay and pump state
  - Safe mode and pump-enabled state
  - Last command and command result
  - Rename
  - Refresh telemetry
  - Manual irrigation
  - Activity link
  - Trusted unpair
- Signature visual: code-driven SVG hardware topology, not a decorative illustration

### GC-10 — Activity / Operations log

- Target route: `/activity`
- Core purpose: provide a chronological, auditable system record
- Must cover:
  - Pairing lifecycle
  - Telemetry and connectivity events
  - Manual commands
  - Automation decisions
  - Safety blocks
  - Sensor warnings
  - Rename and settings changes
  - Trusted unpair and reset queue
  - Device/event/date filters
- Layout rule: operational ledger or timeline, not notification cards

## Batch B — second ten screens

### GC-11 — Automation

- Target route: `/automation`
- Core purpose: configure and understand protected irrigation rules
- Must cover:
  - Target device
  - Moisture threshold
  - Irrigation duration
  - Cooldown/minimum interval
  - Rain lockout
  - Low-water lockout
  - Device-online requirement
  - Safe mode
  - Pump-enabled requirement
  - Last execution
  - Last blocked reason
  - Rule validation and preview

### GC-12 — Analytics

- Target route: `/analytics`
- Core purpose: explain historical garden and hardware behavior
- Must cover:
  - Date range
  - Device selection
  - Moisture history
  - Irrigation events on the same timeline
  - Signal history
  - Water-level history
  - Online/offline intervals
  - Sensor faults
  - Command success/failure
- Chart selection must follow the data; avoid decorative donut charts

### GC-13 — Settings

- Target route: `/settings`
- Core purpose: manage workspace and application preferences
- Required sections:
  - Appearance
  - Notifications
  - Workspace identity
  - Default device/zone
  - Motion and accessibility
  - Data and privacy
  - Reset preferences
- Existing strict settings and identity validation must remain authoritative

### GC-14 — Profile and account security

- Target route: `/profile`
- Core purpose: manage authenticated identity and session
- Must cover:
  - Display name
  - Email
  - Active workspace
  - Authentication status
  - Session integrity/safety notices
  - Sign out
- Must not imitate a social-media profile

### GC-15 — Account recovery

- Target route: `/recover`
- Core purpose: request and confirm Firebase password recovery
- Must cover:
  - Email submission
  - Safe success response
  - Invalid input
  - Rate/connection failure
  - Return to login

### GC-16 — Empty workspace

- Surface: full-screen Dashboard/Devices state
- Core purpose: guide a new user with zero paired devices
- Must cover:
  - Clear explanation of missing telemetry
  - Prominent add-device action above the fold
  - Setup completion state
  - What becomes available after pairing
- Must not be a generic “No data” illustration

### GC-17 — Pairing awaiting approval

- Surface: `/devices/add` lifecycle state
- Core purpose: show the active secure handshake
- Must cover:
  - Claim created
  - OLED code identity
  - Requesting account/workspace
  - Waiting for trusted ESP32 decision
  - Expiration countdown
  - Cancel safely
  - Clear statement that ownership is not finalized yet

### GC-18 — Pairing failure and recovery

- Surface: `/devices/add` lifecycle state
- Required variants:
  - Invalid code
  - Expired code
  - Code already claimed
  - Device belongs to another owner
  - Approval rejected
  - Callable finalization failure
  - First telemetry timeout
- Must provide a specific next action for each failure

### GC-19 — Offline and synchronization recovery

- Surface: global protected-app state
- Core purpose: distinguish cached data from live Firebase state
- Must cover:
  - Browser offline
  - Firebase unavailable
  - Emulator stopped in development
  - Last successful synchronization
  - Read-only/cached information
  - Actions disabled while unsafe
  - Retry and automatic reconnection
- No action may silently fall back to a production target

### GC-20 — Hardware fault and safety lockout

- Surface: Dashboard and Device Detail incident state
- Required conditions:
  - ESP32 offline or stale telemetry
  - Soil sensor fault
  - Low/empty water level
  - Rain lockout
  - Relay locked
  - Pump protected/disabled
  - Command blocked
- Must explain:
  - What failed
  - Which action was prevented
  - Whether the garden is safe
  - What the user should inspect next

## 5. Supporting overlays and drawers

These are required reusable surfaces but do not count toward the twenty full-screen visuals.

1. Notification-center drawer
2. Global search/command palette
3. Rename-device modal
4. Manual-irrigation confirmation
5. Irrigation in-progress/result panel
6. Trusted-unpair confirmation
7. Automation-rule editor
8. Delete-automation confirmation
9. Unsaved-changes warning
10. Sign-out confirmation

Additional system surfaces required during implementation:

- Toast/inline notice system
- Session expired/access denied
- 404 route not found
- Loading/skeleton states
- Form validation and focus states
- Destructive-operation progress states

## 6. Functional coverage matrix

| Capability | Primary screen | Secondary evidence/surface |
| --- | --- | --- |
| Marketing and product explanation | GC-01 | — |
| Login/session restoration | GC-02 | GC-19, Profile |
| Registration | GC-03 | GC-04 |
| Account recovery | GC-15 | GC-02 |
| Workspace identity | GC-04 | GC-13, GC-14 |
| Preference initialization | GC-05 | GC-13 |
| Live operational overview | GC-06 | GC-09 |
| Device browsing and selection | GC-07 | GC-06 |
| Secure pairing | GC-08 | GC-17, GC-18 |
| Canonical ownership confirmation | GC-08 | GC-09, GC-10 |
| Live telemetry | GC-06 | GC-09, GC-12 |
| Device rename | GC-09 | Rename modal, GC-10 |
| Manual irrigation | GC-06, GC-09 | Confirmation/result panels, GC-10 |
| Automation rules and safety | GC-11 | GC-06, GC-10, GC-20 |
| Historical telemetry | GC-12 | GC-09 |
| Audit/activity | GC-10 | Device detail link |
| Trusted unpair | GC-09 | Confirmation, GC-10 |
| Factory-reset queue evidence | GC-10 | Removal success notice |
| Settings validation | GC-13 | Global blocked-settings notice |
| Profile/session integrity | GC-14 | GC-02, GC-19 |
| Offline/sync failure | GC-19 | Global top bar |
| Hardware safety incident | GC-20 | GC-06, GC-09, GC-10 |

## 7. Route migration decisions

### Authentication

- Introduce `/login`, `/register` and `/recover`.
- Keep `/auth` temporarily as a compatibility redirect.
- Preserve the existing Firebase Auth state gate and protected-route behavior.

### Setup

- Introduce `/setup/workspace` and `/setup/preferences`.
- Setup completion must persist so existing users are not repeatedly redirected.

### Devices

- Keep `/devices` as the index/workspace.
- Introduce `/devices/add` for pairing.
- Introduce `/devices/[deviceId]` for one-node telemetry and actions.
- Remove dependence on an offscreen inline first-device pairing card.

### Analytics

- Introduce `/analytics` only after the source data and retention boundary are explicit.
- Never fabricate historical metrics when only current telemetry is available.

## 8. Visual system constraints

### Required qualities

- Warm off-white operational canvas
- Deep forest/graphite navigation shell
- Restrained moss/olive accent
- Terracotta or safety amber only for warnings and destructive context
- Strong grotesk headings
- Neutral readable body type
- Tabular or monospace numerals for telemetry
- 4/8 px spacing rhythm
- Predominantly 6–12 px corner radius
- Thin dividers and tonal separation instead of heavy shadows
- Purpose-built SVG system diagrams
- Real status language and timestamps

### Prohibited AI/vibe-code patterns

- Purple/cyan AI gradients
- Ambient glowing orbs as the defining product identity
- Glassmorphism on every surface
- Uniform grid of oversized KPI cards
- Excessive rounded pills and badges
- Generic “revolutionize your garden” copy
- Random 3D artwork unrelated to the hardware
- Decorative charts without data purpose
- Different visual language on every route
- Hidden core actions below a presentation-heavy hero
- Fake metrics, fake history or fake success states
- Component-library defaults left visually unchanged

## 9. Shared-state requirements

Every applicable screen must define:

- Loading
- Empty
- Success
- Validation failure
- Permission/authentication failure
- Network/Firebase failure
- Offline/cached state
- Stale telemetry
- Destructive action pending
- Reduced-motion behavior
- Keyboard focus and screen-reader naming

A screen is not considered complete when only the ideal happy path is designed.

## 10. Responsive boundary

Initial implementation priority:

1. Desktop: 1440 px reference canvas
2. Compact desktop/laptop: 1280 px
3. Tablet: 768–1024 px
4. Mobile: functional adaptation after desktop information architecture is stable

Desktop-first does not permit fixed-height content areas that clip forms or core actions.

## 11. Phase 1 acceptance criteria

Phase 1 is complete when:

- The twenty-screen inventory is approved and unchanged without an explicit scope decision.
- Batch A and Batch B order is approved.
- Every existing GreenCloud function maps to at least one target screen.
- Pairing, trusted unpair, irrigation and safety operations have visible progress/failure states.
- Route additions and compatibility redirects are documented.
- Supporting overlays are listed separately from full screens.
- Anti-AI/vibe-code constraints are explicit.
- No production UI, Firebase configuration, rules, Functions or deployment target has changed.

## 12. Phase 2 hand-off

After this document is approved, Phase 2 will create the code-level design foundation:

- Design tokens
- Typography system
- Grid and spacing primitives
- Public shell
- Auth shell
- Protected application shell
- Navigation and top bar
- Buttons, inputs, tables, status indicators and notices
- Modal/drawer primitives
- Loading, empty and error primitives
- Motion and reduced-motion rules

No individual page should be rebuilt before the shared Phase 2 foundation is established.
