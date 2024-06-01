{
	"targets": [
		{
			"target_name": "addon",
			"cflags_cc": [
				"-std=c++20",
				"-fpermissive",
			],
			"sources": [
				"../shared/shared.cpp",
				"mpd_shared.cpp",
				"controls.cpp",
				"current_song.cpp",
				"db.cpp",
				"server_status.cpp",
				"settings.cpp",
				"main.cpp",
			],
			"libraries": [
				"<!@(pkg-config --libs libmpdclient)",
			]
		}
	]
}
