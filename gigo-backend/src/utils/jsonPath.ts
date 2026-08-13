// Minimal dot-path resolver for admin-configured job source field mappings, e.g.
// "data.results", "company.name", "locations.0.name". Array indices are plain
// numeric path segments.
export function resolvePath(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => (acc === null || acc === undefined ? undefined : acc[key]), obj);
}
