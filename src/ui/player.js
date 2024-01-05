/*global id sleep CLog CLogTime electron*/

const k_strEmptyImage = "data:image/gif;base64,R0lGODlhAQABADs7Ozs=";
const k_vecImageFormats = ["avif", "bmp", "jpg", "jpeg", "png"];
const k_nListHeight = 350;
const k_nInterval = 2_500;

class CPlayerList {
	constructor() {
		this.m_bRendered = false;
		/** @type ILogger */
		this.m_pSearchLogger = new CLogTime("CPlayerList", "Search()");
		/** @type ILogger */
		this.m_pRenderLogger = new CLogTime("CPlayerList", "Render()");
		/** @type HTMLElement[] */
		this.m_vecEntries = [];
		/** @type IMPDSong[] */
		this.m_vecSongs = [];
	}

	SearchStop() {
		if (!this.m_bRendered) {
			return;
		}

		pElements.elList.hidden = false;
		pElements.elListSearchContainer.hidden = true;
	}

	SearchStart() {
		if (!this.m_bRendered) {
			return;
		}

		const elInput = pElements.elSearchInput;
		pElements.elList.hidden = true;
		pElements.elListSearchContainer.hidden = false;
		elInput.focus();
	}

	Search(strQuery) {
		if (!this.m_bRendered || pElements.elListSearchContainer.hidden) {
			return;
		}

		this.m_pSearchLogger.TimeStart();

		pElements.elListSearch.innerHTML = "";
		// TODO: maybe only title
		const vecKeys = Object.keys(this.m_vecSongs[0].metadata);
		this.m_vecSongs
			.map(
				(e, i) =>
					vecKeys
						.map((m) => e.metadata[m]?.toLowerCase())
						.join("")
						.includes(strQuery.toLowerCase()) && i
			)
			.filter(Boolean)
			.forEach((e) => {
				const elEntryContainer = this.m_vecEntries[e].cloneNode(true);

				pElements.elListSearch.appendChild(elEntryContainer);
				elEntryContainer.addEventListener("click", () => {
					electron.MPD.Controls.SetPlayPosition(e);
					pList.Render();
				});
			});

		this.m_pSearchLogger.TimeEnd();
	}

	GetTime(nSeconds) {
		const nRemainder = nSeconds - (nSeconds % 60);

		return `${nRemainder / 60}:${(nSeconds - nRemainder)
			.toString()
			.padStart(2, "0")}`;
	}

	Render() {
		this.m_pRenderLogger.TimeStart();
		const elList = pElements.elList;

		// Do it only on the first try.
		if (this.m_bRendered) {
			return;
		}

		this.m_vecSongs = electron.MPD.Database.GetSongList();
		this.m_vecEntries = this.m_vecSongs.map((e, i) => {
			const pSong = e;
			const { unTotal } = pSong.time;
			const { strArtist, strTitle } = pSong.metadata;

			const elEntry = pElements.elEntry.content.cloneNode(true);
			const elEntryContainer = elEntry.children[0];
			const [elEntryArtist, elEntryTitle, elEntryTime] = [
				...elEntryContainer.children,
			];

			elEntryArtist.innerText = strArtist;
			elEntryTitle.innerText = strTitle;
			elEntryTime.innerText = this.GetTime(unTotal);

			elEntryContainer.addEventListener("click", () => {
				electron.MPD.Controls.SetPlayPosition(i);
				this.Render();
			});

			elList.appendChild(elEntry);

			return elEntryContainer;
		});

		this.m_pRenderLogger.TimeEnd();
		this.m_bRendered = true;
	}
}

class CPlayer {
	constructor() {
		/** @type ILogger */
		this.m_pLogger = new CLog("CPlayer");
		/** @type IMPDSong */
		this.m_pSong = null;
		/** @type IMPDServerStatus */
		this.m_pServerStatus = null;
		this.m_strMusicDir = (() => {
			const [vecFiles, rPattern] = electron.GetConfigAndPattern("mpd");

			return electron
				.ParseINI(vecFiles, rPattern)
				.music_directory.replace("~", electron.env.HOME);
		})();
	}

	RenderProgress(nProgressValue) {
		pElements.elProgress.value = nProgressValue;
		pElements.elProgress.style.setProperty(
			"--value",
			nProgressValue * 100 + "%"
		);
	}

	RenderMetadata() {
		const pMetadata = this.m_pSong.metadata;
		const strDate = pMetadata.strDate;

		pElements.elAlbum.innerText = pMetadata.strAlbum;
		pElements.elYear.innerText = strDate ? strDate.match(/^\d{4}/)[0] : null;
		pElements.elArtist.innerText = pMetadata.strArtist;
		pElements.elTitle.innerText =
			pMetadata.strTitle || this.m_pSong.file.split(sep).slice(-1).join(sep);
	}

	// TODO: extract with ffmpeg api (i actually don't care now)
	SetAlbumArt(strPath) {
		pElements.elAlbumArt.src = strPath;
	}

	RenderAlbumArt() {
		const strFilePath = this.m_pSong.file.split(sep).slice(0, -1).join(sep);

		if (strFilePath.includes(".zip")) {
			this.m_pLogger.Log("Current song is in an archive, no album art");
			this.SetAlbumArt(k_strEmptyImage);
			return;
		}

		const vecImages = electron.fs
			.readdirSync(electron.path.join(this.m_strMusicDir, strFilePath))
			.filter((e) => k_vecImageFormats.some((f) => e.endsWith(f)));
		const strCoverFile = vecImages.find((e) => e.startsWith("cover"));
		const strAlbumArt = strCoverFile ? strCoverFile : vecImages[0];
		const bExists = !!strAlbumArt;

		this.m_pLogger.Assert(bExists, "No album cover?");
		this.SetAlbumArt(
			bExists
				? electron.path.join(this.m_strMusicDir, strFilePath, strAlbumArt)
				: k_strEmptyImage
		);
	}

	async Render() {
		this.m_pSong = null;
		while (!this.m_pSong) {
			try {
				this.m_pSong = electron.MPD.GetCurrentSong();
			} catch (e) {
				this.m_pLogger.Assert(this.m_pSong, e.message);
				await sleep(k_nInterval);
			}
		}

		const { unTimeElapsed, unTimeTotal } = this.m_pServerStatus;
		this.RenderProgress(unTimeElapsed / unTimeTotal);
		this.RenderMetadata();
		this.RenderAlbumArt();
	}

	CheckAndRender() {
		this.m_pServerStatus = electron.MPD.GetServerStatus();
		const { eState } = this.m_pServerStatus;
		if (eState == 0 || eState == 3) {
			return;
		}

		this.Render();
	}
}

let pElements = null;
let pList = new CPlayerList();
let pPlayer = new CPlayer();

const sep = electron.path.sep;

window.addEventListener("keydown", (ev) => {
	switch (ev.key) {
		// Controls
		case " ":
			electron.MPD.Controls.TogglePause();
			break;

		case "<":
			electron.MPD.Controls.Previous();
			pPlayer.Render();
			break;

		case ">":
			electron.MPD.Controls.Next();
			pPlayer.Render();
			break;

		// Search
		case "Escape":
			pList.SearchStop();
			break;

		case "/":
			pList.SearchStart();
			pElements.elSearchInput.value = "";
			break;
	}
});

document.addEventListener("DOMContentLoaded", () => {
	pElements = {
		elAlbum: id("player-song-album"),
		elAlbumArt: id("player-album-art"),
		elArtist: id("player-song-artist"),
		elTitle: id("player-song-title"),
		elYear: id("player-song-year"),
		elProgress: id("player-progress"),

		elPrevious: id("player-previous"),
		elToggle: id("player-toggle"),
		elTogglePause: id("player-toggle-pause"),
		elTogglePlay: id("player-toggle-play"),
		elNext: id("player-next"),

		elList: id("player-list"),
		elListSearchContainer: id("player-list-search-container"),
		elListSearch: id("player-list-search"),
		elSearchInput: id("player-search-input"),
		elEntry: id("player-list-entry"),
	};

	pElements.elSearchInput.addEventListener("input", (ev) => {
		// TODO: wtf
		const strQuery = ev.target.value.replace(/^\//, "");

		if (strQuery.length <= 2) {
			return;
		}

		pList.Search(strQuery);
	});

	pElements.elAlbumArt.addEventListener("click", async () => {
		const elList = pElements.elList;
		const elListSearch = pElements.elListSearchContainer;
		const bListHidden = elList.hidden && elListSearch.hidden;
		const pBounds = await electron.Window.GetBounds();
		pBounds.y -= k_nListHeight * (bListHidden ? 1 : -1);
		pBounds.height += k_nListHeight * (bListHidden ? 1 : -1);

		pList.Render();
		pList.SearchStop();
		elList.hidden = !bListHidden;
		electron.Window.SetBounds(pBounds);
	});

	pElements.elProgress.addEventListener("click", (ev) => {
		const { eState } = pPlayer.m_pServerStatus;
		if (eState == 0 || eState == 3) {
			return;
		}

		const nProgress = (ev.pageX - nContentMargin) / nProgressWidth;
		electron.MPD.Controls.Seek(nProgress * pPlayer.m_pSong.time.unTotal);
		pPlayer.RenderProgress(nProgress);
	});

	pElements.elPrevious.addEventListener("click", () => {
		electron.MPD.Controls.Previous();
		pPlayer.Render();
	});

	pElements.elToggle.addEventListener("click", () => {
		const { eState } = pPlayer.m_pServerStatus;

		electron.MPD.Controls.TogglePause();
		pElements[eState == 3 ? "elTogglePause" : "elTogglePlay"].hidden = true;
		pElements[eState == 3 ? "elTogglePlay" : "elTogglePause"].hidden = false;
	});

	pElements.elNext.addEventListener("click", () => {
		electron.MPD.Controls.Next();
		pPlayer.Render();
	});

	const nContentMargin = getComputedStyle(document.documentElement)
		.getPropertyValue("--spacing")
		.match(/^\d+/)[0];
	const nProgressWidth = getComputedStyle(pElements.elProgress).width.replace(
		"px",
		""
	);

	pPlayer.CheckAndRender();
	setInterval(() => {
		pPlayer.CheckAndRender();
	}, k_nInterval);
});
