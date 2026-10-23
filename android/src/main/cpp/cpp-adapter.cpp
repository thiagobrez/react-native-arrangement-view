#include <jni.h>
#include "NitroArrangementViewOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::arrangementview::initialize(vm);
}
