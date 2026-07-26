# GreenCloud

GreenCloud is a protected smart-irrigation workspace built with Next.js, Firebase Authentication, Realtime Database and callable Cloud Functions.

## Install

```bash
npm install
npm --prefix functions install
```

Copy `.env.example` to `.env.local` only when an intentional real Firebase connection is needed. Development must select its Firebase target explicitly.

## Safe local development

Local account, database and callable testing must use the isolated `demo-greencloud` Firebase project.

### Terminal 1 — Firebase emulators

```bash
npm run emulators:start
```

Wait until Auth, Realtime Database and Functions are ready. The Emulator UI is available on port 4000.

### Terminal 2 — Next.js with fail-closed isolation

```bash
npm run dev:isolated
```

The launcher checks these local endpoints before starting Next.js:

- Authentication: `127.0.0.1:9099`
- Realtime Database: `127.0.0.1:9000`
- Functions: `127.0.0.1:5001`

If any required emulator is unavailable, development is blocked and Next.js does not start. The command forces `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-greencloud`, so it cannot silently fall back to the production project.

Open `http://localhost:3000` after both terminals are running.

## Intentional real Firebase development

Plain development mode is reserved for an explicit real-project connection:

```env
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false
```

Then provide every required Firebase Web App value in `.env.local` and run:

```bash
npm run dev
```

Leaving the target undefined during development is treated as a configuration error.

## Full browser regression

Install the Chromium test browser once:

```bash
npm run test:e2e:install
```

Run the complete browser suite:

```bash
npm run test:e2e
```

The command starts Auth, Realtime Database and Functions emulators with `firebase emulators:exec`, starts Next.js through the fail-closed isolated launcher, runs Playwright with one worker and shuts the stack down when the suite finishes.

Current browser coverage includes:

- protected-route redirects
- registration, sign-out, login and session refresh
- invalid registration without account creation
- ESP32 pairing-code publication and device approval
- canonical ownership and private workspace projection
- live telemetry rendering
- device rename persistence
- irrigation command creation and device acknowledgement
- trusted unpair and queued factory reset
- theme, notification, ambience and compact-mode persistence
- profile and workspace identity persistence
- cross-account device isolation

Failure artifacts are written locally to:

- `playwright-report/`
- `test-results/playwright-results.json`
- Playwright screenshots, video and traces under `test-results/`

Open the last HTML report with:

```bash
npm run test:e2e:report
```

Focused browser commands:

```bash
npm run test:e2e:auth
npm run test:e2e:device
npm run test:e2e:headed
```

Physical ESP32 pins, sensors, relay, pump and electrical behavior are outside browser emulation and require a later hardware-in-the-loop suite.

## Verification

Focused emulator-isolation contract:

```bash
npm run test:firebase-emulator-isolation
```

Playwright architecture contract, which does not require a browser download:

```bash
npm run test:e2e-contract
```

Complete security chain:

```bash
npm run test:security
npm --prefix functions run check
npm run lint
npm run build
```

Expected negative Firebase Rules denials and emulator shutdown messages are normal when the commands finish with exit code 0.
