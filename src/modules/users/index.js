import { randomUUID } from "node:crypto";
import { AppError, requireObject, requireText } from "../../errors.js";

export function createUsers() {
  const users = new Map();
  return {
    create(input) {
      const data = requireObject(input);
      const user = {
        id: randomUUID(),
        name: requireText(data.name, "Name", 100),
      };
      users.set(user.id, user);
      return { ...user };
    },
    list() {
      return Array.from(users.values(), (user) => ({ ...user }));
    },
    get(id) {
      const user = users.get(id);
      if (!user) throw new AppError(404, "User not found.");
      return { ...user };
    },
  };
}
