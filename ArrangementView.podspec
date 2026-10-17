require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "ArrangementView"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "16.4" }
  s.swift_version = "5.0"
  s.frameworks = "SwiftUI"

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES"
  }
  s.source       = { :git => "https://github.com/thiagobrez/react-native-arrangement-view.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"

  install_modules_dependencies(s)
end
