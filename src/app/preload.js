const {
	contextBridge: pContextBridge,
	ipcRenderer: pIPCRenderer,
} = require("electron");

const cp = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Addon } = require("./Addon");

const MPD = Addon("MPD");
const X11 = Addon("X11");

const ParseINI = (vecFiles, rPattern) =>
	fs
		.readFileSync(vecFiles.find((e) => fs.existsSync(e)))
		.toString()
		.split("\n")
		.filter((e) => e && e[0] != "#" && e[0] != "/")
		.map((e) => e.match(rPattern))
		.filter((e) => e?.length == 3)
		.map((e) => Object({ [e[1]]: e[2] }))
		.reduce((a, b) => Object.assign(a, b));

const GetProcesses = () =>
	cp
		.execSync("ps -o pid,command -x")
		.toString()
		.split("\n")
		.slice(1)
		.map((e) => e.match(/^(\s+)?(\d+)\s+(.*?)(\s+(.*))?$/))
		.filter(Boolean)
		.map((e) =>
			Object({ pid: e[2], cmd: e[3], args: e[4]?.split(/\s+/).slice(1) })
		);

function GetCommandArgument(vecArgs, strArgToFind) {
	if (!vecArgs?.length) {
		return;
	}

	const vecMatches = vecArgs[0].match(
		new RegExp("^(" + strArgToFind + ")=(.*)$")
	);

	return vecMatches?.length == 3
		? vecMatches[2]
		: vecArgs[vecArgs.indexOf(strArgToFind) + 1];
}

function GetConfigAndPattern(strProgram) {
	const strConfigDir =
		process.env.XDG_CONFIG_HOME || path.join(process.env.HOME, ".config");
	const vecProgramArgs = GetProcesses().find((e) => e.cmd == strProgram)?.args;

	const XDGFile = (strEnding) =>
		path.join(strConfigDir, strProgram, `${strProgram}${strEnding}`);

	return (() => {
		switch (strProgram) {
			case "dunst":
				return [
					[
						GetCommandArgument(vecProgramArgs, "-conf"),
						GetCommandArgument(vecProgramArgs, "-config"),
						XDGFile("rc"),
					],
					/^([^=\s]+)(?:[=\s]+)?"(.*)"$/,
				];
			case "mpd":
				return [
					[
						process.env.CONF_FILE,
						XDGFile(".conf"),
						path.join(process.env.HOME, ".mpdconf"),
						path.join(process.env.HOME, ".mpd", "mpd.conf"),
					],
					/^([^=\s]+)(?:[=\s]+)?"(.*)"$/,
				];
			case "tint2":
				return [
					[GetCommandArgument(vecProgramArgs, "-c"), XDGFile(strProgram, "rc")],
					/^([^=\s]+)(?:[=\s]+)?(.*)$/,
				];
			case "picom":
				return [
					[GetCommandArgument(vecProgramArgs, "--config"), XDGFile(".conf")],
					/^(\w[^=\s]+)(?:[=\s]+)?"?(.*)"?;$/,
				];
		}
	})();
}

pIPCRenderer.on("window-message", (ev, args) => {
	postMessage(args);
});

pContextBridge.exposeInMainWorld("electron", {
	cp,
	fs,
	os,
	path,

	env: {
		...process.env,
	},

	MPD,
	X11,

	GetCommandArgument,
	GetConfigAndPattern,
	GetProcesses,
	ParseINI,

	SendMesssageToParent(msg) {
		pIPCRenderer.send("send-message-to-parent", msg);
	},

	Window: {
		Close(hWindow) {
			pIPCRenderer.send("close-window", hWindow);
		},

		Create(strPageName, options, msg) {
			return pIPCRenderer.invoke("create-window", {
				page: strPageName,
				options,
				msg,
			});
		},

		GetBounds() {
			return pIPCRenderer.invoke("get-bounds");
		},

		SetBounds(pBounds) {
			pIPCRenderer.send("set-bounds", pBounds);
		},
	},
});
