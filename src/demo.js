import { createUsers } from "./modules/users/index.js";
import { createTasks } from "./modules/tasks/index.js";

const users = createUsers();
const tasks = createTasks(users);
const user = users.create({ name: "Demo User" });
console.log(`Created user: ${user.name}`);
const task = tasks.create({ title: "Learn ESM modules", userId: user.id });
console.log(`Created task: ${task.title}`);
console.log(`Task count: ${tasks.list().length}`);
console.log(
  `Completed: ${tasks.update(task.id, { completed: true }).completed}`,
);
tasks.remove(task.id);
console.log(`Task count after deletion: ${tasks.list().length}`);
try {
  tasks.get(task.id);
} catch (error) {
  console.log(`Expected error: ${error.message}`);
}
