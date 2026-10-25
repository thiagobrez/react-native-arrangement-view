export function newestFirst(a: string, b: string) {
  return b.localeCompare(a, undefined, { numeric: true });
}
