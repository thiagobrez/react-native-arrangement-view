#pragma once

// Replaces the header codegen writes for this library. The app's autolinking.cpp includes it to
// register the component descriptors react-native.config.js lists, two of which are defined here.

#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>

#include "ArrangementShadowNodes.h"

namespace facebook::react {

JSI_EXPORT
std::shared_ptr<TurboModule> RNArrangementViewSpec_ModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params);

} // namespace facebook::react
