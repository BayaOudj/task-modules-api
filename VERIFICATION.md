# Verification

Verified on 2026-11-18 with Node.js 26.13.0 and npm 11.20.0.
The project supports Node 24 or newer; `.nvmrc` selects Node 24.

`npm run check` passed all six tests, then ran the demo successfully:

```text
Created user: Demo User
Created task: Learn ESM modules
Task count: 1
Completed: true
Task count after deletion: 0
Expected error: Task not found.
```

Five module tests cover Users, task CRUD, invalid inputs, missing records,
unchanged data after rejected updates, isolated stores, and defensive copies.
One HTTP integration test starts the real application on an ephemeral localhost
port and checks user creation, task CRUD, health, JSON/status codes, 400/404/405,
413/415, malformed JSON, and the Allow header.

The initial sandboxed run passed the five module tests but could not bind the
HTTP test port (`EPERM`). The permitted outside-sandbox rerun passed all six tests
and the demo. No test assertions were removed or weakened. The HTTP test closes
its server afterward. There are no third-party package dependencies.

These checks validate demo behavior, not production security or durable storage.
