import { identity } from 'ramda';
import match from 'ramda-match';
import SpawnCommandPromise from 'spawn-command-promise';
import { Names } from '../constant/names';
import { is } from './is';

// @internal
export function itemToTask (task, opt): Promise<any> {
  const matcher = match([
    // parallel tasks
    [is.arr, (arr) => Promise.all(arr.map(item => itemToTask(item, opt)))],
    // convert to npm run task if eg. @clean
    [is.atStrCmd, (cmd) => SpawnCommandPromise(`${Names.nrCli} ${cmd}`, opt)],
    // run normal command
    [is.str, (cmd) => SpawnCommandPromise(cmd, opt)],
    // run as async function
    [is.fn, (f) => f()],
    // throw error if other types
    [() => true, (t) => {
      throw new Error(`[typeof ${typeof t}]  ${t} is not supported`);
    }],
  ]);
  return matcher(task);
}

const formatName = (tag) => (sub) => `  '${sub}'  [${tag}]`;

// @internal
export const itemToName = match([
  [is.str, formatName('command')],
  [is.atStrCmd, (s) => formatName('command')(`npm run ${s.slice(1)}`)],
  [is.fn, (s) => formatName('function')(`${s.name || '(anonymous)'}`)],
  [is.arr, (s) => {
    return formatName('\nparallel')(`\n${s.map((t, i) => `${i + 1}: ${itemToName(t)}`).join('\n')}`);
  }],
]);