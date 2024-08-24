export interface ILogger {
	Log(format: string, ...args: any): void;
	Assert(assertion: boolean, format: string, ...args: any): void;
}

export interface ITimeLogger extends ILogger {
	TimeStart(): void;
	TimeEnd(): void;
}
