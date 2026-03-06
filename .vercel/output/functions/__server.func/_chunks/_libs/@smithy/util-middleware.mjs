import { S as SMITHY_CONTEXT_KEY } from "./types.mjs";
const getSmithyContext = (context) => context[SMITHY_CONTEXT_KEY] || (context[SMITHY_CONTEXT_KEY] = {});
const normalizeProvider = (input) => {
  if (typeof input === "function")
    return input;
  const promisified = Promise.resolve(input);
  return () => promisified;
};
export {
  getSmithyContext as g,
  normalizeProvider as n
};
