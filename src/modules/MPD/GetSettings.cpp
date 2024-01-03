#include <unordered_map>

#include "../shared/mpd.h"

#define GO_AWAY_AND_FREE_ME(msg)                                               \
	ThrowException(pIsolate, msg);                                               \
	mpd_settings_free(pSettings);                                                \
	return

void
GetSettings(const FunctionCallbackInfo<Value>& args)
{
	auto pIsolate = args.GetIsolate();
	auto context = pIsolate->GetCurrentContext();
	auto obj = Object::New(pIsolate);

	auto pSettings = mpd_settings_new(nullptr, 0, 0, nullptr, nullptr);
	if (!pSettings) {
		GO_AWAY("Out of memory");
	}

	auto szHost = mpd_settings_get_host(pSettings);
	OBJ_MEMBER_IF_NOT_NULL("strHost", szHost);

	auto szPassword = mpd_settings_get_password(pSettings);
	OBJ_MEMBER_IF_NOT_NULL("strPassword", szPassword);

	OBJ_MEMBER("unPort", Number::New(pIsolate, mpd_settings_get_port(pSettings)));
	OBJ_MEMBER("unTimeout",
						 Number::New(pIsolate, mpd_settings_get_timeout_ms(pSettings)));

	mpd_settings_free(pSettings);

	args.GetReturnValue().Set(obj);
}