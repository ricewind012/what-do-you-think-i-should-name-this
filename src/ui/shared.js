const id = (s) => document.getElementById(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CLog {
	constructor(strName, strMethod = "warn") {
		this.m_strName = strName;
		this.m_strMethod = strMethod;
	}

	Log(strFormat, arg) {
		arg = strFormat.match(/%[a-z]/) ? arg : "";

		console[this.m_strMethod](
			`%c${this.m_strName}%c ${strFormat}`,
			"background-color: black; color: white; padding: 0 1ch",
			"",
			arg
		);
	}

	Assert(bAssertion, strFormat, arg) {
		if (bAssertion) {
			return;
		}

		// fucking kill yourself
		const strPrevMethod = this.m_strMethod;
		this.m_strMethod = "error";
		this.Log(`Assertion failed: ${strFormat}`, arg);
		this.m_strMethod = strPrevMethod;
	}
}
