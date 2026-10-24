project(NitroArrangementView)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME NitroArrangementView)
set(CMAKE_CXX_STANDARD 20)

add_library(${PACKAGE_NAME} SHARED src/main/cpp/cpp-adapter.cpp)

include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroArrangementView+autolinking.cmake)

find_library(LOG_LIB log)
target_link_libraries(${PACKAGE_NAME} ${LOG_LIB} android)
