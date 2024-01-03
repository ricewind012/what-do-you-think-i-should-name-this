#include <unordered_map>

#include "../shared/mpd.h"

#define GO_AWAY_AND_FREE_ME(msg)                                               \
	ThrowException(pIsolate, msg);                                               \
	mpd_connection_free(pConnection);                                            \
	return

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

	auto pStatus = GetMPDStatus(pConnection);
	if (!pStatus)
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

		switch (mpd_entity_get_type(pEntity)) {
			case MPD_ENTITY_TYPE_UNKNOWN:
				break;

			case MPD_ENTITY_TYPE_SONG:
				pSong = mpd_entity_get_song(pEntity);
				result->Set(context, ulIndex, DescribeSong(pSong, pStatus)).FromJust();
				break;

			case MPD_ENTITY_TYPE_DIRECTORY:
				pDirectory = mpd_entity_get_directory(pEntity);
				result
					->Set(context, ulIndex, TO_STRING(mpd_directory_get_path(pDirectory)))
					.FromJust();
				break;

			case MPD_ENTITY_TYPE_PLAYLIST:
				pPlaylist = mpd_entity_get_playlist(pEntity);
				result
					->Set(context, ulIndex, TO_STRING(mpd_playlist_get_path(pPlaylist)))
					.FromJust();
				break;
		}

		mpd_entity_free(pEntity);
		ulIndex++;
	}

	mpd_connection_free(pConnection);

	args.GetReturnValue().Set(result);
}

void
GetList(const FunctionCallbackInfo<Value>& args)
{
	auto pIsolate = args.GetIsolate();
	auto context = pIsolate->GetCurrentContext();
	auto result = Array::New(pIsolate);

	auto pConnection = GetMPDConnection();
	if (!pConnection)
		return;

	auto pStatus = GetMPDStatus(pConnection);
	if (!pStatus)
		return;

	mpd_song* pSong;
	size_t ulIndex = 0;
	while ((pSong = mpd_run_get_queue_song_pos(pConnection, ulIndex)) !=
				 nullptr) {
		result->Set(context, ulIndex, DescribeSong(pSong, pStatus)).FromJust();
		ulIndex++;
	}

	mpd_connection_free(pConnection);

	args.GetReturnValue().Set(result);
}

Local<Object>
Database()
{
	auto pIsolate = Isolate::GetCurrent();
	auto context = pIsolate->GetCurrentContext();
	auto obj = Object::New(pIsolate);

	std::unordered_map<const char*, FunctionCallback> mapFunctions = {
		{ "Navigate", Navigate },
		{ "GetList", GetList },
	};

	for (const auto& [k, v] : mapFunctions) {
		auto tpl = FunctionTemplate::New(pIsolate, v);
		auto fn = tpl->GetFunction(context).ToLocalChecked();

		fn->SetName(TO_STRING("hiii"));
		OBJ_MEMBER(k, fn);
	}

	return obj;
}
