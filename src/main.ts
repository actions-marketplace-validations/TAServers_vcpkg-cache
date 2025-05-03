import cache from "@actions/cache";
import core from "@actions/core";
import github from "@actions/github";
import * as path from "@std/path";
import { CACHE_KEY_PREFIX, getCacheKey, getCacheRestorePath } from "./helpers.ts";

const token = core.getInput("token");
const action = core.getInput("action");
const vcpkgArchivePath = "/github/workspace/.cache/vcpkg/archives";

if (action == "restore") {
  core.info("Restoring vcpkg cache");
  const octokit = github.getOctokit(token!);

  const { data: { actions_caches: actionsCaches } } = await octokit.rest.actions.getActionsCacheList(
    {
      owner: "TAServers",
      repo: "TASBox",
      key: CACHE_KEY_PREFIX,
      per_page: 100, // TODO: Handle pagination
    },
  );

  for (const cacheEntry of actionsCaches) {
    await cache.restoreCache([getCacheRestorePath(vcpkgArchivePath, cacheEntry.key!)], cacheEntry.key!);
  }
} else if (action == "save") {
  for await (const directory of Deno.readDir(vcpkgArchivePath)) {
    if (!directory.isDirectory) {
      core.warning(`Ignoring file '${directory.name}' in top level of vcpkg archive`);
      continue;
    }

    for await (const file of Deno.readDir(path.join(vcpkgArchivePath, directory.name))) {
      await cache.saveCache([path.join(vcpkgArchivePath, directory.name, file.name)], getCacheKey(file.name));
    }
  }
} else {
  core.setFailed(`Invalid action ${action}`);
}
