import { emoji } from 'node-emoji';
import fromPromise from 'err-result-pair/lib/main/fromPromise';

const { info, log, error } = console;

const bindConsole = (f, ...args) => f.bind(console, ...args);

export const L = {
  info: bindConsole(log, emoji.arrow_forward),
  error: bindConsole(error, emoji.x),
  success: bindConsole(log, emoji.white_check_mark),
  taskSession: (name) => async (f) => {
    const time = Date.now();
    L.info(name);
    const [err] = await fromPromise(() => f());
    if (err) {
      L.error(name);
      throw err;
    }
    L.success(name, `${Date.now() - time}ms`);
  },
};

export const logger = {
  info: L.info,
  error: error.bind(console, emoji.x),
  taskStart: (tag, desc) => console.log(),
  taskEnd: (tag) => '',
  session: (tag, name) => async (f) => {

  },
};