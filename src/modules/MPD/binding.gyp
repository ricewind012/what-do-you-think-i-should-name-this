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
				"../shared/mpd.cpp",
				"Controls.cpp",
				"Database.cpp",
				"GetCurrentSong.cpp",
				"GetServerStatus.cpp",
				"GetSettings.cpp",
				"main.cpp",
			],
			"libraries": [
				"<!@(pkg-config --libs libmpdclient)",
			]
		}
	]
}
