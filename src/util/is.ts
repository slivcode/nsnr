// @internal
const isType = (s: string) => t => typeof t === s;

// @internal
export const is = {
  atStrCmd: t => isType('string')(t) && t.startsWith('@'),
  str: isType('string'),
  fn: isType('function'),
  arr: Array.isArray,
};