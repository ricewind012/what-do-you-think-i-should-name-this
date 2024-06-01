#include <mpd/client.h>

#include "controls.h"
#include "current_song.h"
#include "db.h"
#include "server_status.h"
#include "settings.h"

#define SET_OBJECT(NAME)                                                       \
	exports->Set(context, TO_STRING(#NAME), NAME()).FromJust()

NODE_MODULE_INIT()
{
	auto pIsolate = exports->GetIsolate();

	SET_OBJECT(Controls);
	SET_OBJECT(Database);
	NODE_SET_METHOD(exports, "GetCurrentSong", GetCurrentSong);
	NODE_SET_METHOD(exports, "GetServerStatus", GetServerStatus);
	NODE_SET_METHOD(exports, "GetSettings", GetSettings);
}
