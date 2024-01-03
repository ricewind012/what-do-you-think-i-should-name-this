#include <mpd/client.h>

#include "mpd.h"
#include "shared.h"

#define GO_AWAY_AND_FREE_ME(msg)                                               \
	ThrowException(pIsolate, msg);                                               \
	mpd_connection_free(pConnection);                                            \
	return nullptr

Local<Object>
DescribeSong(const mpd_song* pSong, const mpd_status* pStatus)
{
	auto pIsolate = Isolate::GetCurrent();
	auto context = pIsolate->GetCurrentContext();
	auto obj = Object::New(pIsolate);

	OBJ_MEMBER("file", TO_STRING(mpd_song_get_uri(pSong)));
	OBJ_MEMBER("metadata", DescribeSongMetadata(pSong));
	OBJ_MEMBER("time", DescribeSongTime(pSong));

	auto pAudioFormat = mpd_song_get_audio_format(pSong);
	if (pAudioFormat)
		OBJ_MEMBER("format", DescribeSongAudioFormat(pAudioFormat));
	else
		OBJ_MEMBER("format", Null(pIsolate));

	return obj;
}

Local<Object>
DescribeSongMetadata(const mpd_song* pSong)
{
	auto pIsolate = Isolate::GetCurrent();
	auto context = pIsolate->GetCurrentContext();
	auto obj = Object::New(pIsolate);

	std::unordered_map<const char*, mpd_tag_type> mapMembers = {
		// clang-format off
		{ "strArtist", MPD_TAG_ARTIST },
		{ "strAlbum", MPD_TAG_ALBUM },
		{ "strAlbumArtist", MPD_TAG_ALBUM_ARTIST },
		{ "strTitle", MPD_TAG_TITLE },
		{ "strTrack", MPD_TAG_TRACK },
		{ "strGenre", MPD_TAG_GENRE },
		{ "strDate", MPD_TAG_DATE },
		{ "strComposer", MPD_TAG_COMPOSER },
		{ "strPerformer", MPD_TAG_PERFORMER },
		{ "strComment", MPD_TAG_COMMENT },
		{ "strDisc", MPD_TAG_DISC },

		// Are any of these useful ?
		/*
		{ "strOriginalDate",	MPD_TAG_ORIGINAL_DATE, },

		{ "strArtistSort",	MPD_TAG_ARTIST_SORT, },
		{ "strAlbumArtistSort",	MPD_TAG_ALBUM_ARTIST_SORT, },
		{ "strAlbumSort",	MPD_TAG_ALBUM_SORT, },
		{ "strComposerSort",	MPD_TAG_COMPOSER_SORT, },
	
		{ "strLabel",	MPD_TAG_LABEL, },
		{ "strGrouping",	MPD_TAG_GROUPING, },
		{ "strWork",	MPD_TAG_WORK, },
		{ "strConductor",	MPD_TAG_CONDUCTOR, },
		{ "strEnsemble",	MPD_TAG_ENSEMBLE, },
		{ "strMovement",	MPD_TAG_MOVEMENT, },
		{ "strMovementNumber",	MPD_TAG_MOVEMENTNUMBER, },
		{ "strLocation",	MPD_TAG_LOCATION, },

		{ "strMusicBrainzArtistID",	MPD_TAG_MUSICBRAINZ_ARTISTID, },
		{ "strMusicBrainzAlbumID",	MPD_TAG_MUSICBRAINZ_ALBUMID, },
		{ "strMusicBrainzAlbumArtistID",	MPD_TAG_MUSICBRAINZ_ALBUMARTISTID, },
		{ "strMusicBrainzTrackID",	MPD_TAG_MUSICBRAINZ_TRACKID, },
		{ "strMusicBrainzReleaseTrackID",	MPD_TAG_MUSICBRAINZ_RELEASETRACKID, },
		{ "strMusicBrainzWorkID",	MPD_TAG_MUSICBRAINZ_WORKID, },
		*/
		// clang-format on
	};

	for (const auto& [k, v] : mapMembers) {
		auto szTag = mpd_song_get_tag(pSong, v, 0);

		OBJ_MEMBER_IF_NOT_NULL(k, szTag);
	}

	return obj;
}

Local<Object>
DescribeSongTime(const mpd_song* pSong)
{
	auto pIsolate = Isolate::GetCurrent();
	auto context = pIsolate->GetCurrentContext();
	auto obj = Object::New(pIsolate);

	std::unordered_map<const char*, unsigned> mapMembers = {
		{ "unTotal", mpd_song_get_duration(pSong) },
	};

	for (const auto& [k, v] : mapMembers) {
		OBJ_MEMBER(k, Integer::New(pIsolate, v));
	}

	return obj;
}

Local<Object>
DescribeSongAudioFormat(const mpd_audio_format* pAudioFormat)
{
	auto pIsolate = Isolate::GetCurrent();
	auto context = pIsolate->GetCurrentContext();
	auto obj = Object::New(pIsolate);

	std::unordered_map<const char*, unsigned> mapMembers = {
		{ "unBits", pAudioFormat->bits },
		{ "unChannels", pAudioFormat->channels },
		{ "unSampleRate", pAudioFormat->sample_rate },
	};

	for (const auto& [k, v] : mapMembers) {
		OBJ_MEMBER(k, Integer::New(pIsolate, v));
	}

	return obj;
}

mpd_connection*
GetMPDConnection()
{
	auto pIsolate = Isolate::GetCurrent();

	auto pConnection = mpd_connection_new(nullptr, 0, 0);
	if (!pConnection) {
		GO_AWAY_AND_FREE_ME("Out of memory");
	}

	if (mpd_connection_get_error(pConnection) != MPD_ERROR_SUCCESS) {
		GO_AWAY_AND_FREE_ME(mpd_connection_get_error_message(pConnection));
	}

	return pConnection;
}

mpd_status*
GetMPDStatus(mpd_connection* pConnection)
{
	auto pIsolate = Isolate::GetCurrent();

	auto pStatus = mpd_run_status(pConnection);
	if (!pStatus) {
		GO_AWAY_AND_FREE_ME(mpd_status_get_error(pStatus));
	}

	auto eState = mpd_status_get_state(pStatus);
	if (eState == MPD_STATE_UNKNOWN) {
		GO_AWAY_AND_FREE_ME("eState == MPD_STATE_UNKNOWN");
	}

	return pStatus;
}
