#include <node.h>
#include <source_location>
#include <unordered_map>

#define GO_AWAY(MSG)                                                           \
	ThrowException(pIsolate, MSG);                                               \
	return
#define TO_STRING(STR) String::NewFromUtf8(pIsolate, STR).ToLocalChecked()
#define OBJ_MEMBER(K, V) obj->Set(context, TO_STRING(K), V).FromJust()
#define OBJ_MEMBER_NULL(K, V, F)                                               \
	if (V)                                                                       \
		OBJ_MEMBER(K, F(V));                                                       \
	else                                                                         \
		OBJ_MEMBER(K, Null(pIsolate));

using namespace v8;

void
ThrowException(
	Isolate* pIsolate,
	const char* szMessage,
	const std::source_location location = std::source_location::current());

Local<Object>
SetFunctions(std::unordered_map<const char*, FunctionCallback> map);
