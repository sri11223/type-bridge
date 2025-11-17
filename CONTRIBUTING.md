# Contributing to TypeWeaver

Thanks for your interest in contributing! This document contains quick steps to get the project running locally and how to run tests on Windows (PowerShell) and Unix-like shells.

Repository: https://github.com/sri11223/type-bridge

## Running the project locally (Windows PowerShell)

Prerequisites:

- Node.js >= 16

Install dependencies from the project root:

```powershell
npm install
```

Run CLI in dev mode (local):

```powershell
npm run dev
# or run the bin directly
node .\bin\type-bridge.js
```

Run tests:

```powershell
npm test
# Run Jest with diagnostics if you see exit warnings
npx jest --detectOpenHandles --runInBand
```

Lint:

```powershell
npm run lint
```

## How to contribute

- Pick an issue or open a new issue describing the change.
- Create a feature branch from `main`.
- Make small, focused commits and include tests for any logic change.
- Run `npm test` and `npm run lint` before opening a PR.

## .env and test debugging

The project includes a `.env.example` file describing supported environment variables. Copy it to `.env` if you want to set values locally:

```powershell
Copy-Item .env.example .env
# edit .env as needed
notepad .\.env
```

Important environment variables:

- `NODE_ENV` — standard Node environment (`development` | `test` | `production`).
- `TYPEBRIDGE_SKIP_FORMAT` — set to `1` to skip requiring Prettier (useful in CI/tests to avoid Prettier opening TTY handles).

Note about `JEST_WORKER_ID`:

- `JEST_WORKER_ID` is injected automatically by Jest when tests run. The code checks for it to detect test runs and avoid loading Prettier. You should not set it permanently in `.env`.
- If you need to simulate a Jest environment locally for debugging, you can temporarily set it in your shell. Example (PowerShell):

```powershell
$env:JEST_WORKER_ID = '1'
npx jest src/watchers/file-watcher.test.js --detectOpenHandles --runInBand
Remove-Item Env:\JEST_WORKER_ID
```

Or in Bash:

```bash
export JEST_WORKER_ID=1
npx jest src/watchers/file-watcher.test.js --detectOpenHandles --runInBand
unset JEST_WORKER_ID
```

If you prefer not to simulate Jest, another option is to set `TYPEBRIDGE_SKIP_FORMAT=1` before running tests to avoid loading Prettier.

## Discussions

Prefer brainstorming or open-ended questions? Use the project's GitHub Discussions page:

- https://github.com/sri11223/type-bridge/discussions

See `DISCUSSIONS.md` for tips on creating productive discussions.

## Helpful areas to contribute

- Add CI workflow (`.github/workflows/ci.yml`) for Node matrix testing.
- Improve Windows-specific docs or examples in `examples/`.
- Fix test leaks (make sure watchers/timers are closed in tests).

Thanks — we welcome your contributions!
