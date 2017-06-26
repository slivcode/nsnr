import fromPromise from 'err-result-pair/lib/main/fromPromise';

import { mkdirpAsync, readJSONAsync, writeJSONAsync } from 'fs-extra-promise';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { assoc } from 'ramda';

const lastScriptUsedFolder = resolve(tmpdir(), 'nsnr');
const recentJsonPath = resolve(lastScriptUsedFolder, 'recent.json');

// @internal
export async function getRecent (key: string) {
  let [readRecentFileErr, recent] = await fromPromise<any>(
    () => readJSONAsync(recentJsonPath) as any,
  );
  if (readRecentFileErr) {
    await mkdirpAsync(lastScriptUsedFolder);
    return null;
  }
  return recent[key];
}

// @internal
export async function writeRecent (key: string, value: string) {
  let [readRecentFileErr, recent] = await fromPromise<any>(
    () => readJSONAsync(recentJsonPath) as any,
  );
  await writeJSONAsync(recentJsonPath, assoc(key, value, recent));
}