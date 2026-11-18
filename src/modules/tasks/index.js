import { randomUUID } from "node:crypto";
import { AppError, requireObject, requireText } from "../../errors.js";

// User lookup is injected; tasks never reach into another module's private Map.
export function createTasks(users) {
  const tasks = new Map();
  function get(id) {
    const task = tasks.get(id);
    if (!task) throw new AppError(404, "Task not found.");
    return { ...task };
  }
  return {
    create(input) {
      const data = requireObject(input);
      const title = requireText(data.title, "Title");
      if (typeof data.userId !== "string")
        throw new AppError(400, "userId is required.");
      users.get(data.userId);
      const task = {
        id: randomUUID(),
        title,
        userId: data.userId,
        completed: false,
      };
      tasks.set(task.id, task);
      return { ...task };
    },
    list() {
      return Array.from(tasks.values(), (task) => ({ ...task }));
    },
    get,
    update(id, input) {
      const current = get(id);
      const data = requireObject(input);
      const keys = Object.keys(data);
      if (
        !keys.length ||
        keys.some((key) => !["title", "completed"].includes(key))
      )
        throw new AppError(400, "Update title and/or completed only.");
      if ("title" in data) current.title = requireText(data.title, "Title");
      if ("completed" in data) {
        if (typeof data.completed !== "boolean")
          throw new AppError(400, "completed must be a boolean.");
        current.completed = data.completed;
      }
      tasks.set(id, current);
      return { ...current };
    },
    remove(id) {
      if (!tasks.delete(id)) throw new AppError(404, "Task not found.");
    },
  };
}
