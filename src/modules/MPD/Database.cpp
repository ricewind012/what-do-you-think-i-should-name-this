#include "../shared/mpd.h"

void
GetSongList(const FunctionCallbackInfo<Value>& args)
{
	auto pIsolate = args.GetIsolate();
	auto context = pIsolate->GetCurrentContext();
	auto result = Array::New(pIsolate);

	auto pConnection = GetMPDConnection();
	if (!pConnection)
		return;

	mpd_song* pSong;
	size_t ulIndex = 0;

	while ((pSong = mpd_run_get_queue_song_pos(pConnection, ulIndex)) !=
				 nullptr) {
		result->Set(context, ulIndex, DescribeSong(pSong)).FromJust();
		ulIndex++;
	}

	mpd_connection_free(pConnection);
	args.GetReturnValue().Set(result);
}

void
Navigate(const FunctionCallbackInfo<Value>& args)
{
	auto pIsolate = args.GetIsolate();
	auto context = pIsolate->GetCurrentContext();
	auto result = Array::New(pIsolate);

	if (!args[0]->IsString()) {
		GO_AWAY("The argument must be a string");
	}

	auto pConnection = GetMPDConnection();
	if (!pConnection)
		return;

	size_t ulIndex = 0;
	auto path = String::Utf8Value(pIsolate, args[0]);
	auto szPath = *path;

	mpd_entity* pEntity;
	mpd_send_list_meta(pConnection, szPath);

	while ((pEntity = mpd_recv_entity(pConnection)) != nullptr) {
		const mpd_song* pSong;
		const mpd_directory* pDirectory;
		const mpd_playlist* pPlaylist;
		Local<Value> value;

		switch (mpd_entity_get_type(pEntity)) {
			case MPD_ENTITY_TYPE_UNKNOWN:
				break;

			case MPD_ENTITY_TYPE_SONG:
				pSong = mpd_entity_get_song(pEntity);
				value = DescribeSong(pSong);
				break;

			case MPD_ENTITY_TYPE_DIRECTORY:
				pDirectory = mpd_entity_get_directory(pEntity);
				value = TO_STRING(mpd_directory_get_path(pDirectory));
				break;

			case MPD_ENTITY_TYPE_PLAYLIST:
				pPlaylist = mpd_entity_get_playlist(pEntity);
				value = TO_STRING(mpd_playlist_get_path(pPlaylist));
				break;
		}

		result->Set(context, ulIndex, value).FromJust();
		mpd_entity_free(pEntity);
		ulIndex++;
	}

	mpd_connection_free(pConnection);
	args.GetReturnValue().Set(result);
}

Local<Object>
Database()
{
	auto obj = SetFunctions({
		{ "GetSongList", GetSongList },
		{ "Navigate", Navigate },
	});

	return obj;
}
