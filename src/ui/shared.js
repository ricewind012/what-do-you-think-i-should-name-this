export const id = (s) => document.getElementById(s);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class CLog {
	constructor(strName) {
		this.m_strName = strName;
	}

	#Print(strMethod, strFormat, ...args) {
		console[strMethod](
			`%c${this.m_strName}%c ${strFormat}`,
			"background-color: black; color: white; padding: 0 1ch",
			"",
			...args,
		);
	}

	Log(strFormat, ...args) {
		this.#Print("log", strFormat, ...args);
	}

	Warn(strFormat, ...args) {
		this.#Print("warn", strFormat, ...args);
	}

	Error(strFormat, ...args) {
		this.#Print("error", strFormat, ...args);
	}

	Assert(bAssertion, strFormat, ...args) {
		if (bAssertion) {
			return;
		}

		this.Error(`Assertion failed: ${strFormat}`, ...args);
	}
}

export class CLogTime extends CLog {
	constructor(strName, strLabel) {
		super(strName);

		this.m_strLabel = strLabel;
	}

	TimeStart() {
		this.m_pDate = new Date();
	}

	TimeEnd() {
		const pCurrentDate = new Date();

		this.Log(
			"%s: took %o seconds",
			this.m_strLabel,
			(pCurrentDate - this.m_pDate) / 1000,
		);
	}
}

export function RenderList(elParent, fnCallback) {
	const elEntry = pElements.elEntry.content.cloneNode(true);
	const elEntryContainer = elEntry.children[0];

	fnCallback(elEntryContainer, [...elEntryContainer.children]);
	elParent.appendChild(elEntry);
}

export function RenderProgress(elProgress, flProgressValue) {
	elProgress.value = flProgressValue;
	elProgress.style.setProperty("--value", `${flProgressValue * 100}%`);
}

export async function ResizeWindowForList() {
	const elList = pElements.elList;
	const elListSearch = pElements.elListSearchContainer;
	const bListHidden = elList.hidden && (elListSearch?.hidden ?? true);
	const pBounds = await electron.Window.GetBounds();
	pBounds.y -= k_unListHeight * (bListHidden ? 1 : -1);
	pBounds.height += k_unListHeight * (bListHidden ? 1 : -1);

	elList.hidden = !bListHidden;
	electron.Window.SetBounds(pBounds);
}
