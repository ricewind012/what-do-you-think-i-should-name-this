#include <mpd/client.h>

#include "shared.h"

#define OBJ_MEMBER_IF_NOT_NULL(k, v)                                           \
	if (v)                                                                       \
		OBJ_MEMBER(k, TO_STRING(v));                                               \
	else                                                                         \
		OBJ_MEMBER(k, Null(pIsolate));

Local<Object>
DescribeSong(const mpd_song* pSong, const mpd_status* pStatus);

Local<Object>
DescribeSongMetadata(const mpd_song* pSong);

Local<Object>
DescribeSongTime(const mpd_song* pSong);

Local<Object>
DescribeSongAudioFormat(const mpd_audio_format* pAudioFormat);

mpd_connection*
GetMPDConnection();

mpd_status*
GetMPDStatus(mpd_connection* pConnection);
