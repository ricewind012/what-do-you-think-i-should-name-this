for (const e of Object.keys(electron)) {
	window[e] = electron[e];
}

// TODO: GetWM
setTimeout(() => {
	electron.Window.SetIntendedBounds(location.href.match(/^.*\/(.*).html$/)[1]);
}, 100);
