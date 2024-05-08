const {
	app: pApp,
	BrowserWindow: CBrowserWindow,
	ipcMain: pIPCMain,
	Menu: CAppMenu,
} = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { Addon } = require("./shared");

const X11 = Addon("X11");
const [unScreenWidth, unScreenHeight] = X11.GetScreenSize();

const k_vecWindowSizes = [
	{
		name: "player",
		bounds: {
			x: unScreenWidth - 400,
			y: unScreenHeight - 140,
			width: 400,
			height: 140,
		},
	},
	{
		name: "procs",
		bounds: {
			x: unScreenWidth - 400,
			y: 275,
			width: 400,
			height: 250,
		},
	},
	{
		name: "steam",
		bounds: {
			x: unScreenWidth - 400,
			y: unScreenHeight - 140,
			width: 400,
			height: 600,
		},
	},
];

const vecPaths = process.env.PATH.split(":");
const BIsInstalled = (strProgram) =>
	!!vecPaths.find((e) => fs.existsSync(path.join(e, "steam")));

function CreateWindow(strPageName, pBounds, bDevtools) {
	const pWindow = new CBrowserWindow({
		...pBounds,
		autoHideMenuBar: true,
		backgroundColor: "#00000000",
		frame: false,
		resizable: false,
		transparent: true,

		show: false, // Try to prevent the white flash
		skipTaskbar: true,
		webPreferences: {
			nodeIntegration: true,
			preload: path.join(__dirname, "preload.js"),
		},
	});

	pWindow.loadFile(path.join("src", "ui", `${strPageName}.html`));
	pWindow.once("ready-to-show", () => {
		pWindow.show();

		if (bDevtools) {
			pWindow.webContents.openDevTools();
		}
	});

	return pWindow;
}

(async () => {
	const bDevtools = pApp.commandLine.hasSwitch("devtools");
	let bLoadWindow = true;

	function SkipWindow(wnd, msg) {
		console.error('Skipping window "%s", reason: %s', wnd, msg);
		bLoadWindow = false;
	}

	CAppMenu.setApplicationMenu(null);
	pApp.disableHardwareAcceleration();
	pApp.commandLine.appendSwitch("enable-transparent-visuals");

	await pApp.whenReady();

	const vecWindows = pApp.commandLine.getSwitchValue("windows").split(",");
	for (const wnd of vecWindows) {
		bLoadWindow = true;

		const pWindowBounds = k_vecWindowSizes.find((e) => e.name === wnd)?.bounds;
		if (!pWindowBounds) {
			SkipWindow(wnd, 'no such window in "k_vecWindowSizes"');
		}

		// Window-specific things
		if (wnd === "player") {
			if (!BIsInstalled("mpd")) {
				SkipWindow(wnd, "mpd is not installed");
			}
		}

		if (wnd === "procs") {
			if (process.platform !== "linux") {
				SkipWindow(wnd, "not linux");
			}
		}

		if (wnd === "steam") {
			if (!BIsInstalled("steam")) {
				SkipWindow(wnd, "steam is not installed");
			}
		}
		// end

		if (!bLoadWindow) {
			continue;
		}

		CreateWindow(wnd, pWindowBounds, bDevtools);
	}

	pIPCMain.on("set-bounds", (ev, args) => {
		CBrowserWindow.fromWebContents(ev.sender).setBounds(args);
	});

	pIPCMain.on("set-intended-bounds", (ev, args) => {
		CBrowserWindow.fromWebContents(ev.sender).setBounds(
			k_vecWindowSizes.find((e) => e.name === args)?.bounds,
		);
	});

	pIPCMain.handle("get-bounds", (ev) => {
		return CBrowserWindow.fromWebContents(ev.sender).getBounds();
	});

	pApp.on("window-all-closed", () => {
		pApp.quit();
	});
})();
