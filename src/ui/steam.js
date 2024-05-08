class CChromeRemoteInterfaceHelper {
	constructor(pConnection) {
		/** @type {import("@types/chrome-remote-interface").Client')} */
		this.m_pConnection = pConnection;
	}

	/** @returns {import("@types/chrome-remote-interface").Client')} */
	static async GetConnection() {
		return await cdp({
			host: "127.0.0.1",
			port: 8080,
			target: (e) => e.find((e) => e.title === "SharedJSContext"),
		});
	}

	async Evaluate(strJS) {
		const data = await this.m_pConnection.Runtime.evaluate({
			expression: strJS,
			awaitPromise: true,
			returnByValue: true,
		});

		// TODO: for Unregisterable/callbacks maybe use consoleAPICalled ?
		const value = data.result?.value;
		if (!value) {
			return OperationResponse(null);
		}

		if (
			typeof value === "object" &&
			!Array.isArray(value) &&
			Object.keys(value).length === 0
		) {
			return OperationResponse("Empty object, possibly an ArrayBuffer");
		}

		return data.result?.value;
	}

	async GetRegistrarData(strRegistrar, unTimeout = 1_000) {
		return await this.HandleEvaluation(`
			_registrarData = undefined;
			_hRegistrar = SteamClient.${strRegistrar}((e) => {
				window._registrarData = e;
			});
			setTimeout(() => {
				_hRegistrar.unregister();
			}, ${unTimeout});

			_registrarData;
		`);
	}

	/**
	 * Wrapper for {@link Evaluate}, since promises can not be used.
	 */
	async HandleEvaluation(strJS) {
		const data = await this.Evaluate(strJS);
		if (data.result === k_EResult_Fail) {
			throw new Error(data.message);
		}

		return data;
	}
}

class CSteam {
	constructor() {
		this.m_pLogger = new CLog("CSteam");
		this.m_strSteamPath = path.join(process.env.HOME, ".steam", "steam");
	}

	async RenderGames() {
		const data = await pChromeRemoteInterfaceHelper
			.HandleEvaluation("collectionStore.GetCollection('favorite').allApps")
			.catch((e) => {
				this.m_pLogger.Error(e.message);
			});
		const pTimeLogger = new CLogTime("Steam", "RenderGames()");

		pTimeLogger.TimeStart();
		for (const i of data) {
			const elEntry = pElements.elGameEntry.content.cloneNode(true);
			const elEntryContainer = elEntry.children[0];
			const [elEntryImage, elEntryTitle] = [...elEntryContainer.children];

			elEntryContainer.ariaDisabled = i.installed;
			elEntryImage.src = path.join(
				this.m_strSteamPath,
				"appcache",
				"librarycache",
				`${i.appid}_icon.jpg`,
			);
			elEntryTitle.innerText = i.display_name;

			elEntryContainer.addEventListener("click", async () => {
				await pChromeRemoteInterfaceHelper.Evaluate(
					`SteamClient.Apps.RunGame("${i.appid}", '', -1, 0)`,
				);
				this.m_pLogger.Log("Running game %o", i.display_name);
			});

			pElements.elFavorites.appendChild(elEntry);
		}
		pTimeLogger.TimeEnd();
	}
}

const k_EResult_Fail = 2;
const OperationResponse = (msg) =>
	Object({
		result: k_EResult_Fail,
		message: msg,
	});

let pElements = null;
let pChromeRemoteInterfaceHelper;
const pSteam = new CSteam();

document.addEventListener("DOMContentLoaded", async () => {
	pElements = {
		elFavorites: id("steam-favorites"),
		elGameEntry: id("steam-game-entry"),
	};

	let pConnection = await CChromeRemoteInterfaceHelper.GetConnection();
	while (!pConnection) {
		pConnection = await CChromeRemoteInterfaceHelper.GetConnection();
		await sleep(1_000);
	}
	pChromeRemoteInterfaceHelper = new CChromeRemoteInterfaceHelper(pConnection);

	pSteam.RenderGames();
});
