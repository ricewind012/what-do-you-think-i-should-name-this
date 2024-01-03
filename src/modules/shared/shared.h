#include <node.h>
#include <source_location>

#define GO_AWAY(msg)                                                           \
	ThrowException(pIsolate, msg);                                               \
	return
#define TO_STRING(str) String::NewFromUtf8(pIsolate, str).ToLocalChecked()
#define OBJ_MEMBER(k, v) obj->Set(context, TO_STRING(k), v).FromJust()

using namespace v8;

void
ThrowException(
	Isolate* pIsolate,
	const char* szMessage,
	const std::source_location location = std::source_location::current());
