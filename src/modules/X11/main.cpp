#include <xcb/xcb.h>

#include "../shared/shared.h"

#define GO_AWAY_AND_FREE_ME(RESULT, MSG)                                       \
	args.GetReturnValue().Set(Integer::New(pIsolate, RESULT));                   \
	xcb_disconnect(pConnection);                                                 \
	GO_AWAY(MSG);

void
GetScreenSize(const FunctionCallbackInfo<Value>& args)
{
	auto pIsolate = args.GetIsolate();
	auto context = pIsolate->GetCurrentContext();

	auto pConnection = xcb_connect(nullptr, nullptr);
	auto eConnectionState = xcb_connection_has_error(pConnection);
	if (eConnectionState > 0) {
		GO_AWAY_AND_FREE_ME(eConnectionState, "eConnectionState > 0");
	}

	xcb_generic_error_t* pError;
	auto pScreen = xcb_setup_roots_iterator(xcb_get_setup(pConnection)).data;
	auto cookie = xcb_get_geometry(pConnection, pScreen->root);
	auto pGeometry = xcb_get_geometry_reply(pConnection, cookie, &pError);
	if (pError) {
		GO_AWAY_AND_FREE_ME(pError->error_code, "pError != nullptr");
	}

	auto result = Array::New(pIsolate);
	result->Set(context, 0, Number::New(pIsolate, pGeometry->width)).FromJust();
	result->Set(context, 1, Number::New(pIsolate, pGeometry->height)).FromJust();

	args.GetReturnValue().Set(result);
	free(pGeometry);
	xcb_disconnect(pConnection);
}

extern "C" NODE_MODULE_EXPORT void
NODE_MODULE_INITIALIZER(Local<Object> exports, Local<Object> module)
{
	NODE_SET_METHOD(exports, "GetScreenSize", GetScreenSize);
}
