// The list replaces auto-detection, so it names every component the library registers.
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
