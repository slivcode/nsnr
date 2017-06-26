import { statAsync, writeFileAsync, writeJSONAsync } from 'fs-extra-promise';
import { dirname, resolve } from 'path';
import { keys, merge, omit, concat } from 'ramda';
import { Names } from '../constant/names';
import { memorizedReadPkgUp } from './memorized-read-pkg-up';
import { executeNpmRunCommand, getPkgJsonScript } from './npm';
import { itemToTask } from './normalize-task';
import fromTryCatch from 'err-result-pair/lib/main/fromTryCatch';
import fromPromise from 'err-result-pair/lib/main/fromPromise';

class NsJsUtil {
  pkgJson;
  nsJsScripts;
  opt;
  scriptList;
  choices;
  description;

  async init () {
    const { pkg, path } = await memorizedReadPkgUp();
    this.pkgJson = pkg;
    this.opt = { cwd: dirname(path), stdio: 'inherit' };
    const nsJsPath = resolve(dirname(path), Names.nsJsFile);
    const [err, nsJs] = fromTryCatch(() => require(nsJsPath));
    const { description, ...nsJsScripts } = nsJs;
    this.nsJsScripts = nsJsScripts;
    this.description = description;
    this.scriptList = merge(keys(pkg.scripts), keys(nsJsScripts));
    this.choices = this.scriptList.map(k => {
      return { name: `[${k}] ${description[k] || ''}`, value: k };
    });
  }

  async loadNsJs () {

  }

  async readPkg () {

  }

  async runTask (key) {
  }

  async fixPkgJson () {

  }
}

let NsJsUtilInstance = new NsJsUtil();
export default NsJsUtilInstance;

export async function getNsJsPath () {
  const { path } = await memorizedReadPkgUp();
  return resolve(dirname(path), Names.nsJsFile);
}

// @internal
export async function initNsJs () {
  const path = await getNsJsPath();
  const [isNotExist] = await fromPromise(() => statAsync(path) as any);
  if (!isNotExist) {
    return;
  }
  await writeFileAsync(path, 'module.exports = {}');
}

// @internal
export async function getNsJsMap () {
  const path = await getNsJsPath();
  const [err, map] = await fromTryCatch(() => require(path));
  if (err) throw new Error(`${path} does not exist`);
  return map;
}

// @internal
export async function fixPkgScriptsWithNsJs () {
  const { path, pkg } = await memorizedReadPkgUp();
  const nsJsMap = await getNsJsMap();
  pkg.scripts = pkg.scripts || {};
  // remove no longer exist
  keys(pkg.scripts).forEach(k => {
    if (pkg.scripts[k] === Names.nrCli && !nsJsMap[k]) {
      delete pkg.scripts[k];
    }
  });
  // update nsJs
  keys(nsJsMap).forEach(k => {
    if (pkg.scripts[k]) return;
    pkg.scripts[k] = Names.nrCli;
  });
  await writeJSONAsync(path, omit(['_id'], pkg));
}

// @internal
// both ns.js and package.json scripts
export async function listAllScript () {
  const scripts = await getPkgJsonScript();
  const { description, ...nsScripts } = await getNsJsMap();
  return { description, keys: concat(keys(nsScripts), keys(nsScripts)), nsScripts };
}

export async function runTask (key, opt) {
  const nsMap = await getNsJsMap();
  if (nsMap[key]) {
    return await itemToTask(nsMap[key], opt);
  }
  await executeNpmRunCommand(key, opt);
}