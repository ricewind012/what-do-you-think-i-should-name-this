import {
	contextBridge as pContextBridge,
	ipcRenderer as pIPCRenderer,
} from "electron";
import fs from "node:fs";
import path from "node:path";
import cdp from "chrome-remote-interface";
import { Addon, IsNumber } from "./shared.js";

const MPD = Addon("MPD");
const X11 = Addon("X11");

const k_unListHeight = 350;
const k_unUpdateInterval = 2_500;

const ReadFile = (strName) => fs.readFileSync(strName).toString();

const ParseFile = (vecFiles, rPattern) =>
	ReadFile(vecFiles.find((e) => fs.existsSync(e)))
		.split("\n")
		.filter((e) => e && e[0] !== "#" && e[0] !== "/")
		.map((e) => e.match(rPattern))
		.filter((e) => e?.length === 3)
		.map((e) => ({ [e[1]]: e[2] }))
		.reduce((a, b) => Object.assign(a, b));

const GetProcesses = () =>
	fs
		.readdirSync("/proc")
		.filter((e) => IsNumber(e))
		.map((e) => [
			e,
			ReadFile(`/proc/${e}/cmdline`)
				.replace(/\0/g, " ")
				.match(/^([a-zA-Z-_/]+)\s+(.*) $/),
			ParseFile([`/proc/${e}/status`], /(.*):\s+(.*)/),
		])
		.filter((e) => e[1])
		.map((e) => ({
			pid: e[0],
			cmd: e[1][1],
			args: e[1][2].split(/\s+/),
			status: e[2],
		}));

function GetCommandArgument(vecArgs, strArgToFind) {
	if (vecArgs?.length <= 0) {
		return;
	}

	const vecMatches = vecArgs[0].match(new RegExp(`^(${strArgToFind})=(.*)$`));

	return vecMatches?.length === 3
		? vecMatches[2]
		: vecArgs[vecArgs.indexOf(strArgToFind) + 1];
}

function GetConfigAndPattern(strProgram) {
	const strConfigDir =
		process.env.XDG_CONFIG_HOME || path.join(process.env.HOME, ".config");
	const vecProgramArgs = GetProcesses().find((e) => e.cmd === strProgram)?.args;

	const GetXDGFile = (strEnding) =>
		path.join(strConfigDir, strProgram, `${strProgram}${strEnding}`);

	switch (strProgram) {
		case "dunst":
			return [
				[
					GetCommandArgument(vecProgramArgs, "-conf"),
					GetCommandArgument(vecProgramArgs, "-config"),
					GetXDGFile("rc"),
				],
				/^([^=\s]+)(?:[=\s]+)?"(.*)"$/,
			];
		case "mpd":
			return [
				[
					process.env.CONF_FILE,
					GetXDGFile(".conf"),
					path.join(process.env.HOME, ".mpdconf"),
					path.join(process.env.HOME, ".mpd", "mpd.conf"),
				],
				/^([^=\s]+)(?:[=\s]+)?"(.*)"$/,
			];
		case "tint2":
			return [
				[GetCommandArgument(vecProgramArgs, "-c"), GetXDGFile("rc")],
				/^([^=\s]+)(?:[=\s]+)?(.*)$/,
			];
		case "picom":
			return [
				[GetCommandArgument(vecProgramArgs, "--config"), GetXDGFile(".conf")],
				/^(\w[^=\s]+)(?:[=\s]+)?"?(.*)"?;$/,
			];
	}
}

pIPCRenderer.on("window-message", (ev, args) => {
	postMessage(args);
});

pContextBridge.exposeInMainWorld("electron", {
	cdp,
	fs,
	path,

	process: {
		env: { ...process.env },
		kill: process.kill,
		platform: process.platform,
	},

	MPD,
	X11,

	k_unListHeight,
	k_unUpdateInterval,

	GetCommandArgument,
	GetConfigAndPattern,
	GetProcesses,
	ParseFile,

	SendMesssageToParent(msg) {
		pIPCRenderer.send("send-message-to-parent", msg);
	},

	Window: {
		GetBounds() {
			return pIPCRenderer.invoke("get-bounds");
		},

		SetBounds(pBounds) {
			pIPCRenderer.send("set-bounds", pBounds);
		},

		SetIntendedBounds(strName) {
			pIPCRenderer.send("set-intended-bounds", strName);
		},
	},
});
