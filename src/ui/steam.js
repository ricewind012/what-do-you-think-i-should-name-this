class CSteam {
	constructor() {
		this.m_pLogger = new CLog("CSteam");
		this.m_strSteamPath = path.join(process.env.HOME, ".steam", "steam");
	}

	async RenderGames() {
		const data = await HandleEvaluation(
			"collectionStore.GetCollection('favorite').allApps",
		).catch((e) => {
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
				await electron.Steam.Evaluate(
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

let pElements = null;
const pSteam = new CSteam();

/**
 * Wrapper for `Steam.Evaluate`, since promises can not be used.
 */
async function HandleEvaluation(strExpression) {
	const data = await electron.Steam.Evaluate(strExpression);
	if (data.result === k_EResult_Fail) {
		throw new Error(data.message);
	}

	return data;
}

const GetRegistrarData = async (strRegistrar, unTimeout = 1_000) =>
	await HandleEvaluation(`
		_registrarData = undefined;
		_hRegistrar = SteamClient.${strRegistrar}((e) => {
			window._registrarData = e;
		});
		setTimeout(() => {
			_hRegistrar.unregister();
		}, ${unTimeout});

		_registrarData;
	`);

document.addEventListener("DOMContentLoaded", async () => {
	pElements = {
		elFavorites: id("steam-favorites"),
		elGameEntry: id("steam-game-entry"),
	};

	pSteam.RenderGames();
});
