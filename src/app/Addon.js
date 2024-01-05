const path = require("node:path");

const Addon = (p) =>
	require(path.join(
		__dirname,
		"..",
		"modules",
		p,
		"build",
		"Release",
		"addon"
	));

exports.Addon = Addon;
