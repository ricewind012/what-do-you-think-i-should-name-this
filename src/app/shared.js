import path from "node:path";
import { createRequire } from "node:module";

// why do I have to put main.js there ?
const Addon = (p) =>
	createRequire(path.join(process.cwd(), "src", "app", "main.js"))(
		path.join("..", "modules", p, "build", "Release", "addon"),
	);

const IsNumber = (n) => Number.isFinite(Number(n));

export { Addon, IsNumber };
