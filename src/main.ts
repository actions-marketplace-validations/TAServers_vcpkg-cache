import cache from "@actions/cache";
import core from "@actions/core";
import * as path from "@std/path";
import { CACHE_KEY_PREFIX, getCacheKey, getCacheRestorePath, getExistingCacheEntries } from "./helpers.ts";

const token = core.getInput("token");
const action = Deno.args[0];
const vcpkgArchivePath = path.join("/github/workspace", core.getInput("archive-path"));

if (action == "restore") {
  await core.group("Restoring vcpkg cache", async () => {
    const actionsCaches = await getExistingCacheEntries(token!);

    if (actionsCaches.length < 1) {
      core.info(`No cache entries found with prefix '${CACHE_KEY_PREFIX}'`);
      return;
    }

    await Promise.all(actionsCaches.map(async (cacheKey) => {
      const archivePath = getCacheRestorePath(vcpkgArchivePath, cacheKey);
      core.info(`Restoring '${cacheKey}' to '${archivePath}'`);

      await cache.restoreCache([archivePath], cacheKey);
    }));
  });
} else if (action == "save") {
  await core.group("Saving vcpkg cache", async () => {
    const actionsCaches = new Set(await getExistingCacheEntries(token!));

    try {
      for await (const directory of Deno.readDir(vcpkgArchivePath)) {
        if (!directory.isDirectory) {
          core.warning(`Ignoring file '${directory.name}' in top level of vcpkg archive`);
          continue;
        }

        for await (const file of Deno.readDir(path.join(vcpkgArchivePath, directory.name))) {
          const cacheKey = getCacheKey(file.name);
          const archivePath = path.join(vcpkgArchivePath, directory.name, file.name);

          if (actionsCaches.has(cacheKey)) {
            core.info(`Skipping '${archivePath}' as already present in cache`);
            continue;
          }

          core.info(`Saving '${archivePath}' to '${cacheKey}'`);

          await cache.saveCache([archivePath], getCacheKey(file.name));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      core.error(message);
    }
  });
} else {
  core.setFailed(`Invalid action '${action}'`);
}
