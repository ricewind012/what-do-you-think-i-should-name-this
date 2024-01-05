#include <unordered_map>

#include "../shared/mpd.h"

#define GO_AWAY_AND_FREE_ME(msg)                                               \
	ThrowException(pIsolate, msg);                                               \
	mpd_song_free(pSong);                                                        \
	mpd_connection_free(pConnection);                                            \
	return

void
GetCurrentSong(const FunctionCallbackInfo<Value>& args)
{
	auto pIsolate = args.GetIsolate();

	auto pConnection = GetMPDConnection();
	if (!pConnection)
		return;

	auto pSong = mpd_run_current_song(pConnection);
	if (!pSong) {
		GO_AWAY_AND_FREE_ME("pSong == nullptr (no current song?)");
	}

	auto pStatus = GetMPDStatus(pConnection);
	if (!pStatus)
		return;

	auto obj = DescribeSong(pSong, pStatus);

	mpd_song_free(pSong);
	mpd_connection_free(pConnection);
	args.GetReturnValue().Set(obj);
}
