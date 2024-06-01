#include <mpd/client.h>

#include "../shared/shared.h"

Local<Object>
DescribeSong(const mpd_song* pSong);

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
