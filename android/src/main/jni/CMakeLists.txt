# Replaces the CMakeLists.txt codegen writes for this library (see react-native.config.js), so the
# app's native build also compiles the Android shadow nodes and the pane policy in cpp/arrange.h.
cmake_minimum_required(VERSION 3.13)

set(LIB_TARGET react_codegen_RNArrangementViewSpec)
set(LIB_ANDROID_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../..)
set(LIB_CPP_DIR ${LIB_ANDROID_DIR}/../cpp)
set(GENERATED_JNI_DIR ${LIB_ANDROID_DIR}/build/generated/source/codegen/jni)
set(GENERATED_COMPONENTS_DIR ${GENERATED_JNI_DIR}/react/renderer/components/RNArrangementViewSpec)

file(GLOB LIB_SRCS CONFIGURE_DEPENDS
  *.cpp
  ${GENERATED_JNI_DIR}/*.cpp
  ${GENERATED_COMPONENTS_DIR}/*.cpp)

add_library(${LIB_TARGET} OBJECT ${LIB_SRCS})

# This directory comes first, so its RNArrangementViewSpec.h replaces the generated one.
target_include_directories(${LIB_TARGET} PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}
  ${LIB_CPP_DIR}
  ${GENERATED_JNI_DIR}
  ${GENERATED_COMPONENTS_DIR})

target_link_libraries(${LIB_TARGET} fbjni jsi reactnative)
target_compile_reactnative_options(${LIB_TARGET} PRIVATE)
# The frames must be the same bits as on the host, where the tests run cpp/arrange.h.
target_compile_options(${LIB_TARGET} PRIVATE -ffp-contract=off)

# The app's autolinking.cpp includes RNArrangementViewSpec.h to register the component descriptors.
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ${CMAKE_CURRENT_SOURCE_DIR} ${LIB_CPP_DIR})
