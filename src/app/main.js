const {
	app: pApp,
	BrowserWindow: CBrowserWindow,
	ipcMain: pIPCMain,
	Menu: CAppMenu,
} = require("electron");
const path = require("node:path");

const k_pWindowSizes = [
	{
		name: "player",
		size: [400, 140],
	},
	{
		name: "procs",
		size: [400, 1080],
	},
];

function CreateWindow(strPageName, additionalOptions) {
	const options = Object.assign(
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
		additionalOptions
	);
	const pWindow = new CBrowserWindow(options);

	pWindow.loadFile(path.join("src", "ui", `${strPageName}.html`));
	pWindow.once("ready-to-show", () => {
		pWindow.show();
		pWindow.webContents.openDevTools();
	});

	return pWindow;
}

(async () => {
	CAppMenu.setApplicationMenu(null);
	pApp.disableHardwareAcceleration();
	pApp.commandLine.appendSwitch("enable-transparent-visuals");

	await pApp.whenReady();

	pApp.commandLine
		.getSwitchValue("windows")
		.split(",")
		.forEach((w) => {
			const { size: vecWindowSize } = k_pWindowSizes.find((e) => e.name == w);
			const pWindow = CreateWindow(w, {
				width: vecWindowSize[0],
				height: vecWindowSize[1],
			});

			pIPCMain.handle("get-bounds", () => {
				return pWindow.getBounds();
			});
			pIPCMain.on("set-bounds", (_, args) => {
				pWindow.setBounds(args);
			});
			pIPCMain.on("close-app", () => {
				pApp.quit();
			});
			pIPCMain.handle("create-window", (ev, args) => {
				return new Promise((resolve) => {
					const pWindow = CreateWindow(args.page, args.options);

					pWindow.once("ready-to-show", () => {
						pWindow.webContents.postMessage("window-message", args.msg);

						resolve(pWindow.id);
					});
				});
			});
			pIPCMain.on("close-window", (ev, args) => {
				CBrowserWindow.fromId(args)?.close();
			});
			pIPCMain.on("send-message-to-parent", (ev, args) => {
				if (ev.sender == pWindow.webContents) {
					return;
				}

				pWindow.webContents.postMessage("window-message", args);
			});
		});

	pApp.on("window-all-closed", () => {
		pApp.quit();
	});
})();
