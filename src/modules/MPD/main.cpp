#include <mpd/client.h>

#include "Controls.h"
#include "Database.h"
#include "GetCurrentSong.h"
#include "GetServerStatus.h"
#include "GetSettings.h"

#define SET_OBJECT(NAME)                                                       \
	exports->Set(context, TO_STRING(#NAME), NAME()).FromJust()

extern "C" NODE_MODULE_EXPORT void
NODE_MODULE_INITIALIZER(Local<Object> exports, Local<Object> module)
{
	auto pIsolate = exports->GetIsolate();
	auto context = pIsolate->GetCurrentContext();

	SET_OBJECT(Controls);
	SET_OBJECT(Database);
	NODE_SET_METHOD(exports, "GetCurrentSong", GetCurrentSong);
	NODE_SET_METHOD(exports, "GetServerStatus", GetServerStatus);
	NODE_SET_METHOD(exports, "GetSettings", GetSettings);
}
