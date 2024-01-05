#include <node.h>
#include <source_location>

#define GO_AWAY(MSG)                                                           \
	ThrowException(pIsolate, MSG);                                               \
	return
#define TO_STRING(STR) String::NewFromUtf8(pIsolate, STR).ToLocalChecked()
#define OBJ_MEMBER(K, V) obj->Set(context, TO_STRING(K), V).FromJust()
#define OBJ_MEMBER_IF_NOT_NULL(k, v)                                           \
	if (v)                                                                       \
		OBJ_MEMBER(k, TO_STRING(v));                                               \
	else                                                                         \
		OBJ_MEMBER(k, Null(pIsolate));

using namespace v8;

void
ThrowException(
	Isolate* pIsolate,
	const char* szMessage,
	const std::source_location location = std::source_location::current());
