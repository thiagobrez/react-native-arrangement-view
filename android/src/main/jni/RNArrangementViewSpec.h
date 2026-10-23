#pragma once

// Replaces the header codegen writes for this library. The app's autolinking.cpp includes it to
// register the component descriptors react-native.config.js lists, two of which are defined here.

#include_next <RNArrangementViewSpec.h>

#include "ArrangementShadowNodes.h"
