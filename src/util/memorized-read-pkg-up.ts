import { memoize } from 'ramda';
import readPkgUp = require('read-pkg-up');

export const memorizedReadPkgUp = memoize(readPkgUp);