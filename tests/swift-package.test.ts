import { strict as assert } from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const ios = new URL('../ios/', import.meta.url);
const files = readdirSync(ios);

test('the Swift target of ios/Package.swift lists every Swift file in ios/', () => {
  const manifest = readFileSync(new URL('Package.swift', ios), 'utf8');
  const declared = manifest.match(/let swiftSources = \[([^\]]*)\]/)?.[1];
  assert.ok(declared, 'ios/Package.swift declares swiftSources');
  const listed = [...declared.matchAll(/"([^"]+)"/g)].map((m) => m[1]).sort();
  const swift = files
    .filter((f) => f.endsWith('.swift') && f !== 'Package.swift')
    .sort();
  assert.deepEqual(
    listed,
    swift,
    'SwiftPM cannot build Swift in the Objective-C++ target, so swiftSources must name each Swift file'
  );
});

test("Objective-C++ in ios/ doesn't import the generated Swift header", () => {
  for (const file of files.filter((f) => /\.(h|mm)$/.test(f))) {
    const source = readFileSync(new URL(file, ios), 'utf8');
    assert.doesNotMatch(
      source,
      /-Swift\.h"/,
      `${file} imports the generated Swift header, which SwiftPM doesn't expose to Objective-C++. Declare what it needs in a protocol in ios/include/ instead`
    );
  }
});
