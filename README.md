# Task Modules API

A small Node.js project using native ECMAScript modules (`"type": "module"`).
Tasks and Users live in separate modules with their own private in-memory Maps.
There are no runtime dependencies and no database setup.

## Run

Use Node.js 24 or newer and npm. `.nvmrc` selects Node 24.

```sh
nvm use
npm ci
npm run check
npm start
```

The API runs at `http://127.0.0.1:3002`. Configure `PORT` and `HOST` through the
environment if needed. `npm run dev` restarts on source changes; `npm test`
runs Node's built-in tests once; `npm run demo` prints a module-level example.
There is no build step because this project uses JavaScript ESM directly.

Expected demo output:

```text
Created user: Demo User
Created task: Learn ESM modules
Task count: 1
Completed: true
Task count after deletion: 0
Expected error: Task not found.
```

## Modules

```text
src/
  modules/
    users/index.js   User creation, listing and lookup
    tasks/index.js   Task creation, listing, lookup, update and deletion
  errors.js          Shared validation and error types
  app.js             HTTP composition and response handling
  server.js          Startup and environment configuration
  demo.js            Runnable module example
```

`createTasks(users)` receives the public Users interface. It checks that a user
exists before assigning a task and never accesses the Users Map directly.
Factories isolate state between application instances and tests. Returned copies
prevent callers from accidentally modifying stored objects. Task operations are
synchronous because they only manipulate memory; HTTP body reading uses async/await.

## HTTP routes

| Method               | Path         | Purpose                       |
| -------------------- | ------------ | ----------------------------- |
| GET                  | `/health`    | Health check                  |
| GET / POST           | `/users`     | List / create users           |
| GET                  | `/users/:id` | Read a user                   |
| GET / POST           | `/tasks`     | List / create tasks           |
| GET / PATCH / DELETE | `/tasks/:id` | Read / update / delete a task |

Example requests:

```sh
curl -i http://127.0.0.1:3002/users \
  -H 'Content-Type: application/json' -d '{"name":"Demo User"}'
# Replace USER_ID with the returned id:
curl -i http://127.0.0.1:3002/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Learn ESM modules","userId":"USER_ID"}'
curl http://127.0.0.1:3002/tasks
# Replace TASK_ID with the returned task id:
curl -X PATCH http://127.0.0.1:3002/tasks/TASK_ID \
  -H 'Content-Type: application/json' -d '{"completed":true}'
curl -i -X DELETE http://127.0.0.1:3002/tasks/TASK_ID
```

Users have `id` and `name`. Tasks have `id`, `title`, `userId`, and `completed`.
Names must contain 1–100 characters; titles 1–200. Both are trimmed. Updates allow
only `title` and/or boolean `completed`. Creation returns 201, reads/updates 200,
and deletion 204 without a body. Validation/malformed JSON returns 400; missing
users/tasks/routes return 404; unsupported resource methods return 405; bodies
over 16 KiB return 413; non-JSON creation/update requests return 415. Unexpected
errors are logged server-side and return a generic 500 response. Error responses
use `{"error":"message"}`.

## Verification and limitations

`npm run check` runs the unit/HTTP tests and demo. Tests use isolated application
instances and an ephemeral localhost port. See `VERIFICATION.md` for actual results.

This is a learning project: memory resets when the server stops, and there is
no authentication, access control, durable storage, or user update/delete API.
Do not use real personal data or treat this as a production service. Publishing
source to GitHub does not deploy the API.

## AI use

OpenAI Codex generated this project from the user's requirements, including the
module design, source code, tests, and documentation. Automated verification is
recorded separately and does not guarantee production readiness.
