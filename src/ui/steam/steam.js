import { id, sleep, CLog, CLogTime } from "../shared.js";

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

	async Evaluate(expression) {
		const data = await this.m_pConnection.Runtime.evaluate({
			expression,
			awaitPromise: true,
			returnByValue: true,
		});

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
	async HandleEvaluation(expression) {
		const data = await this.Evaluate(expression);
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

	async HandleEvaluation(expression) {
		return await pChromeRemoteInterfaceHelper
			.HandleEvaluation(expression)
			.catch((e) => {
				this.m_pLogger.Error(e.message);
			});
	}

	async RenderGames() {
		// Some data (getters ?) is lost on evaluation, hence the .map
		const data = await this.HandleEvaluation(`
			collectionStore
				.GetCollection("favorite")
				.allApps.map((e) => [e, e.display_name, e.installed]);
		`);
		const pTimeLogger = new CLogTime("Steam", "RenderGames()");

		pTimeLogger.TimeStart();
		for (const [i, strGameName, bGameIntalled] of data) {
			const elEntry = pElements.elListEntry.content.cloneNode(true);
			const elEntryContainer = elEntry.children[0];
			const [elEntryImage, elEntryTitle] = [...elEntryContainer.children];

			elEntryContainer.ariaDisabled = !bGameIntalled;
			elEntryImage.src = i.icon_data
				? `data:image/${i.icon_data_format};base64,${i.icon_data}`
				: path.join(
						this.m_strSteamPath,
						"appcache",
						"librarycache",
						`${i.appid}_icon.jpg`,
					);
			elEntryTitle.innerText = strGameName;

			elEntryContainer.addEventListener("click", async () => {
				await pChromeRemoteInterfaceHelper.Evaluate(
					`SteamClient.Apps.RunGame("${i.appid}", '', -1, 0)`,
				);
				this.m_pLogger.Log("Running game %o", strGameName);
			});

			pElements.elGames.appendChild(elEntry);
		}
		pTimeLogger.TimeEnd();
	}

	async RenderServers() {
		const pTimeLogger = new CLogTime("Steam", "RenderServers()");
		pTimeLogger.TimeStart();

		await pSteam.WaitForServerListRequest();
		const vecServers = await this.HandleEvaluation(
			"window._vecFavoriteServers",
		);

		for (const pServer of vecServers) {
			const elEntry = pElements.elListEntry.content.cloneNode(true);
			const elEntryContainer = elEntry.children[0];
			const [elEntryImage, elEntryTitle, elEntryDetails] = [
				...elEntryContainer.children,
			];

			elEntryContainer.ariaDisabled = pServer.players === 0;
			elEntryTitle.innerText = pServer.name;
			elEntryDetails.innerText = `${pServer.players}/${pServer.maxPlayers}`;

			elEntryContainer.addEventListener("click", async () => {
				await pChromeRemoteInterfaceHelper.Evaluate(
					`SteamClient.ServerBrowser.CreateServerGameInfoDialog(
						'${pServer.ip}', ${pServer.port}, ${pServer.queryPort}
					);`,
				);
				this.m_pLogger.Log("Opening dialog for %o", pServer.name);
			});

			pElements.elServers.appendChild(elEntry);
		}
		pTimeLogger.TimeEnd();
	}

	async WaitForServerListRequest() {
		await pChromeRemoteInterfaceHelper.Evaluate(`
			window._vecFavoriteServers = [];
			window._eRequestCompleted = undefined;

			SteamClient.ServerBrowser.CreateServerListRequest(
				440,
				'favorites',
				['gamedir', 'tf'],
				(e) => {
					window._vecFavoriteServers.push(e);
				},
				(e) => {
					window._eRequestCompleted = e;
				},
			);
		`);

		while (
			!(await pChromeRemoteInterfaceHelper.Evaluate(
				"window._eRequestCompleted !== undefined",
			))
		);
	}
}

const k_EResult_Fail = 2;
const OperationResponse = (msg) => ({
	result: k_EResult_Fail,
	message: msg,
});

let pElements = null;
let pChromeRemoteInterfaceHelper;
const pSteam = new CSteam();

document.addEventListener("DOMContentLoaded", async () => {
	pElements = {
		elGames: id("steam-games"),
		elServers: id("steam-servers"),
		elListEntry: id("steam-list-entry"),
	};

	let pConnection = await CChromeRemoteInterfaceHelper.GetConnection();
	while (!pConnection) {
		pConnection = await CChromeRemoteInterfaceHelper.GetConnection();
		await sleep(1_000);
	}
	pChromeRemoteInterfaceHelper = new CChromeRemoteInterfaceHelper(pConnection);

	pSteam.RenderGames();
	pSteam.RenderServers();
});
