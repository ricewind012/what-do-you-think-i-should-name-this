import type { IModuleMPD } from "./mpd";
import type { IModuleX11 } from "./x11";

export interface IProcess {
	pid: number;
	cmd: string;
	args: string[];
}

export declare const electron: {
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
