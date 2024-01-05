const id = (s) => document.getElementById(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CLog {
	constructor(strName, strMethod = "warn") {
		this.m_strName = strName;
		this.m_strMethod = strMethod;
	}

	Log(strFormat, ...args) {
		console[this.m_strMethod](
			`%c${this.m_strName}%c ${strFormat}`,
			"background-color: black; color: white; padding: 0 1ch",
			"",
			...args
		);
	}

	Assert(bAssertion, strFormat, ...args) {
		if (bAssertion) {
			return;
		}

		// fucking kill yourself
		const strPrevMethod = this.m_strMethod;
		this.m_strMethod = "error";
		this.Log(`Assertion failed: ${strFormat}`, ...args);
		this.m_strMethod = strPrevMethod;
	}
}

class CLogTime extends CLog {
	constructor(strName, strLabel) {
		super(strName, "info");

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
			(pCurrentDate - this.m_pDate) / 1000
		);
	}
}
