import fromPromise from 'err-result-pair/lib/main/fromPromise';
import fromTryCatch from 'err-result-pair/lib/main/fromTryCatch';
import { mkdirpAsync, readJSONAsync, writeFileAsync, writeJSONAsync } from 'fs-extra-promise';
import { tmpdir } from 'os';
import { dirname, resolve } from 'path';
import { assoc, keys, omit, uniq } from 'ramda';
import match from 'ramda-match';
import overPath from 'ramda-over-path';
import * as readPkgUp from 'read-pkg-up';
import { Names } from '../constant/names';
import { is } from '../util/is';
import { L } from '../util/logger';
import { itemToName, itemToTask } from '../util/normalize-task';
import { executeNpmRunCommand } from '../util/npm';
import { of } from '../util/of';

class NsJsTool_ {
  pkg: Object;
  description;
  spawnOpt: { cwd, stdio };
  paths: {
    root,
    pkgJson,
    nsJs,
    recentJson,
  };
  scripts: {
    pkg,
    nsJs,
  };
  recents;
  choices: { name?: string, value: string }[];

  async init () {
    const [noPkgJsoNErr, { pkg, path }] = await fromPromise<{ pkg, path }>(() => readPkgUp());
    if (noPkgJsoNErr) {
      L.error(`cannot find package.json with respect to ${process.cwd()}`, `\nrun npm init on project root.`);
      throw noPkgJsoNErr;
    }

    this.pkg = omit(['_id'], pkg);
    const root = dirname(path);
    this.paths = {
      root,
      pkgJson: path,
      nsJs: resolve(root, Names.nsJsFile),
      recentJson: resolve(tmpdir(), `nsnr`, 'recent.json'),
    };
    this.spawnOpt = { cwd: this.paths.root, stdio: 'inherit' };
    const [err, nsJs] = fromTryCatch(() => require(this.paths.nsJs));
    const { description = {}, ...nsJsScripts } = nsJs || {} as any;
    this.scripts = {
      pkg: pkg.scripts || {},
      nsJs: nsJsScripts || {},
    };
    this.description = description;
    const formatChoices = (k, desc?) => desc ? `${k}: ${desc}` : k;
    this.choices = uniq([...keys(this.scripts.pkg), ...(keys(this.scripts.nsJs))])
      .map(k => {
        const desc = this.description[k];
        return { name: formatChoices(k, desc), value: k };
      });
    this.description = description;
  }

  async initNsJs () {
    await writeFileAsync(this.paths.nsJs, `module.exports = {};`);
  }

  async fixPkgJson (target: boolean | string) {
    if (is.str(target) && !NsJsTool.scripts[target as string]) return;
    const { nsJs, pkg } = this.scripts;
    const nsJsKeys = keys(nsJs);
    const nextPkgJson = overPath(['scripts'], (scripts) => {
      keys(scripts).forEach(k => {
        if (scripts[k] === Names.nrCli && !nsJs[k]) {
          delete scripts[k];
        }
      });
      keys(nsJs).forEach(k => {
        if (!scripts[k]) scripts[k] = Names.nrCli;
      });
      return scripts;
    }, this.pkg);
    await writeJSONAsync(this.paths.pkgJson, nextPkgJson);
  }

  async executeCommand (key: string) {
    const { nsJs, pkg } = this.scripts;
    const target = nsJs[key];
    match([
      [
        () => !target && !pkg[key],
        () => {
          L.error(`task [${key}] does not exist on ${Names.nsJsFile} and package.json's scripts`);
        },
      ],
    ]);

    await L.taskSession(key)(async () => {
      await match<any>([
        // normal npm run script in package.json
        [
          () => !target && pkg[key],
          async () => await executeNpmRunCommand(key, this.spawnOpt),
        ],
        // through ns.js
        [
          () => target,
          async () => {
            for (const item of of(target)) {
              await L.taskSession(itemToName(item))(
                () => itemToTask(item, this.spawnOpt),
              );
            }
          },
        ],
      ])(null);
    });

  }

  async getRecent () {
    const [err, recentJson] = await fromPromise<any>(() => readJSONAsync(this.paths.recentJson) as any);
    if (err) {
      await fromPromise(() => mkdirpAsync(dirname(this.paths.recentJson)) as any);
    }
    this.recents = recentJson || {};
    return this.recents[this.paths.root];
  }

  async setRecent (target: string) {
    const nextRecent = assoc(this.paths.root, target, this.recents);
    await writeJSONAsync(this.paths.recentJson, nextRecent);
  }
}

const NsJsTool = new NsJsTool_;

export default NsJsTool;