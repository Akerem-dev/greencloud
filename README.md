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

## Verification

Focused emulator-isolation contract:

```bash
npm run test:firebase-emulator-isolation
```

Complete security chain:

```bash
npm run test:security
npm --prefix functions run check
npm run lint
npm run build
```

Expected negative Firebase Rules denials and emulator shutdown messages are normal when the commands finish with exit code 0.
