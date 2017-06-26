#!/usr/bin/env node
import readPkgUp = require('read-pkg-up');
import { prompt } from 'inquirer';
import 'optimist';
import { dirname } from 'path';
import match from 'ramda-match';
import { argv } from 'yargs';
import NsJsTool from '../main/NsJsTool';

const npmEvent = process.env['npm_lifecycle_event'];

async function CliNr () {
  const { path, pkg } = await readPkgUp();
  const { scripts = {} } = pkg;
  const spawnOpt = { cwd: dirname(path), stdio: 'inherit' };
  await NsJsTool.init();
  await match([
    // `nr --init`
    [
      () => argv.init,
      async () => await NsJsTool.initNsJs(),
    ],
    // `nr --fix`
    [
      () => argv.fix,
      async () => await NsJsTool.fixPkgJson(true),
    ],
    // `npm run X` and in package.json X: "nr"
    [
      () => npmEvent,
      async () => {
        await NsJsTool.executeCommand(npmEvent);
        await NsJsTool.setRecent(npmEvent);
        await NsJsTool.fixPkgJson(npmEvent);
      },
    ],
    // `nr build ...`
    [
      () => argv._.length > 0,
      async () => {
        for (const script of argv._) {
          await NsJsTool.executeCommand(script);
        }
      },
    ],
    // case `nr`
    [
      () => argv._.length === 0,
      async () => {
        const recent = await NsJsTool.getRecent();
        const { target } = await prompt({
          name: 'target',
          type: 'list',
          message: 'pick a npm/ns.js script to run',
          choices: NsJsTool.choices,
          ...recent && { default: recent },
        });
        await NsJsTool.executeCommand(target);
        await NsJsTool.setRecent(target);
        if (!NsJsTool.scripts[target]) await NsJsTool.fixPkgJson(target);
      },
    ],
  ])(null);
}

CliNr();