// swift-tools-version: 6.0
import PackageDescription

// React Native's autolinking references this package from
// build/generated/autolinking/libs/ArrangementView in the app's ios folder,
// and SwiftPM resolves the paths below from there.
let swiftSources = ["ArrangementHost.swift"]

let package = Package(
  name: "ArrangementView",
  platforms: [.iOS("16.4")],
  products: [
    .library(name: "ArrangementView", targets: ["ArrangementView", "ArrangementViewFabric"]),
  ],
  dependencies: [
    .package(name: "ReactNative", path: "../../../../xcframeworks"),
    .package(name: "React-GeneratedCode", path: "../../../ios"),
  ],
  targets: [
    .target(
      name: "ArrangementView",
      dependencies: ["ArrangementViewFabric"],
      path: ".",
      sources: swiftSources
    ),
    .target(
      name: "ArrangementViewFabric",
      dependencies: [
        .product(name: "ReactHeaders", package: "ReactNative"),
        .product(name: "ReactNativeHeaders", package: "ReactNative"),
        .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
        .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
      ],
      path: ".",
      exclude: swiftSources + ["Package.swift"],
      publicHeadersPath: "include",
      cxxSettings: [
        // React Native's prebuilt frameworks are built with these, and Fabric's
        // C++ types only link against them when the defines match.
        .define("DEBUG", .when(configuration: .debug)),
        .define("NDEBUG", .when(configuration: .release)),
      ]
    ),
  ],
  swiftLanguageModes: [.v5],
  cxxLanguageStandard: .cxx20
)
