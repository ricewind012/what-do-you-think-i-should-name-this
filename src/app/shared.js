const path = require("node:path");

const Addon = (p) =>
	require(
		path.join(__dirname, "..", "modules", p, "build", "Release", "addon"),
	);

const IsNumber = (n) => Number.isFinite(Number(n));

exports.Addon = Addon;
exports.IsNumber = IsNumber;
