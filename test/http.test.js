import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import { createApp } from "../src/app.js";

test("HTTP: user creation, task lifecycle and failure responses", async () => {
  const server = createApp();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(path, method = "GET", body) {
    return fetch(base + path, {
      method,
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
  }
  try {
    assert.deepEqual(await (await request("/health")).json(), { status: "ok" });
    const userResponse = await request("/users", "POST", { name: "Buyer" });
    assert.equal(userResponse.status, 201);
    const user = await userResponse.json();
    assert.deepEqual(await (await request("/users")).json(), [user]);
    assert.deepEqual(await (await request(`/users/${user.id}`)).json(), user);
    const created = await request("/tasks", "POST", {
      title: "Test API",
      userId: user.id,
    });
    assert.equal(created.status, 201);
    const task = await created.json();
    assert.deepEqual(await (await request("/tasks")).json(), [task]);
    assert.equal(
      (
        await (
          await request(`/tasks/${task.id}`, "PATCH", { completed: true })
        ).json()
      ).completed,
      true,
    );
    const removed = await request(`/tasks/${task.id}`, "DELETE");
    assert.equal(removed.status, 204);
    assert.equal(await removed.text(), "");
    assert.equal((await request(`/tasks/${task.id}`)).status, 404);
    assert.equal((await request("/tasks", "POST", { title: "" })).status, 400);
    assert.equal((await request("/unknown")).status, 404);
    const invalidMethod = await request("/tasks", "PUT");
    assert.equal(invalidMethod.status, 405);
    assert.equal(invalidMethod.headers.get("Allow"), "GET, POST");
    const malformed = await fetch(base + "/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(malformed.status, 400);
    const wrongType = await fetch(base + "/tasks", {
      method: "POST",
      body: "{}",
    });
    assert.equal(wrongType.status, 415);
    const oversized = await fetch(base + "/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "x".repeat(16385),
    });
    assert.equal(oversized.status, 413);
    assert.deepEqual(await (await request("/tasks")).json(), []);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
