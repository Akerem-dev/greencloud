# ADR 0001: Use an incremental branch and pull-request refactor

- Status: Accepted
- Date: 2026-07-19

## Context

The current GreenCloud repository contains working deployment history, Firebase integration, device pairing, command handling, persistence, and a large application-state provider. The product will be redesigned across 13 user-facing screens while also changing its security model, data model, simulator, and infrastructure boundaries.

Replacing the entire application in one commit would make it difficult to:

- Identify regressions
- Review security-sensitive changes
- Preserve the current deployment
- Test data migrations
- Explain why files changed
- Revert one faulty subsystem without discarding unrelated work
- Maintain a credible engineering history

## Decision

GreenCloud v2 will be delivered incrementally through a protected working branch and narrowly scoped pull requests.

The current repository state is preserved in:

`backup/pre-greencloud-v2-2026-07-19`

The initial working branch is:

`refactor/greencloud-v2-foundation`

The default production branch will remain unchanged until a pull request has passed its documented verification steps and has been explicitly approved for merge.

Security, configuration, and data-boundary changes will be implemented and tested before the production interface is connected to the new architecture.

Production Firebase and Cloudflare changes will be applied only after repository code, emulator tests, migration steps, preview validation, and rollback instructions are ready.

## Pull-request rules

Each pull request must:

- Address one coherent concern
- Explain the user or engineering problem
- List important files and behavior changes
- Include verification steps and actual results
- State known limitations and deferred work
- Avoid unrelated visual or dependency changes
- Keep destructive migrations separate from ordinary feature work

Large UI screenshots are references, not proof that a feature works. A visible control may be merged only when its behavior, states, validation, and permissions are implemented.

## Consequences

### Positive

- The current application remains recoverable.
- Security-sensitive changes can be reviewed independently.
- Regressions can be traced to a small change set.
- The development history reflects actual engineering work.
- Preview deployments can be reviewed before production promotion.
- Architecture and UI can evolve without one irreversible rewrite.

### Negative

- Temporary adapters may be required while old and new modules coexist.
- Some duplicated paths may remain briefly during migration.
- The complete redesign will span multiple pull requests rather than one replacement commit.

## Rejected alternatives

### Replace the entire repository from a ZIP

Rejected because it erases change intent, weakens reviewability, makes regression analysis difficult, and encourages a single oversized commit.

### Modify the production branch directly

Rejected because security rules, Firebase paths, authentication behavior, and UI changes could break the live application without a reliable review and rollback path.

### Redesign the interface before defining data and security boundaries

Rejected because the new screens require different ownership, telemetry, automation, reporting, and simulator models. Building them against the existing monolithic state would create avoidable rework and hidden security coupling.
