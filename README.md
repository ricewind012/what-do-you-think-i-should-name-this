## Modules

Building: `./build_modules` for all, `./build_modules <module>` for a specific one.

| Module | Dependency   |
| ------ | ------------ |
| MPD    | libmpdclient |
| X11    | libxcb       |

## Command line options

Usage: `npm run start -- <options>`

| Option     | Description                                  |
| ---------- | -------------------------------------------- |
| --devtools | Open DevTools for each window.               |
| --windows  | List of windows to open separated by commas. |
