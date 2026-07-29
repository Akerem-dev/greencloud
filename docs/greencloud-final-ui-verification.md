# GreenCloud Final UI Verification

This checklist is the manual review companion to `npm run test:final-ui`.

It covers the completed 20 primary screens and 10 supporting overlays on branch `design/greencloud-supporting-overlays` / draft PR #34. It is a review gate only: do not merge or deploy from this document.

## Review setup

- Browser zoom: 100%
- Desktop viewports: 1920×1080, 1440×900, and 1280×720
- Test both an empty workspace and a workspace with a trusted device
- Use real AppState / emulator-backed states; do not insert fabricated telemetry to make a screen look complete
- Record the exact reviewed commit SHA before starting

## Global pass criteria

Every surface must satisfy all of the following:

- Warm field-notebook design tokens remain consistent across the product
- No generic glass dashboard, ambient-orb, excessive glow, or template-like AI styling returns
- Text hierarchy, spacing, dividers, controls, and status colors remain consistent
- No clipped text, accidental horizontal scrolling, overlapping fixed controls, or hidden primary actions
- Keyboard focus is visible and follows a deliberate order
- Dialog close, Escape, backdrop, pending, blocked, and destructive states follow their safety contract
- Empty, loading, offline, blocked, and successful states are visually distinct
- UI copy does not claim telemetry, device action, Firebase persistence, or completion without real evidence

## Primary screens — 20 / 20

| # | Surface | Required visual states | Pass |
|---|---|---|---|
| 01 | Public landing | Navigation, product explanation, authentication entry points | [ ] |
| 02 | Login | Empty form, validation, password visibility, pending session | [ ] |
| 03 | Registration | Identity fields, validation, password visibility, account creation pending | [ ] |
| 04 | Workspace setup | Workspace identity, required-field validation, forward navigation | [ ] |
| 05 | Preferences setup | Essential preferences, valid defaults, protected save path | [ ] |
| 06 | Device setup handoff | Explicit transition from setup to protected pairing | [ ] |
| 07 | Dashboard overview | Real-device topology, safety state, operations and activity context | [ ] |
| 08 | Device inventory | Empty and populated inventory, selected-device state | [ ] |
| 09 | Device detail | Current telemetry, immutable identity, protected actions | [ ] |
| 10 | Activity timeline | Empty and populated records, filters, readable chronology | [ ] |
| 11 | Automation policy | Current rule, safety status, manual-command boundary | [ ] |
| 12 | Environmental analytics | Real derived readings, no fabricated charts or trends | [ ] |
| 13 | Settings | Workspace preferences, validation, saved-state feedback | [ ] |
| 14 | Profile | Account identity, workspace scope, protected sign-out entry | [ ] |
| 15 | Account recovery | Valid email input, submitted state, error state | [ ] |
| 16 | Empty workspace | First-device readiness without fake telemetry | [ ] |
| 17 | Pairing awaiting | Pairing code, waiting state, ownership and trust explanation | [ ] |
| 18 | Pairing failure | Failure reason, safe retry path, no false ownership | [ ] |
| 19 | Offline / syncing recovery | Cached-data labeling, refresh action, output lock | [ ] |
| 20 | Hardware fault / safety lockout | Incident reason, prevented action, inspection guidance | [ ] |

## Supporting overlays — 10 / 10

| # | Overlay | Required visual and interaction checks | Pass |
|---|---|---|---|
| 01 | Notification Center Drawer | Unread count, stored records, mark-all-read, Activity link | [ ] |
| 02 | Global Search / Command Palette | Topbar trigger, Ctrl/Command+K, routes, devices, Activity search | [ ] |
| 03 | Rename-device modal | Current identity, validation, pending, blocked and accepted states | [ ] |
| 04 | Manual-irrigation confirmation | Device evidence, explicit confirmation, blocked-command error | [ ] |
| 05 | Irrigation progress / result panel | Waiting, pending, running, handled, dry-run and blocked evidence | [ ] |
| 06 | Trusted-unpair confirmation | Exact-name confirmation, pending lock, verified queued reset result | [ ] |
| 07 | Automation-rule editor | Local draft, limits, toggles, quiet hours, explicit save | [ ] |
| 08 | Delete-automation confirmation | DELETE RULE phrase, protected defaults, destructive warning | [ ] |
| 09 | Unsaved-changes warning | Cancel, close, Escape, backdrop, Keep editing and Discard changes | [ ] |
| 10 | Sign-out confirmation | Account scope, pending lock, blocked error, subscribed-session success | [ ] |

## Cross-surface review

- [ ] Protected shell navigation remains stable while drawers and dialogs open
- [ ] Only one overlay is visually active at a time
- [ ] Fixed launchers do not cover page content at all three desktop viewports
- [ ] Destructive controls use consistent warning hierarchy and language
- [ ] Success messages describe only verified application or Firebase state
- [ ] Device identity, ownership, telemetry, automation, Activity and workspace boundaries remain understandable
- [ ] Refreshing any protected route does not reveal a flash of fabricated content
- [ ] Browser back/forward navigation does not leave a stale overlay visible

## Review record

- Commit SHA:
- Reviewer:
- Date:
- Browser and version:
- Viewports completed:
- Automated final gate log:
- Lint log:
- Production build log:
- Findings / corrections:

## Completion rule

Do not mark PR #34 ready for review until:

1. `npm run test:final-ui` passes.
2. `npm run lint` passes.
3. `npm run build` passes.
4. Every checkbox above is reviewed on the same commit SHA.
5. The working tree is clean.

Passing this checklist does not authorize merge or deployment.
