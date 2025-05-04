import cache from "@actions/cache";
import core from "@actions/core";
import github from "@actions/github";
import * as path from "@std/path";
import { CACHE_KEY_PREFIX, getCacheKey, getCacheRestorePath } from "./helpers.ts";

const token = core.getInput("token");
const action = core.getInput("action");
const vcpkgArchivePath = path.join("/github/workspace", core.getInput("archive-path"));

if (action == "restore") {
  await core.group("Restoring vcpkg cache", async () => {
    const octokit = github.getOctokit(token!);

    const { data: { actions_caches: actionsCaches } } = await octokit.rest.actions.getActionsCacheList(
      {
        owner: "TAServers",
        repo: "TASBox",
        key: CACHE_KEY_PREFIX,
        per_page: 100, // TODO: Handle pagination
      },
    );

    await Promise.all(actionsCaches.map(async (cacheEntry) => {
      const cacheKey = cacheEntry.key!;
      const archivePath = getCacheRestorePath(vcpkgArchivePath, cacheEntry.key!);
      core.info(`Restoring '${cacheKey}' to '${archivePath}'`);

      await cache.restoreCache([archivePath], cacheEntry.key!);
    }));
  });
} else if (action == "save") {
  await core.group("Saving vcpkg cache", async () => {
    for await (const directory of Deno.readDir(vcpkgArchivePath)) {
      if (!directory.isDirectory) {
        core.warning(`Ignoring file '${directory.name}' in top level of vcpkg archive`);
        continue;
      }

      for await (const file of Deno.readDir(path.join(vcpkgArchivePath, directory.name))) {
        const cacheKey = getCacheKey(file.name);
        const archivePath = path.join(vcpkgArchivePath, directory.name, file.name);
        core.info(`Saving '${archivePath}' to '${cacheKey}'`);

        await cache.saveCache([archivePath], getCacheKey(file.name));
      }
    }
  });
} else {
  core.setFailed(`Invalid action '${action}'`);
}
