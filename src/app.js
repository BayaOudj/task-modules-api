import { createServer } from "node:http";
import { AppError } from "./errors.js";
import { createTasks } from "./modules/tasks/index.js";
import { createUsers } from "./modules/users/index.js";

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16384) throw new AppError(413, "Body exceeds 16 KiB.");
    chunks.push(chunk);
  }
  if (
    request.headers["content-type"]?.split(";")[0]?.trim().toLowerCase() !==
    "application/json"
  )
    throw new AppError(415, "Use Content-Type: application/json.");
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError(400, "Invalid JSON.");
  }
}

export function createApp() {
  const users = createUsers();
  const tasks = createTasks(users);
  function send(response, status, data) {
    response.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(data === undefined ? undefined : JSON.stringify(data));
  }
  async function route(request, response) {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    const method = request.method;
    if (path === "/health" && method === "GET")
      return send(response, 200, { status: "ok" });
    if (path === "/users" || path === "/tasks") {
      const store = path === "/users" ? users : tasks;
      if (method === "GET") return send(response, 200, store.list());
      if (method === "POST")
        return send(response, 201, store.create(await readJson(request)));
      response.setHeader("Allow", "GET, POST");
      throw new AppError(405, "Method not allowed.");
    }
    const match = /^\/(users|tasks)\/([^/]+)$/.exec(path);
    if (match) {
      const [, kind, id] = match;
      const store = kind === "users" ? users : tasks;
      if (method === "GET") return send(response, 200, store.get(id));
      if (kind === "tasks" && method === "PATCH")
        return send(response, 200, tasks.update(id, await readJson(request)));
      if (kind === "tasks" && method === "DELETE") {
        tasks.remove(id);
        return send(response, 204);
      }
      response.setHeader(
        "Allow",
        kind === "users" ? "GET" : "GET, PATCH, DELETE",
      );
      throw new AppError(405, "Method not allowed.");
    }
    throw new AppError(404, "Route not found.");
  }
  return createServer((request, response) => {
    void route(request, response).catch((error) => {
      if (error instanceof AppError)
        send(response, error.status, { error: error.message });
      else {
        console.error(error);
        send(response, 500, { error: "Internal server error." });
      }
    });
  });
}
