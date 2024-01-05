// preload.js
declare interface IProcess {
	pid: number;
	cmd: string;
	args: string[];
}

declare var electron: {
	MPD: IModuleMPD;
	X11: IModuleX11;

	/**
	 * Finds the argument from command line arguments.
	 *
	 * @param args Command line arguments.
	 * @param argToFind Argument to look up.
	 */
	GetCommandArguments(args: string[], argToFind: string): string;

	/**
	 * @param program
	 */
	GetConfigAndPattern(program: string): [string[], RegExp];

	/**
	 * Gets a list of processes.
	 */
	GetProcesses(): IProcess[];

	/**
	 * Parses an INI(-like) format file.
	 *
	 * No sections.
	 *
	 * The values will be strings regardless of their type (libconfig).
	 *
	 * @param files Files to look up for existing.
	 * @param pattern The pattern to parse the file by.
	 *
	 * @throws See {@link fs.readFileSync}.
	 */
	ParseINI(files: string[], pattern: RegExp): any;
};

// shared.js
declare interface ILogger {
	Log(format: string, ...arguments: any): void;
	Assert(assertion: boolean, format: string, ...arguments: any): void;
}

declare interface ITimeLogger extends ILogger {
	TimeStart(): void;
	TimeEnd(): void;
}

// mpd
declare interface IMPDSong {
	file: string;
	format: {
		unSampleRate: number;
		unChannels: number;
		unBits: number;
	};
	metadata: {
		strAlbum: string | null;
		strAlbumArtist: string | null;
		strArtist: string | null;
		strComment: string | null;
		strComposer: string | null;
		strDate: string | null;
		strDisc: string | null;
		strGenre: string | null;
		strPerformer: string | null;
		strTitle: string | null;
		strTrack: string | null;
	};
	time: {
		unTotal: number;
	};
}

declare interface IMPDServerStatus {
	bConsume: boolean;
	bRandom: boolean;
	bRepeat: boolean;
	eState: EMPDState;
	eSingleState: EMPDSingleState;
	flMixrampDB: number;
	flMixrampDelay: number;
	nNextSongPos: number;
	nNextSongID: number;
	nSongPos: number;
	nSongID: number;
	nVolume: number;
	unQueueLength: number;
	unQueueVersion: number;
	unCrossfade: number;
	unTimeElapsed: number;
	unTimeTotal: number;
	unKbitRate: number;
	unUpdateID: number;
}

declare interface IMPDServerSettings {
	strHost: string | null;
	strPassword: string | null;
	unPort: number;
	unTimeout: number;
}

declare interface IModuleMPD {
	Controls: {
		// no args
		Next(): void;
		Play(): void;
		Previous(): void;
		Stop(): void;
		TogglePause(): void;

		// bool
		Consume(value: boolean): void;
		Pause(value: boolean): void;
		Random(value: boolean): void;
		Repeat(value: boolean): void;
		Single(value: boolean): void;

		// int
		Crossfade(value: number): void;
		SetPlayID(value: number): void;
		SetPlayPos(value: number): void;

		// float
		SetMixrampDelay(value: number): void;
		SetMixrampDB(value: number): void;
	};

	Database: {
		GetSongList(): IMPDSong[];

		/**
		 * If `string`, folder or a playlist.
		 */
		Navigate(path: string): (IMPDSong | string)[];
	};

	GetCurrentSong(): IMPDSong;

	GetServerStatus(): IMPDServerStatus;

	GetSettings(): IMPDServerSettings;
}

declare enum EMPDState {
	/** no information available */
	UNKNOWN = 0,

	/** not playing */
	STOP = 1,

	/** playing */
	PLAY = 2,

	/** playing, but paused */
	PAUSE = 3,
}

declare enum EMPDSingleState {
	/** disabled */
	OFF = 0,

	/** enabled */
	ON,

	/**
	 * enables single state (#ONESHOT) for a single song, then
	 * MPD disables single state (#OFF) if the current song
	 * has played and there is another song in the current playlist
	 **/
	ONESHOT,

	/** Unknown state */
	UNKNOWN,
}

// x11
declare interface IModuleX11 {
	GetScreenSize(): [number, number];
}
