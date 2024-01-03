{
	"targets": [
		{
			"target_name": "addon",
			"cflags_cc": [ "-std=c++20" ],
			"sources": [
				"../shared/shared.cpp",
				"main.cpp"
			],
			"libraries": [
				"<!@(pkg-config --libs x11)",
			]
		}
	]
}
