// Android builds the library's own shadow nodes (android/src/main/jni), so autolinking registers
// their component descriptors and compiles that CMakeLists.txt instead of codegen's. The list
// replaces auto-detection, so it names every component the library registers.
module.exports = {
  dependency: {
    platforms: {
      android: {
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
        componentDescriptors: [
          'ArrangementViewComponentDescriptor',
          'ArrangementPaneComponentDescriptor',
          'RNHingeObserverComponentDescriptor',
        ],
      },
    },
  },
};
