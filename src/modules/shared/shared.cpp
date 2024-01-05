#include <node.h>
#include <source_location>
#include <unordered_map>

#include "shared.h"

using namespace v8;

void
ThrowException(Isolate* pIsolate,
							 const char* szMessage,
							 const std::source_location location)
{
	auto szLine = std::to_string(location.line()).c_str();
	auto szFile = location.file_name();

	auto ulLength = strlen(szFile) + strlen(szLine) + strlen(szMessage) + 3;
	char szOutput[ulLength];

	strcpy(szOutput, szFile);
	strcat(szOutput, ":");
	strcat(szOutput, szLine);
	strcat(szOutput, ": ");
	strcat(szOutput, szMessage);

	pIsolate->ThrowException(Exception::Error(TO_STRING(szOutput)));
}

Local<Object>
SetFunctions(std::unordered_map<const char*, FunctionCallback> map)
{
	auto pIsolate = Isolate::GetCurrent();
	auto context = pIsolate->GetCurrentContext();
	auto obj = Object::New(pIsolate);

	for (const auto& [k, v] : map) {
		auto tpl = FunctionTemplate::New(pIsolate, v);
		auto fn = tpl->GetFunction(context).ToLocalChecked();

		OBJ_MEMBER(k, fn);
	}

	return obj;
}