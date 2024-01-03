#include <unordered_map>

#include "../shared/mpd.h"

#define GO_AWAY_AND_FREE_ME(msg)                                               \
	ThrowException(pIsolate, msg);                                               \
	mpd_status_free(pStatus);                                                    \
	mpd_connection_free(pConnection);                                            \
	return

void
GetServerStatus(const FunctionCallbackInfo<Value>& args)
{
	auto pIsolate = args.GetIsolate();
	auto context = pIsolate->GetCurrentContext();
	auto obj = Object::New(pIsolate);

	auto pConnection = GetMPDConnection();
	if (!pConnection)
		return;

	auto pStatus = GetMPDStatus(pConnection);
	if (!pStatus)
		return;

	// TODO: this does it twice
	auto eState = mpd_status_get_state(pStatus);
	if (eState == MPD_STATE_UNKNOWN) {
		GO_AWAY_AND_FREE_ME("eState == MPD_STATE_UNKNOWN");
	}

	std::unordered_map<const char*, Local<Value>> mapMembers = {
		{ "bConsume", Boolean::New(pIsolate, mpd_status_get_consume(pStatus)) },
		{ "bRandom", Boolean::New(pIsolate, mpd_status_get_random(pStatus)) },
		{ "bRepeat", Boolean::New(pIsolate, mpd_status_get_repeat(pStatus)) },
		{ "eState", Number::New(pIsolate, eState) },
		{ "eSingleState",
			Number::New(pIsolate, mpd_status_get_single_state(pStatus)) },
		{ "flMixrampDB", Number::New(pIsolate, mpd_status_get_mixrampdb(pStatus)) },
		{ "flMixrampDelay",
			Number::New(pIsolate, mpd_status_get_mixrampdelay(pStatus)) },
		{ "nNextSongPos",
			Number::New(pIsolate, mpd_status_get_next_song_pos(pStatus)) },
		{ "nNextSongID",
			Number::New(pIsolate, mpd_status_get_next_song_id(pStatus)) },
		{ "nSongPos", Number::New(pIsolate, mpd_status_get_song_pos(pStatus)) },
		{ "nSongID", Number::New(pIsolate, mpd_status_get_song_id(pStatus)) },
		{ "nVolume", Number::New(pIsolate, mpd_status_get_volume(pStatus)) },
		{ "unQueueLength",
			Number::New(pIsolate, mpd_status_get_queue_length(pStatus)) },
		{ "unQueueVersion",
			Number::New(pIsolate, mpd_status_get_queue_version(pStatus)) },
		{ "unCrossfade", Number::New(pIsolate, mpd_status_get_crossfade(pStatus)) },
		{ "unTimeElapsed",
			Number::New(pIsolate, mpd_status_get_elapsed_time(pStatus)) },
		{ "unTimeTotal",
			Number::New(pIsolate, mpd_status_get_total_time(pStatus)) },
		{ "unKbitRate", Number::New(pIsolate, mpd_status_get_kbit_rate(pStatus)) },
		{ "unUpdateID", Number::New(pIsolate, mpd_status_get_update_id(pStatus)) },
	};

	for (const auto& [k, v] : mapMembers) {
		OBJ_MEMBER(k, v);
	}

	auto szPartition = mpd_status_get_partition(pStatus);
	OBJ_MEMBER_IF_NOT_NULL("strPartition", szPartition);

	mpd_status_free(pStatus);
	mpd_connection_free(pConnection);

	args.GetReturnValue().Set(obj);
}
