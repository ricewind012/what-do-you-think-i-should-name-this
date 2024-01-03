#include <node.h>
#include <source_location>

#include "shared.h"

using namespace v8;

void
ThrowException(Isolate* pIsolate,
							 const char* szMessage,
							 const std::source_location location)
{
	auto szLine = std::to_string(location.line()).c_str();
	auto szFile = location.file_name();

	auto unLength = strlen(szFile) + strlen(szLine) + strlen(szMessage) + 3;
	char szOutput[unLength];

	strcpy(szOutput, szFile);
	strcat(szOutput, ":");
	strcat(szOutput, szLine);
	strcat(szOutput, ": ");
	strcat(szOutput, szMessage);

	pIsolate->ThrowException(Exception::Error(TO_STRING(szOutput)));
}