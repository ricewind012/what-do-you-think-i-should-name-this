#include "../shared/mpd.h"

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
	OBJ_MEMBER_NULL("strHost", szHost, TO_STRING);

	auto szPassword = mpd_settings_get_password(pSettings);
	OBJ_MEMBER_NULL("strPassword", szPassword, TO_STRING);

	OBJ_MEMBER("unPort", Number::New(pIsolate, mpd_settings_get_port(pSettings)));
	OBJ_MEMBER("unTimeout",
						 Number::New(pIsolate, mpd_settings_get_timeout_ms(pSettings)));

	mpd_settings_free(pSettings);
	args.GetReturnValue().Set(obj);
}
