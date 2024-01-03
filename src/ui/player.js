/*global id sleep CLog electron*/

const k_strEmptyAlbumArt = "data:image/gif;base64,R0lGODlhAQABADs7Ozs=";
const k_vecImageFormats = ["avif", "bmp", "jpg", "jpeg", "png"];
const k_nListHeight = 350;
const k_nInterval = 2_500;

class CPlayerList {
	GetTime(nSeconds) {
		const nRemainder = nSeconds - (nSeconds % 60);

		return `${nRemainder / 60}:${(nSeconds - nRemainder)
			.toString()
			.padStart(2, "0")}`;
	}

	Render() {
		const elList = pElements.elList;

		// Do it only on the first try.
		if (elList.innerHTML != "") {
			return;
		}

		/** @type IMPDSong[] */
		const vecList = electron.MPD.Database.GetList();
		for (let i = 0; i < vecList.length; i++) {
			const pSong = vecList[i];
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

			elEntryContainer.addEventListener("dblclick", () => {
				electron.MPD.Controls.SetPlayPosition(i);
			});

			elList.appendChild(elEntry);
		}
	}
}

class CPlayer {
	constructor() {
		/** @type ILogger */
		this.m_pLogger = new CLog("MPD");
		/** @type IMPDSong */
		this.m_pSong = null;
		/** @type IMPDServerStatus */
		this.m_pServerStatus = null;
	}

	RenderProgress(nProgressValue) {
		pElements.elProgress.value = nProgressValue;
		pElements.elProgress.style.setProperty(
			"--value",
			nProgressValue * 100 + "%"
		);
	}

	RenderMetadata() {
		const strDate = this.m_pSong.metadata.strDate;

		pElements.elAlbum.innerText = this.m_pSong.metadata.strAlbum;
		pElements.elYear.innerText = strDate ? strDate.match(/^\d{4}/)[0] : null;
		pElements.elArtist.innerText = this.m_pSong.metadata.strArtist;
		pElements.elTitle.innerText =
			this.m_pSong.metadata.strTitle ||
			this.m_pSong.file.split(sep).slice(-1).join(sep);
	}

	// TODO: extract with ffmpeg api
	SetAlbumArt(strPath) {
		pElements.elAlbumArt.src = strPath;
	}

	RenderAlbumArt() {
		const strFilePath = this.m_pSong.file.split(sep).slice(0, -1).join(sep);

		if (strFilePath.includes(".zip")) {
			this.m_pLogger.Log("Current song is in an archive, no album art");
			this.SetAlbumArt(k_strEmptyAlbumArt);
			return;
		}

		const vecImages = electron.fs
			.readdirSync(electron.path.join(strMusicDir, strFilePath))
			.filter((e) => k_vecImageFormats.some((f) => e.endsWith(f)));
		const strCoverFile = vecImages.find((e) => e.startsWith("cover"));
		const strAlbumArt = strCoverFile ? strCoverFile : vecImages[0];
		const bExists = !!strAlbumArt;

		this.m_pLogger.Assert(bExists, "No album cover?");
		this.SetAlbumArt(
			bExists
				? electron.path.join(strMusicDir, strFilePath, strAlbumArt)
				: k_strEmptyAlbumArt
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

const strMusicDir = (() => {
	const [vecFiles, rPattern] = electron.GetConfigAndPattern("mpd");

	return electron
		.ParseINI(vecFiles, rPattern)
		.music_directory.replace("~", electron.env.HOME);
})();

const sep = electron.path.sep;

document.addEventListener("keydown", (ev) => {
	switch (ev.key) {
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
		elEntry: id("player-list-entry"),
	};

	pElements.elAlbumArt.addEventListener("click", async () => {
		const bListHidden = pElements.elList.hidden;
		const pBounds = await electron.Window.GetBounds();
		pBounds.y -= k_nListHeight * (bListHidden ? 1 : -1);
		pBounds.height += k_nListHeight * (bListHidden ? 1 : -1);

		pList.Render();
		electron.Window.SetBounds(pBounds);
		pElements.elList.hidden = !bListHidden;
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
