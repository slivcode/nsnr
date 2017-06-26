import SpawnCommandPromise from 'spawn-command-promise';
import { memorizedReadPkgUp } from './memorized-read-pkg-up';
import { writeRecent } from './recent';
import fromPromise from 'err-result-pair/lib/main/fromPromise';

// @internal
export async function executeNpmRunCommand (scriptName, opt) {
  const [err] = await fromPromise(() => SpawnCommandPromise(`npm run ${scriptName}`, opt));
}

export async function getPkgJsonScript () {
  const { path, pkg } = await memorizedReadPkgUp();
  return pkg.scripts || {};
}