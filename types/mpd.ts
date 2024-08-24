export interface IMPDSong {
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

export interface IMPDServerStatus {
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

export interface IMPDServerSettings {
	strHost: string | null;
	strPassword: string | null;
	unPort: number;
	unTimeout: number;
}

export interface IModuleMPD {
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

export enum EMPDState {
	/** no information available */
	UNKNOWN,

	/** not playing */
	STOP,

	/** playing */
	PLAY,

	/** playing, but paused */
	PAUSE,
}

export enum EMPDSingleState {
	/** disabled */
	OFF,

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
