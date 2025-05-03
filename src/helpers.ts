import * as path from "@std/path";

export const CACHE_KEY_PREFIX = "vcpkg-";

export const getCacheRestorePath = (vcpkgArchivePath: string, cacheKey: string): string => {
  const abiHash = cacheKey.slice(CACHE_KEY_PREFIX.length);
  const filename = `${abiHash}.zip`;
  const directory = abiHash.slice(0, 2);

  return path.join(vcpkgArchivePath, directory, filename);
};

export const getCacheKey = (filename: string): string => {
  const abiHash = filename.slice(0, filename.length - ".zip".length);

  return `${CACHE_KEY_PREFIX}${abiHash}`;
};
