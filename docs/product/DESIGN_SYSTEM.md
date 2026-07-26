# GreenCloud Design System

Status: **Phase 2 foundation**  
Branch: `design/greencloud-design-system`  
Base: `design/greencloud-ui-architecture`

## 1. Product character

GreenCloud is not a generic SaaS dashboard. Its visual language combines:

- horticulture control studio,
- field notebook,
- industrial device console.

Every screen must look authored for the real ESP32, sensor, relay, pump, Firebase and irrigation workflows already implemented by the product.

## 2. Core visual principles

### 2.1 Operational hierarchy before decoration

The user must immediately understand:

1. whether the garden is healthy,
2. whether the device is connected,
3. whether irrigation is safe,
4. what changed recently,
5. what action is available next.

Decorative effects may never compete with these answers.

### 2.2 One composition, not a card collection

Pages use a deliberate page composition with one dominant operational area, supporting context and a clear action region. Uniform grids of interchangeable cards are forbidden as the default layout.

### 2.3 Quiet surfaces and explicit boundaries

Use warm canvas tones, thin rules, restrained elevation and compact radii. Separate content through alignment, spacing and line weight before reaching for shadows.

### 2.4 Data has its own voice

Telemetry values use tabular or monospace numerals. Labels remain neutral. State color is reserved for state, not decoration.

### 2.5 Motion explains system change

Motion may communicate:

- navigation context,
- panel disclosure,
- connection or synchronization change,
- command progress,
- pairing progress,
- telemetry updates,
- successful or blocked operations.

Motion must not create ambient spectacle. Reduced-motion and the existing GreenCloud animation preference remain authoritative.

## 3. Color system

### Canvas

- `canvas`: warm field-paper background
- `canvas-muted`: secondary page region
- `surface`: primary content surface
- `surface-raised`: menus, dialogs and selected operational panels

### Ink

- `ink`: primary graphite text
- `ink-soft`: secondary explanatory text
- `ink-muted`: metadata and disabled context

### Brand and navigation

- `forest`: main navigation shell
- `forest-raised`: selected and elevated forest surface
- `moss`: restrained active accent
- `moss-soft`: selected rows and positive low-emphasis context

### State

- `success`: healthy, online, completed
- `warning`: review required, low water, rain lockout
- `danger`: destructive action, ownership failure, critical fault
- `info`: neutral synchronization and system information

State colors may not be used as page backgrounds or decorative gradients.

## 4. Typography

The foundation keeps the current Manrope installation to avoid introducing another remote font dependency during the staged rewrite.

- Display and headings: Manrope, weight 650–750, tight tracking
- Body: Manrope, weight 400–550
- Telemetry/data: system monospace stack with tabular numerals
- Labels: compact sentence case by default
- Uppercase is limited to short technical kickers and table metadata

Avoid oversized marketing headings inside the protected application. Dashboard headings describe an operational question, not a slogan.

## 5. Spacing and geometry

- Base spacing unit: 4px
- Primary rhythm: 8px
- Page gutters: 24px desktop, 16px compact
- Section spacing: 32–48px
- Surface padding: 20–28px
- Control height: 40–44px
- Standard radius: 8px
- Large surface radius: 12px
- Pill radius: used only for compact status/filter controls

The previous 20–32px radius language is not part of the target system.

## 6. Grid

### Public pages

- Maximum width: 1440px
- Twelve-column desktop grid
- Editorial asymmetry is encouraged when it explains the workflow

### Authentication and setup

- Context rail + task panel
- The form owns the visual priority
- Supporting illustration or process content must remain quiet

### Protected application

- Fixed/collapsible forest sidebar
- Compact top utility bar
- Main content uses a twelve-column operational grid
- Tables and ledgers span the available width when scanning matters

## 7. Shared component inventory

### Foundations

- Page container
- Content grid
- Section heading
- Surface and inset surface
- Divider
- Data text

### Actions

- Primary button
- Secondary button
- Quiet button
- Destructive button
- Icon button
- Link button

### Forms

- Field label
- Input
- Select
- Textarea
- Hint
- Validation error
- Switch and segmented choice

### Status and feedback

- Status badge
- Inline notice
- Toast
- Progress steps
- Empty state
- Skeleton
- Connection state

### Data and navigation

- Sidebar item
- Top-bar utility
- Device row
- Data table
- Operations ledger row
- Filter bar
- Tabs

### Overlays

- Dialog
- Confirmation dialog
- Drawer
- Command palette

## 8. Accessibility contract

- All interactive elements use native semantic elements.
- Every field has an explicit accessible label.
- Focus indicators must remain visible on warm and forest surfaces.
- Color is never the only status signal.
- Destructive operations require explicit wording and progress state.
- Dialogs expose `role=dialog`, `aria-modal`, a labelled title and native cancel behavior.
- Minimum pointer target is 40px.
- Reduced motion is honored.
- Tables retain semantic headers and captions where context is not otherwise explicit.

## 9. Motion contract

Default durations:

- control feedback: 120ms
- disclosure and menus: 160ms
- route/surface transition: 180ms
- progress/state hand-off: 200ms

Default easing:

- enter: cubic-bezier(0.2, 0.8, 0.2, 1)
- exit: cubic-bezier(0.4, 0, 1, 1)

Disallowed:

- continuous floating cards,
- decorative parallax in protected routes,
- looping glow pulses,
- unrelated particle effects,
- staggered entrance animation for every dashboard tile.

## 10. Anti-AI / anti-vibe-code constraints

The following are explicit design failures:

- purple/green neon hero gradients,
- glassmorphism as the universal surface,
- giant radii on every component,
- identical KPI cards filling the dashboard,
- badges used for ordinary text,
- icon-only operations without labels or titles,
- empty marketing claims,
- decorative charts without source data,
- fabricated telemetry,
- arbitrary donut charts,
- generic leaf illustrations used instead of product states,
- inconsistent spacing between pages,
- different button styles for equivalent actions,
- hidden primary actions below oversized hero regions.

## 11. Migration strategy

The existing dark theme, `premium-*` and glass components remain untouched during Phase 2. New work uses the `gc2-*` namespace.

Migration order:

1. design tokens and primitives,
2. public/auth/protected shells,
3. first ten screens,
4. second ten screens,
5. overlays and critical states,
6. remove unused legacy visual classes only after every route has migrated.

## 12. Phase 2 acceptance criteria

Phase 2 is complete when:

- the target token set exists in code,
- reusable surface, action, form, status, table and overlay primitives exist,
- public, auth and protected shell primitives exist,
- focus, motion and reduced-motion behavior are defined,
- a source contract protects the foundation,
- no existing feature route is rewritten yet,
- Firebase, Rules, Functions and application state are unchanged.
