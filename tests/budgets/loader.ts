import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const reactNative = new URL('./react-native.ts', import.meta.url).href;
const source = new URL('../../src/', import.meta.url).href;
const mutant =
  process.env.BUDGETS_SRC && pathToFileURL(`${process.env.BUDGETS_SRC}/`).href;

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'react-native')
      return { url: reactNative, shortCircuit: true };
    // Platform files are imported by their full name, so a bare `./hinge`
    // only ever means the shared .ts or .tsx file.
    const extensionless =
      specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier);
    const resolved = extensionless
      ? resolveExtension(specifier, context.parentURL)
      : next(specifier, context);
    if (mutant && resolved.url.startsWith(source))
      return { ...resolved, url: mutant + resolved.url.slice(source.length) };
    return resolved;
  },
  load(url, context, next) {
    if (!url.endsWith('.tsx')) return next(url, context);
    const fileName = fileURLToPath(url);
    const { outputText } = ts.transpileModule(readFileSync(fileName, 'utf8'), {
      fileName,
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ESNext,
        verbatimModuleSyntax: true,
      },
    });
    return { format: 'module', source: outputText, shortCircuit: true };
  },
});

function resolveExtension(specifier: string, parentURL: string | undefined) {
  for (const extension of ['.ts', '.tsx']) {
    const url = new URL(specifier + extension, parentURL);
    if (existsSync(url)) return { url: url.href, shortCircuit: true };
  }
  throw new Error(`Cannot find ${specifier}.ts or .tsx from ${parentURL}`);
}
