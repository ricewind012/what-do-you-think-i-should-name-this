#include <unordered_map>

#include "../shared/mpd.h"

#define GO_AWAY_AND_FREE_ME(msg)                                               \
	ThrowException(pIsolate, msg);                                               \
	mpd_settings_free(pSettings);                                                \
	mpd_connection_free(pConnection);                                            \
	return

#define X_NO_ARGS(NAME)                                                        \
	void send_to_mpd_##NAME(const FunctionCallbackInfo<Value>& args)             \
	{                                                                            \
		auto pIsolate = args.GetIsolate();                                         \
                                                                               \
		auto pConnection = GetMPDConnection();                                     \
		if (!pConnection)                                                          \
			return;                                                                  \
                                                                               \
		auto result = Boolean::New(pIsolate, mpd_run_##NAME(pConnection));         \
                                                                               \
		mpd_connection_free(pConnection);                                          \
		args.GetReturnValue().Set(result);                                         \
	}

#define X_BOOL(NAME)                                                           \
	void send_to_mpd_##NAME(const FunctionCallbackInfo<Value>& args)             \
	{                                                                            \
		auto pIsolate = args.GetIsolate();                                         \
                                                                               \
		if (!args[0]->IsBoolean()) {                                               \
			GO_AWAY("The argument must be a boolean");                               \
		}                                                                          \
                                                                               \
		auto pConnection = GetMPDConnection();                                     \
		if (!pConnection)                                                          \
			return;                                                                  \
                                                                               \
		auto result = Boolean::New(                                                \
			pIsolate, mpd_run_##NAME(pConnection, args[0]->BooleanValue(pIsolate))); \
                                                                               \
		mpd_connection_free(pConnection);                                          \
		args.GetReturnValue().Set(result);                                         \
	}

#define X_NUMBER(NAME, NUMBER_TYPE)                                            \
	void send_to_mpd_##NAME(const FunctionCallbackInfo<Value>& args)             \
	{                                                                            \
		auto pIsolate = args.GetIsolate();                                         \
		auto context = pIsolate->GetCurrentContext();                              \
                                                                               \
		if (!args[0]->IsNumber()) {                                                \
			GO_AWAY("The argument must be " NUMBER_TYPE);                            \
		}                                                                          \
                                                                               \
		auto pConnection = GetMPDConnection();                                     \
		if (!pConnection)                                                          \
			return;                                                                  \
                                                                               \
		auto result = Boolean::New(                                                \
			pIsolate,                                                                \
			mpd_run_##NAME(pConnection, args[0]->NumberValue(context).FromJust()));  \
                                                                               \
		mpd_connection_free(pConnection);                                          \
		args.GetReturnValue().Set(result);                                         \
	}

X_NO_ARGS(next)
X_NO_ARGS(play)
X_NO_ARGS(previous)
X_NO_ARGS(stop)
X_NO_ARGS(toggle_pause)

X_BOOL(consume)
X_BOOL(pause)
X_BOOL(random)
X_BOOL(repeat)
X_BOOL(single)

// int
X_NUMBER(crossfade, "an integer")
X_NUMBER(play_id, "an integer")
X_NUMBER(play_pos, "an integer")

// float
X_NUMBER(mixrampdelay, "a float")
X_NUMBER(mixrampdb, "a float")

// Special cases
void
send_to_mpd_single_state(const FunctionCallbackInfo<Value>& args)
{
	auto pIsolate = args.GetIsolate();
	auto context = pIsolate->GetCurrentContext();

	if (!args[0]->IsNumber()) {
		GO_AWAY("The argument must be an MPD_SINGLE_STATE member");
	}

	auto pConnection = GetMPDConnection();
	if (!pConnection)
		return;

	auto result = Boolean::New(
		pIsolate,
		mpd_run_single_state(
			pConnection, (mpd_single_state)args[0]->NumberValue(context).FromJust()));

	mpd_connection_free(pConnection);
	args.GetReturnValue().Set(result);
}

void
send_to_mpd_seek(const FunctionCallbackInfo<Value>& args)
{
	auto pIsolate = args.GetIsolate();
	auto context = pIsolate->GetCurrentContext();

	if (!args[0]->IsNumber()) {
		GO_AWAY("The argument must be an integer");
	}

	auto pConnection = GetMPDConnection();
	if (!pConnection)
		return;

	auto result =
		Boolean::New(pIsolate,
								 mpd_run_seek_current(
									 pConnection,
									 (mpd_single_state)args[0]->NumberValue(context).FromJust(),
									 false));

	mpd_connection_free(pConnection);
	args.GetReturnValue().Set(result);
}

Local<Object>
Controls()
{
	auto pIsolate = Isolate::GetCurrent();
	auto context = pIsolate->GetCurrentContext();
	auto obj = Object::New(pIsolate);

	std::unordered_map<const char*, FunctionCallback> mapFunctions = {
		{ "Next", send_to_mpd_next },
		{ "Previous", send_to_mpd_previous },
		{ "Stop", send_to_mpd_stop },
		{ "TogglePause", send_to_mpd_toggle_pause },

		{ "SetConsume", send_to_mpd_consume },
		{ "SetPause", send_to_mpd_pause },
		{ "SetRandom", send_to_mpd_random },
		{ "SetRepeat", send_to_mpd_repeat },
		{ "SetSingle", send_to_mpd_single },

		{ "SetCrossfade", send_to_mpd_crossfade },
		{ "SetPlayID", send_to_mpd_play_id },
		{ "SetPlayPosition", send_to_mpd_play_pos },
		{ "SetSingleState", send_to_mpd_single_state },
		{ "Seek", send_to_mpd_seek },

		{ "SetMixrampDelay", send_to_mpd_mixrampdelay },
		{ "SetMixrampDB", send_to_mpd_mixrampdb },
	};

	for (const auto& [k, v] : mapFunctions) {
		auto tpl = FunctionTemplate::New(pIsolate, v);
		auto fn = tpl->GetFunction(context).ToLocalChecked();

		fn->SetName(TO_STRING("hiii"));
		OBJ_MEMBER(k, fn);
	}

	return obj;
}
