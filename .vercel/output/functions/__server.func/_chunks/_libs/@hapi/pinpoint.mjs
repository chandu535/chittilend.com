var lib = {};
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib;
  hasRequiredLib = 1;
  lib.location = function(depth = 0) {
    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = (ignore, stack) => stack;
    const capture = {};
    Error.captureStackTrace(capture, this);
    const line = capture.stack[depth + 1];
    Error.prepareStackTrace = orig;
    return {
      filename: line.getFileName(),
      line: line.getLineNumber()
    };
  };
  return lib;
}
export {
  requireLib as r
};
