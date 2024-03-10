const {
	app: pApp,
	BrowserWindow: CBrowserWindow,
	ipcMain: pIPCMain,
	Menu: CAppMenu,
} = require("electron");
const CDP = require("chrome-remote-interface");
const path = require("node:path");
const { Addon } = require("./shared");

const X11 = Addon("X11");
const [unScreenWidth, unScreenHeight] = X11.GetScreenSize();

const k_pWindowSizes = [
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

const OperationResponse = (msg) =>
	Object({
		result: 2,
		message: msg,
	});

function CreateWindow(strPageName, pBounds, bDevtools) {
	const pWindow = new CBrowserWindow(
		Object.assign(
			{
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
			},
			pBounds
		)
	);

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
	let pSteamConnection;

	function SkipWindow(wnd, msg) {
		console.error('Skipping window "%s", reason: %s', wnd, msg);
		bLoadWindow = false;
	}

	CAppMenu.setApplicationMenu(null);
	pApp.disableHardwareAcceleration();
	pApp.commandLine.appendSwitch("enable-transparent-visuals");

	await pApp.whenReady();

	pApp.commandLine
		.getSwitchValue("windows")
		.split(",")
		.filter(Boolean)
		.forEach(async (wnd) => {
			// Window-specific things
			bLoadWindow = true;

			if (wnd == "player") {
				// Waits for ready MPD connection on its own, so load it.
			}

			if (wnd == "procs") {
				if (process.platform != "linux") {
					SkipWindow(wnd, "not linux");
				}
			}

			if (wnd == "steam") {
				pSteamConnection = await CDP({
					host: "127.0.0.1",
					port: 8080,
					target: (e) => e.find((e) => e.title == "SharedJSContext"),
				}).catch((e) => {
					SkipWindow(wnd, e.message);
					// For no fucking reason it continues loading instead of skipping.
					pApp.exit(1);
				});
			}
			// end

			const pWindowBounds = k_pWindowSizes.find((e) => e.name == wnd)?.bounds;
			if (!pWindowBounds) {
				SkipWindow(wnd, 'no such window in "k_pWindowSizes"');
			}

			if (!bLoadWindow) {
				return;
			}

			CreateWindow(wnd, pWindowBounds, bDevtools);
		});

	pIPCMain.handle("get-bounds", (ev) => {
		return CBrowserWindow.fromWebContents(ev.sender).getBounds();
	});
	pIPCMain.on("set-bounds", (ev, args) => {
		CBrowserWindow.fromWebContents(ev.sender).setBounds(args);
	});
	pIPCMain.on("set-intended-bounds", (ev, args) => {
		CBrowserWindow.fromWebContents(ev.sender).setBounds(
			k_pWindowSizes.find((e) => e.name == args)?.bounds
		);
	});

	pIPCMain.handle("eval-steam-js", async (ev, args) => {
		let data = await pSteamConnection.Runtime.evaluate({
			expression: args,
			awaitPromise: true,
			returnByValue: true,
		});

		// TODO: for Unregisterable/callbacks maybe use consoleAPICalled ?
		const value = data.result?.value;
		if (!value) {
			return OperationResponse(null);
		}

		if (
			typeof value == "object" &&
			!Array.isArray(value) &&
			Object.keys(value).length == 0
		) {
			return OperationResponse("Empty object, possibly an ArrayBuffer");
		}

		return data.result?.value;
	});

	pApp.on("window-all-closed", () => {
		pSteamConnection?.close();
		pApp.quit();
	});
})();
