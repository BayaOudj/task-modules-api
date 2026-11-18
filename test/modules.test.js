import assert from "node:assert/strict";
import { test } from "node:test";
import { createUsers } from "../src/modules/users/index.js";
import { createTasks } from "../src/modules/tasks/index.js";

function fixture() {
  const users = createUsers();
  const user = users.create({ name: "  Demo User  " });
  return { users, user, tasks: createTasks(users) };
}

test("users module creates, lists and finds users with defensive copies", () => {
  const { users, user } = fixture();
  assert.equal(user.name, "Demo User");
  assert.deepEqual(users.list(), [user]);
  user.name = "Changed outside";
  assert.equal(users.get(user.id).name, "Demo User");
  assert.throws(() => users.create({ name: "" }), { status: 400 });
  assert.throws(() => users.get("missing"), { status: 404 });
});

test("tasks module creates, reads, updates and deletes a user task", () => {
  const { user, tasks } = fixture();
  const task = tasks.create({ title: "  Learn ESM  ", userId: user.id });
  assert.equal(task.title, "Learn ESM");
  assert.equal(task.completed, false);
  assert.deepEqual(tasks.list(), [task]);
  assert.deepEqual(tasks.get(task.id), task);
  assert.equal(tasks.update(task.id, { completed: true }).completed, true);
  assert.equal(
    tasks.update(task.id, { title: "Learn Node" }).title,
    "Learn Node",
  );
  tasks.remove(task.id);
  assert.deepEqual(tasks.list(), []);
  assert.throws(() => tasks.get(task.id), { status: 404 });
});

test("invalid tasks and missing users never add data", () => {
  const { user, tasks } = fixture();
  for (const input of [
    null,
    [],
    {},
    { title: "", userId: user.id },
    { title: "x".repeat(201), userId: user.id },
  ])
    assert.throws(() => tasks.create(input), { status: 400 });
  assert.throws(() => tasks.create({ title: "Valid", userId: "missing" }), {
    status: 404,
  });
  assert.deepEqual(tasks.list(), []);
});

test("rejected updates preserve valid data and unknown operations fail", () => {
  const { user, tasks } = fixture();
  const task = tasks.create({ title: "Keep me", userId: user.id });
  for (const input of [
    {},
    { completed: "yes" },
    { title: "" },
    { userId: "other" },
    { title: "Changed", completed: 1 },
  ]) {
    assert.throws(() => tasks.update(task.id, input), { status: 400 });
    assert.deepEqual(tasks.get(task.id), task);
  }
  assert.throws(() => tasks.update("missing", { completed: true }), {
    status: 404,
  });
  assert.throws(() => tasks.remove("missing"), { status: 404 });
});

test("stores are isolated and returned tasks do not expose private data", () => {
  const { user, tasks } = fixture();
  const task = tasks.create({ title: "Original", userId: user.id });
  task.title = "Changed outside";
  tasks.list()[0].title = "Changed list";
  assert.equal(tasks.get(task.id).title, "Original");
  assert.deepEqual(fixture().tasks.list(), []);
  assert.deepEqual(createUsers().list(), []);
});
