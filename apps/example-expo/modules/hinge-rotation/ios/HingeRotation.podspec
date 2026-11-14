Pod::Spec.new do |s|
  s.name           = 'HingeRotation'
  s.version        = '1.0.0'
  s.summary        = 'Lets a phone window rotate once ArrangementView finds a hinge in it.'
  s.author         = ''
  s.homepage       = 'https://github.com/thiagobrez/react-native-arrangement-view'
  s.platforms      = { :ios => '16.4' }
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ArrangementView'
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '*.swift'
end
