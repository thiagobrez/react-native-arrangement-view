import fs from 'node:fs';
import path from 'node:path';
import { newestFirst } from './versions.ts';

type MetaEntry = string | { type?: string; name?: string };

const root = path.join(import.meta.dirname, 'docs');

function sidebarPages(dir: string): string[] {
  const meta: MetaEntry[] = JSON.parse(
    fs.readFileSync(path.join(dir, '_meta.json'), 'utf8')
  );
  return meta.flatMap((entry) => {
    const name = typeof entry === 'string' ? entry : entry.name;
    if (name === undefined) return [];
    if (fs.existsSync(path.join(dir, name, '_meta.json'))) {
      return sidebarPages(path.join(dir, name)).map((page) =>
        path.join(name, page)
      );
    }
    const file = [`${name}.mdx`, `${name}.md`].find((candidate) =>
      fs.existsSync(path.join(dir, candidate))
    );
    if (file === undefined) {
      throw new Error(`${dir}/_meta.json lists ${name}, which has no page`);
    }
    return [file];
  });
}

const [latest] = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort(newestFirst);
const folder = path.join(root, latest!);
const order = ['index.md', ...sidebarPages(folder)];
const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
console.log(
  path.relative(process.cwd(), path.join(folder, order[day % order.length]!))
);
