import { g as getDefaultExportFromCjs, c as getAugmentedNamespace } from "../react.mjs";
var assert$1 = { exports: {} };
var assertError$1;
var hasRequiredAssertError;
function requireAssertError() {
  if (hasRequiredAssertError) return assertError$1;
  hasRequiredAssertError = 1;
  assertError$1 = class AssertError extends Error {
    name = "AssertError";
    constructor(message, ctor) {
      super(message || "Unknown error");
      if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(this, ctor);
      }
    }
  };
  return assertError$1;
}
var stringify$1;
var hasRequiredStringify;
function requireStringify() {
  if (hasRequiredStringify) return stringify$1;
  hasRequiredStringify = 1;
  stringify$1 = function(...args) {
    try {
      return JSON.stringify(...args);
    } catch (err) {
      return "[Cannot display object: " + err.message + "]";
    }
  };
  return stringify$1;
}
var hasRequiredAssert;
function requireAssert() {
  if (hasRequiredAssert) return assert$1.exports;
  hasRequiredAssert = 1;
  const AssertError = /* @__PURE__ */ requireAssertError();
  const Stringify = /* @__PURE__ */ requireStringify();
  const assert2 = assert$1.exports = function(condition, ...args) {
    if (condition) {
      return;
    }
    if (args.length === 1 && args[0] instanceof Error) {
      throw args[0];
    }
    const msgs = args.filter((arg) => arg !== "").map((arg) => {
      return typeof arg === "string" ? arg : arg instanceof Error ? arg.message : Stringify(arg);
    });
    throw new AssertError(msgs.join(" "), assert2);
  };
  return assert$1.exports;
}
var reach$1;
var hasRequiredReach;
function requireReach() {
  if (hasRequiredReach) return reach$1;
  hasRequiredReach = 1;
  const Assert = /* @__PURE__ */ requireAssert();
  const internals = {};
  reach$1 = function(obj, chain, options) {
    if (chain === false || chain === null || chain === void 0) {
      return obj;
    }
    options = options || {};
    if (typeof options === "string") {
      options = { separator: options };
    }
    const isChainArray = Array.isArray(chain);
    Assert(!isChainArray || !options.separator, "Separator option is not valid for array-based chain");
    const path = isChainArray ? chain : chain.split(options.separator || ".");
    let ref = obj;
    for (let i = 0; i < path.length; ++i) {
      let key = path[i];
      const type = options.iterables && internals.iterables(ref);
      if (Array.isArray(ref) || type === "set") {
        const number = Number(key);
        if (Number.isInteger(number)) {
          key = number < 0 ? ref.length + number : number;
        }
      }
      if (!ref || typeof ref === "function" && options.functions === false || // Defaults to true
      !type && ref[key] === void 0) {
        Assert(!options.strict || i + 1 === path.length, "Missing segment", key, "in reach path ", chain);
        Assert(typeof ref === "object" || options.functions === true || typeof ref !== "function", "Invalid segment", key, "in reach path ", chain);
        ref = options.default;
        break;
      }
      if (!type) {
        ref = ref[key];
      } else if (type === "set") {
        ref = [...ref][key];
      } else {
        ref = ref.get(key);
      }
    }
    return ref;
  };
  internals.iterables = function(ref) {
    if (ref instanceof Set) {
      return "set";
    }
    if (ref instanceof Map) {
      return "map";
    }
  };
  return reach$1;
}
var types = { exports: {} };
var hasRequiredTypes;
function requireTypes() {
  if (hasRequiredTypes) return types.exports;
  hasRequiredTypes = 1;
  (function(module, exports$1) {
    const internals = {};
    exports$1 = module.exports = {
      array: Array.prototype,
      buffer: Buffer && Buffer.prototype,
      // $lab:coverage:ignore$
      date: Date.prototype,
      error: Error.prototype,
      generic: Object.prototype,
      map: Map.prototype,
      promise: Promise.prototype,
      regex: RegExp.prototype,
      set: Set.prototype,
      url: URL.prototype,
      weakMap: WeakMap.prototype,
      weakSet: WeakSet.prototype
    };
    internals.typeMap = /* @__PURE__ */ new Map([
      ["[object Error]", exports$1.error],
      ["[object Map]", exports$1.map],
      ["[object Promise]", exports$1.promise],
      ["[object Set]", exports$1.set],
      ["[object URL]", exports$1.url],
      ["[object WeakMap]", exports$1.weakMap],
      ["[object WeakSet]", exports$1.weakSet]
    ]);
    exports$1.getInternalProto = function(obj) {
      if (Array.isArray(obj)) {
        return exports$1.array;
      }
      if (Buffer && obj instanceof Buffer) {
        return exports$1.buffer;
      }
      if (obj instanceof Date) {
        return exports$1.date;
      }
      if (obj instanceof RegExp) {
        return exports$1.regex;
      }
      if (obj instanceof Error) {
        return exports$1.error;
      }
      const objName = Object.prototype.toString.call(obj);
      return internals.typeMap.get(objName) || exports$1.generic;
    };
  })(types, types.exports);
  return types.exports;
}
var utils = {};
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  utils.keys = function(obj, options = {}) {
    return options.symbols !== false ? Reflect.ownKeys(obj) : Object.getOwnPropertyNames(obj);
  };
  return utils;
}
var clone$1;
var hasRequiredClone;
function requireClone() {
  if (hasRequiredClone) return clone$1;
  hasRequiredClone = 1;
  const Reach = /* @__PURE__ */ requireReach();
  const Types = /* @__PURE__ */ requireTypes();
  const Utils = /* @__PURE__ */ requireUtils();
  const internals = {
    needsProtoHack: /* @__PURE__ */ new Set([Types.set, Types.map, Types.weakSet, Types.weakMap]),
    structuredCloneExists: typeof structuredClone === "function"
  };
  clone$1 = internals.clone = function(obj, options = {}, _seen = null) {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    let clone2 = internals.clone;
    let seen = _seen;
    if (options.shallow) {
      if (options.shallow !== true) {
        return internals.cloneWithShallow(obj, options);
      }
      clone2 = (value) => value;
    } else if (seen) {
      const lookup = seen.get(obj);
      if (lookup) {
        return lookup;
      }
    } else {
      seen = /* @__PURE__ */ new Map();
    }
    const baseProto = Types.getInternalProto(obj);
    switch (baseProto) {
      case Types.buffer:
        return Buffer?.from(obj);
      case Types.date:
        return new Date(obj.getTime());
      case Types.regex:
      case Types.url:
        return new baseProto.constructor(obj);
    }
    const newObj = internals.base(obj, baseProto, options);
    if (newObj === obj) {
      return obj;
    }
    if (seen) {
      seen.set(obj, newObj);
    }
    if (baseProto === Types.set) {
      for (const value of obj) {
        newObj.add(clone2(value, options, seen));
      }
    } else if (baseProto === Types.map) {
      for (const [key, value] of obj) {
        newObj.set(key, clone2(value, options, seen));
      }
    }
    const keys = Utils.keys(obj, options);
    for (const key of keys) {
      if (key === "__proto__") {
        continue;
      }
      if (baseProto === Types.array && key === "length") {
        newObj.length = obj.length;
        continue;
      }
      if (internals.structuredCloneExists && baseProto === Types.error && key === "stack") {
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(obj, key);
      if (descriptor) {
        if (descriptor.get || descriptor.set) {
          Object.defineProperty(newObj, key, descriptor);
        } else if (descriptor.enumerable) {
          newObj[key] = clone2(obj[key], options, seen);
        } else {
          Object.defineProperty(newObj, key, { enumerable: false, writable: true, configurable: true, value: clone2(obj[key], options, seen) });
        }
      } else {
        Object.defineProperty(newObj, key, {
          enumerable: true,
          writable: true,
          configurable: true,
          value: clone2(obj[key], options, seen)
        });
      }
    }
    return newObj;
  };
  internals.cloneWithShallow = function(source, options) {
    const keys = options.shallow;
    options = Object.assign({}, options);
    options.shallow = false;
    const seen = /* @__PURE__ */ new Map();
    for (const key of keys) {
      const ref = Reach(source, key);
      if (typeof ref === "object" || typeof ref === "function") {
        seen.set(ref, ref);
      }
    }
    return internals.clone(source, options, seen);
  };
  internals.base = function(obj, baseProto, options) {
    if (options.prototype === false) {
      if (internals.needsProtoHack.has(baseProto)) {
        return new baseProto.constructor();
      }
      return baseProto === Types.array ? [] : {};
    }
    const proto = Object.getPrototypeOf(obj);
    if (proto && proto.isImmutable) {
      return obj;
    }
    if (baseProto === Types.array) {
      const newObj = [];
      if (proto !== baseProto) {
        Object.setPrototypeOf(newObj, proto);
      }
      return newObj;
    } else if (baseProto === Types.error && internals.structuredCloneExists && (proto === baseProto || Error.isPrototypeOf(proto.constructor))) {
      const err = structuredClone(obj);
      if (Object.getPrototypeOf(err) !== proto) {
        Object.setPrototypeOf(err, proto);
      }
      return err;
    }
    if (internals.needsProtoHack.has(baseProto)) {
      const newObj = new proto.constructor();
      if (proto !== baseProto) {
        Object.setPrototypeOf(newObj, proto);
      }
      return newObj;
    }
    return Object.create(proto);
  };
  return clone$1;
}
var merge$1;
var hasRequiredMerge;
function requireMerge() {
  if (hasRequiredMerge) return merge$1;
  hasRequiredMerge = 1;
  const Assert = /* @__PURE__ */ requireAssert();
  const Clone = /* @__PURE__ */ requireClone();
  const Utils = /* @__PURE__ */ requireUtils();
  const internals = {};
  merge$1 = internals.merge = function(target, source, options) {
    Assert(target && typeof target === "object", "Invalid target value: must be an object");
    Assert(source === null || source === void 0 || typeof source === "object", "Invalid source value: must be null, undefined, or an object");
    if (!source) {
      return target;
    }
    options = Object.assign({ nullOverride: true, mergeArrays: true }, options);
    if (Array.isArray(source)) {
      Assert(Array.isArray(target), "Cannot merge array onto an object");
      if (!options.mergeArrays) {
        target.length = 0;
      }
      for (let i = 0; i < source.length; ++i) {
        target.push(Clone(source[i], { symbols: options.symbols }));
      }
      return target;
    }
    const keys = Utils.keys(source, options);
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (key === "__proto__" || !Object.prototype.propertyIsEnumerable.call(source, key)) {
        continue;
      }
      const value = source[key];
      if (value && typeof value === "object") {
        if (target[key] === value) {
          continue;
        }
        if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key]) !== Array.isArray(value) || value instanceof Date || Buffer && Buffer.isBuffer(value) || // $lab:coverage:ignore$
        value instanceof RegExp) {
          target[key] = Clone(value, { symbols: options.symbols });
        } else {
          internals.merge(target[key], value, options);
        }
      } else {
        if (value !== null && value !== void 0) {
          target[key] = value;
        } else if (options.nullOverride) {
          target[key] = value;
        }
      }
    }
    return target;
  };
  return merge$1;
}
var applyToDefaults$1;
var hasRequiredApplyToDefaults;
function requireApplyToDefaults() {
  if (hasRequiredApplyToDefaults) return applyToDefaults$1;
  hasRequiredApplyToDefaults = 1;
  const Assert = /* @__PURE__ */ requireAssert();
  const Clone = /* @__PURE__ */ requireClone();
  const Merge = /* @__PURE__ */ requireMerge();
  const Reach = /* @__PURE__ */ requireReach();
  const internals = {};
  applyToDefaults$1 = function(defaults, source, options = {}) {
    Assert(defaults && typeof defaults === "object", "Invalid defaults value: must be an object");
    Assert(!source || source === true || typeof source === "object", "Invalid source value: must be true, falsy or an object");
    Assert(typeof options === "object", "Invalid options: must be an object");
    if (!source) {
      return null;
    }
    if (options.shallow) {
      return internals.applyToDefaultsWithShallow(defaults, source, options);
    }
    const copy = Clone(defaults);
    if (source === true) {
      return copy;
    }
    const nullOverride = options.nullOverride !== void 0 ? options.nullOverride : false;
    return Merge(copy, source, { nullOverride, mergeArrays: false });
  };
  internals.applyToDefaultsWithShallow = function(defaults, source, options) {
    const keys = options.shallow;
    Assert(Array.isArray(keys), "Invalid keys");
    const seen = /* @__PURE__ */ new Map();
    const merge2 = source === true ? null : /* @__PURE__ */ new Set();
    for (let key of keys) {
      key = Array.isArray(key) ? key : key.split(".");
      const ref = Reach(defaults, key);
      if (ref && typeof ref === "object") {
        seen.set(ref, merge2 && Reach(source, key) || ref);
      } else if (merge2) {
        merge2.add(key);
      }
    }
    const copy = Clone(defaults, {}, seen);
    if (!merge2) {
      return copy;
    }
    for (const key of merge2) {
      internals.reachCopy(copy, source, key);
    }
    const nullOverride = options.nullOverride !== void 0 ? options.nullOverride : false;
    return Merge(copy, source, { nullOverride, mergeArrays: false });
  };
  internals.reachCopy = function(dst, src, path) {
    for (const segment of path) {
      if (!(segment in src)) {
        return;
      }
      const val = src[segment];
      if (typeof val !== "object" || val === null) {
        return;
      }
      src = val;
    }
    const value = src;
    let ref = dst;
    for (let i = 0; i < path.length - 1; ++i) {
      const segment = path[i];
      if (typeof ref[segment] !== "object") {
        ref[segment] = {};
      }
      ref = ref[segment];
    }
    ref[path[path.length - 1]] = value;
  };
  return applyToDefaults$1;
}
var applyToDefaultsExports = /* @__PURE__ */ requireApplyToDefaults();
const applyToDefaults = /* @__PURE__ */ getDefaultExportFromCjs(applyToDefaultsExports);
var assertExports = /* @__PURE__ */ requireAssert();
const assert = /* @__PURE__ */ getDefaultExportFromCjs(assertExports);
var bench$1;
var hasRequiredBench;
function requireBench() {
  if (hasRequiredBench) return bench$1;
  hasRequiredBench = 1;
  const internals = {};
  bench$1 = internals.Bench = class {
    constructor() {
      this.ts = 0;
      this.reset();
    }
    reset() {
      this.ts = internals.Bench.now();
    }
    elapsed() {
      return internals.Bench.now() - this.ts;
    }
    static now() {
      const ts = process.hrtime();
      return ts[0] * 1e3 + ts[1] / 1e6;
    }
  };
  return bench$1;
}
var benchExports = /* @__PURE__ */ requireBench();
const bench = /* @__PURE__ */ getDefaultExportFromCjs(benchExports);
var ignore$1;
var hasRequiredIgnore;
function requireIgnore() {
  if (hasRequiredIgnore) return ignore$1;
  hasRequiredIgnore = 1;
  ignore$1 = function() {
  };
  return ignore$1;
}
var block$1;
var hasRequiredBlock;
function requireBlock() {
  if (hasRequiredBlock) return block$1;
  hasRequiredBlock = 1;
  const Ignore = /* @__PURE__ */ requireIgnore();
  block$1 = function() {
    return new Promise(Ignore);
  };
  return block$1;
}
var blockExports = /* @__PURE__ */ requireBlock();
const block = /* @__PURE__ */ getDefaultExportFromCjs(blockExports);
var cloneExports = /* @__PURE__ */ requireClone();
const clone = /* @__PURE__ */ getDefaultExportFromCjs(cloneExports);
var deepEqual$1;
var hasRequiredDeepEqual;
function requireDeepEqual() {
  if (hasRequiredDeepEqual) return deepEqual$1;
  hasRequiredDeepEqual = 1;
  const Types = /* @__PURE__ */ requireTypes();
  const internals = {
    mismatched: null
  };
  deepEqual$1 = function(obj, ref, options) {
    options = Object.assign({ prototype: true }, options);
    return !!internals.isDeepEqual(obj, ref, options, []);
  };
  internals.isDeepEqual = function(obj, ref, options, seen) {
    if (obj === ref) {
      return obj !== 0 || 1 / obj === 1 / ref;
    }
    const type = typeof obj;
    if (type !== typeof ref) {
      return false;
    }
    if (obj === null || ref === null) {
      return false;
    }
    if (type === "function") {
      if (!options.deepFunction || obj.toString() !== ref.toString()) {
        return false;
      }
    } else if (type !== "object") {
      return obj !== obj && ref !== ref;
    }
    const instanceType = internals.getSharedType(obj, ref, !!options.prototype);
    switch (instanceType) {
      case Types.buffer:
        return Buffer && Buffer.prototype.equals.call(obj, ref);
      // $lab:coverage:ignore$
      case Types.promise:
        return obj === ref;
      case Types.regex:
      case Types.url:
        return obj.toString() === ref.toString();
      case internals.mismatched:
        return false;
    }
    for (let i = seen.length - 1; i >= 0; --i) {
      if (seen[i].isSame(obj, ref)) {
        return true;
      }
    }
    seen.push(new internals.SeenEntry(obj, ref));
    try {
      return !!internals.isDeepEqualObj(instanceType, obj, ref, options, seen);
    } finally {
      seen.pop();
    }
  };
  internals.getSharedType = function(obj, ref, checkPrototype) {
    if (checkPrototype) {
      if (Object.getPrototypeOf(obj) !== Object.getPrototypeOf(ref)) {
        return internals.mismatched;
      }
      return Types.getInternalProto(obj);
    }
    const type = Types.getInternalProto(obj);
    if (type !== Types.getInternalProto(ref)) {
      return internals.mismatched;
    }
    return type;
  };
  internals.valueOf = function(obj) {
    const objValueOf = obj.valueOf;
    if (objValueOf === void 0) {
      return obj;
    }
    try {
      return objValueOf.call(obj);
    } catch (err) {
      return err;
    }
  };
  internals.hasOwnEnumerableProperty = function(obj, key) {
    return Object.prototype.propertyIsEnumerable.call(obj, key);
  };
  internals.isSetSimpleEqual = function(obj, ref) {
    for (const entry of Set.prototype.values.call(obj)) {
      if (!Set.prototype.has.call(ref, entry)) {
        return false;
      }
    }
    return true;
  };
  internals.isDeepEqualObj = function(instanceType, obj, ref, options, seen) {
    const { isDeepEqual, valueOf, hasOwnEnumerableProperty } = internals;
    const { keys, getOwnPropertySymbols } = Object;
    if (instanceType === Types.array) {
      if (options.part) {
        for (const objValue of obj) {
          for (const refValue of ref) {
            if (isDeepEqual(objValue, refValue, options, seen)) {
              return true;
            }
          }
        }
      } else {
        if (obj.length !== ref.length) {
          return false;
        }
        for (let i = 0; i < obj.length; ++i) {
          if (!isDeepEqual(obj[i], ref[i], options, seen)) {
            return false;
          }
        }
        return true;
      }
    } else if (instanceType === Types.set) {
      if (obj.size !== ref.size) {
        return false;
      }
      if (!internals.isSetSimpleEqual(obj, ref)) {
        const ref2 = new Set(Set.prototype.values.call(ref));
        for (const objEntry of Set.prototype.values.call(obj)) {
          if (ref2.delete(objEntry)) {
            continue;
          }
          let found = false;
          for (const refEntry of ref2) {
            if (isDeepEqual(objEntry, refEntry, options, seen)) {
              ref2.delete(refEntry);
              found = true;
              break;
            }
          }
          if (!found) {
            return false;
          }
        }
      }
    } else if (instanceType === Types.map) {
      if (obj.size !== ref.size) {
        return false;
      }
      for (const [key, value] of Map.prototype.entries.call(obj)) {
        if (value === void 0 && !Map.prototype.has.call(ref, key)) {
          return false;
        }
        if (!isDeepEqual(value, Map.prototype.get.call(ref, key), options, seen)) {
          return false;
        }
      }
    } else if (instanceType === Types.error) {
      if (obj.name !== ref.name || obj.message !== ref.message) {
        return false;
      }
    }
    const valueOfObj = valueOf(obj);
    const valueOfRef = valueOf(ref);
    if ((obj !== valueOfObj || ref !== valueOfRef) && !isDeepEqual(valueOfObj, valueOfRef, options, seen)) {
      return false;
    }
    const objKeys = keys(obj);
    if (!options.part && objKeys.length !== keys(ref).length && !options.skip) {
      return false;
    }
    let skipped = 0;
    for (const key of objKeys) {
      if (options.skip && options.skip.includes(key)) {
        if (ref[key] === void 0) {
          ++skipped;
        }
        continue;
      }
      if (!hasOwnEnumerableProperty(ref, key)) {
        return false;
      }
      if (!isDeepEqual(obj[key], ref[key], options, seen)) {
        return false;
      }
    }
    if (!options.part && objKeys.length - skipped !== keys(ref).length) {
      return false;
    }
    if (options.symbols !== false) {
      const objSymbols = getOwnPropertySymbols(obj);
      const refSymbols = new Set(getOwnPropertySymbols(ref));
      for (const key of objSymbols) {
        if (!options.skip?.includes(key)) {
          if (hasOwnEnumerableProperty(obj, key)) {
            if (!hasOwnEnumerableProperty(ref, key)) {
              return false;
            }
            if (!isDeepEqual(obj[key], ref[key], options, seen)) {
              return false;
            }
          } else if (hasOwnEnumerableProperty(ref, key)) {
            return false;
          }
        }
        refSymbols.delete(key);
      }
      for (const key of refSymbols) {
        if (hasOwnEnumerableProperty(ref, key)) {
          return false;
        }
      }
    }
    return true;
  };
  internals.SeenEntry = class {
    constructor(obj, ref) {
      this.obj = obj;
      this.ref = ref;
    }
    isSame(obj, ref) {
      return this.obj === obj && this.ref === ref;
    }
  };
  return deepEqual$1;
}
var escapeRegex$1;
var hasRequiredEscapeRegex;
function requireEscapeRegex() {
  if (hasRequiredEscapeRegex) return escapeRegex$1;
  hasRequiredEscapeRegex = 1;
  escapeRegex$1 = function(string) {
    return string.replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, "\\$&");
  };
  return escapeRegex$1;
}
var contain$1;
var hasRequiredContain;
function requireContain() {
  if (hasRequiredContain) return contain$1;
  hasRequiredContain = 1;
  const Assert = /* @__PURE__ */ requireAssert();
  const DeepEqual = /* @__PURE__ */ requireDeepEqual();
  const EscapeRegex = /* @__PURE__ */ requireEscapeRegex();
  const Utils = /* @__PURE__ */ requireUtils();
  const internals = {};
  contain$1 = function(ref, values, options = {}) {
    if (typeof values !== "object") {
      values = [values];
    }
    Assert(!Array.isArray(values) || values.length, "Values array cannot be empty");
    if (typeof ref === "string") {
      return internals.string(ref, values, options);
    }
    if (Array.isArray(ref)) {
      return internals.array(ref, values, options);
    }
    Assert(typeof ref === "object", "Reference must be string or an object");
    return internals.object(ref, values, options);
  };
  internals.array = function(ref, values, options) {
    if (!Array.isArray(values)) {
      values = [values];
    }
    if (!ref.length) {
      return false;
    }
    if (options.only && options.once && ref.length !== values.length) {
      return false;
    }
    let compare;
    const map = /* @__PURE__ */ new Map();
    for (const value of values) {
      if (!options.deep || !value || typeof value !== "object") {
        const existing = map.get(value);
        if (existing) {
          ++existing.allowed;
        } else {
          map.set(value, { allowed: 1, hits: 0 });
        }
      } else {
        compare = compare ?? internals.compare(options);
        let found = false;
        for (const [key, existing] of map.entries()) {
          if (compare(key, value)) {
            ++existing.allowed;
            found = true;
            break;
          }
        }
        if (!found) {
          map.set(value, { allowed: 1, hits: 0 });
        }
      }
    }
    let hits = 0;
    for (const item of ref) {
      let match;
      if (!options.deep || !item || typeof item !== "object") {
        match = map.get(item);
      } else {
        compare = compare ?? internals.compare(options);
        for (const [key, existing] of map.entries()) {
          if (compare(key, item)) {
            match = existing;
            break;
          }
        }
      }
      if (match) {
        ++match.hits;
        ++hits;
        if (options.once && match.hits > match.allowed) {
          return false;
        }
      }
    }
    if (options.only && hits !== ref.length) {
      return false;
    }
    for (const match of map.values()) {
      if (match.hits === match.allowed) {
        continue;
      }
      if (match.hits < match.allowed && !options.part) {
        return false;
      }
    }
    return !!hits;
  };
  internals.object = function(ref, values, options) {
    Assert(options.once === void 0, "Cannot use option once with object");
    const keys = Utils.keys(ref, options);
    if (!keys.length) {
      return false;
    }
    if (Array.isArray(values)) {
      return internals.array(keys, values, options);
    }
    const symbols = Object.getOwnPropertySymbols(values).filter((sym) => values.propertyIsEnumerable(sym));
    const targets = [...Object.keys(values), ...symbols];
    const compare = internals.compare(options);
    const set = new Set(targets);
    for (const key of keys) {
      if (!set.has(key)) {
        if (options.only) {
          return false;
        }
        continue;
      }
      if (!compare(values[key], ref[key])) {
        return false;
      }
      set.delete(key);
    }
    if (set.size) {
      return options.part ? set.size < targets.length : false;
    }
    return true;
  };
  internals.string = function(ref, values, options) {
    if (ref === "") {
      return values.length === 1 && values[0] === "" || // '' contains ''
      !options.once && !values.some((v) => v !== "");
    }
    const map = /* @__PURE__ */ new Map();
    const patterns = [];
    for (const value of values) {
      Assert(typeof value === "string", "Cannot compare string reference to non-string value");
      if (value) {
        const existing = map.get(value);
        if (existing) {
          ++existing.allowed;
        } else {
          map.set(value, { allowed: 1, hits: 0 });
          patterns.push(EscapeRegex(value));
        }
      } else if (options.once || options.only) {
        return false;
      }
    }
    if (!patterns.length) {
      return true;
    }
    const regex = new RegExp(`(${patterns.join("|")})`, "g");
    const leftovers = ref.replace(regex, ($0, $1) => {
      ++map.get($1).hits;
      return "";
    });
    if (options.only && leftovers) {
      return false;
    }
    let any = false;
    for (const match of map.values()) {
      if (match.hits) {
        any = true;
      }
      if (match.hits === match.allowed) {
        continue;
      }
      if (match.hits < match.allowed && !options.part) {
        return false;
      }
      if (options.once) {
        return false;
      }
    }
    return !!any;
  };
  internals.compare = function(options) {
    if (!options.deep) {
      return internals.shallow;
    }
    const hasOnly = options.only !== void 0;
    const hasPart = options.part !== void 0;
    const flags = {
      prototype: hasOnly ? options.only : hasPart ? !options.part : false,
      part: hasOnly ? !options.only : hasPart ? options.part : false
    };
    return (a, b) => DeepEqual(a, b, flags);
  };
  internals.shallow = function(a, b) {
    return a === b;
  };
  return contain$1;
}
var containExports = /* @__PURE__ */ requireContain();
const contain = /* @__PURE__ */ getDefaultExportFromCjs(containExports);
var deepEqualExports = /* @__PURE__ */ requireDeepEqual();
const deepEqual = /* @__PURE__ */ getDefaultExportFromCjs(deepEqualExports);
var assertErrorExports = /* @__PURE__ */ requireAssertError();
const assertError = /* @__PURE__ */ getDefaultExportFromCjs(assertErrorExports);
var escapeHeaderAttribute$1;
var hasRequiredEscapeHeaderAttribute;
function requireEscapeHeaderAttribute() {
  if (hasRequiredEscapeHeaderAttribute) return escapeHeaderAttribute$1;
  hasRequiredEscapeHeaderAttribute = 1;
  const Assert = /* @__PURE__ */ requireAssert();
  escapeHeaderAttribute$1 = function(attribute) {
    Assert(/^[ \w\!#\$%&'\(\)\*\+,\-\.\/\:;<\=>\?@\[\]\^`\{\|\}~\"\\]*$/.test(attribute), "Bad attribute value (" + attribute + ")");
    return attribute.replace(/\\/g, "\\\\").replace(/\"/g, '\\"');
  };
  return escapeHeaderAttribute$1;
}
var escapeHeaderAttributeExports = /* @__PURE__ */ requireEscapeHeaderAttribute();
const escapeHeaderAttribute = /* @__PURE__ */ getDefaultExportFromCjs(escapeHeaderAttributeExports);
var escapeHtml$1;
var hasRequiredEscapeHtml;
function requireEscapeHtml() {
  if (hasRequiredEscapeHtml) return escapeHtml$1;
  hasRequiredEscapeHtml = 1;
  const internals = {};
  escapeHtml$1 = function(input) {
    if (!input) {
      return "";
    }
    let escaped = "";
    for (let i = 0; i < input.length; ++i) {
      const charCode = input.charCodeAt(i);
      if (internals.isSafe(charCode)) {
        escaped += input[i];
      } else {
        escaped += internals.escapeHtmlChar(charCode);
      }
    }
    return escaped;
  };
  internals.escapeHtmlChar = function(charCode) {
    const namedEscape = internals.namedHtml.get(charCode);
    if (namedEscape) {
      return namedEscape;
    }
    if (charCode >= 256) {
      return "&#" + charCode + ";";
    }
    const hexValue = charCode.toString(16).padStart(2, "0");
    return `&#x${hexValue};`;
  };
  internals.isSafe = function(charCode) {
    return internals.safeCharCodes.has(charCode);
  };
  internals.namedHtml = /* @__PURE__ */ new Map([
    [38, "&amp;"],
    [60, "&lt;"],
    [62, "&gt;"],
    [34, "&quot;"],
    [160, "&nbsp;"],
    [162, "&cent;"],
    [163, "&pound;"],
    [164, "&curren;"],
    [169, "&copy;"],
    [174, "&reg;"]
  ]);
  internals.safeCharCodes = (function() {
    const safe = /* @__PURE__ */ new Set();
    for (let i = 32; i < 123; ++i) {
      if (i >= 97 || // a-z
      i >= 65 && i <= 90 || // A-Z
      i >= 48 && i <= 57 || // 0-9
      i === 32 || // space
      i === 46 || // .
      i === 44 || // ,
      i === 45 || // -
      i === 58 || // :
      i === 95) {
        safe.add(i);
      }
    }
    return safe;
  })();
  return escapeHtml$1;
}
var escapeHtmlExports = /* @__PURE__ */ requireEscapeHtml();
const escapeHtml = /* @__PURE__ */ getDefaultExportFromCjs(escapeHtmlExports);
var escapeJson$1;
var hasRequiredEscapeJson;
function requireEscapeJson() {
  if (hasRequiredEscapeJson) return escapeJson$1;
  hasRequiredEscapeJson = 1;
  const internals = {};
  escapeJson$1 = function(input) {
    if (!input) {
      return "";
    }
    return input.replace(/[<>&\u2028\u2029]/g, internals.escape);
  };
  internals.escape = function(char) {
    return internals.replacements.get(char);
  };
  internals.replacements = /* @__PURE__ */ new Map([
    ["<", "\\u003c"],
    [">", "\\u003e"],
    ["&", "\\u0026"],
    ["\u2028", "\\u2028"],
    ["\u2029", "\\u2029"]
  ]);
  return escapeJson$1;
}
var escapeJsonExports = /* @__PURE__ */ requireEscapeJson();
const escapeJson = /* @__PURE__ */ getDefaultExportFromCjs(escapeJsonExports);
var escapeRegexExports = /* @__PURE__ */ requireEscapeRegex();
const escapeRegex = /* @__PURE__ */ getDefaultExportFromCjs(escapeRegexExports);
var flatten$1;
var hasRequiredFlatten;
function requireFlatten() {
  if (hasRequiredFlatten) return flatten$1;
  hasRequiredFlatten = 1;
  const internals = {};
  flatten$1 = internals.flatten = function(array, target) {
    const result = target || [];
    for (const entry of array) {
      if (Array.isArray(entry)) {
        internals.flatten(entry, result);
      } else {
        result.push(entry);
      }
    }
    return result;
  };
  return flatten$1;
}
var flattenExports = /* @__PURE__ */ requireFlatten();
const flatten = /* @__PURE__ */ getDefaultExportFromCjs(flattenExports);
var ignoreExports = /* @__PURE__ */ requireIgnore();
const ignore = /* @__PURE__ */ getDefaultExportFromCjs(ignoreExports);
var intersect$1;
var hasRequiredIntersect;
function requireIntersect() {
  if (hasRequiredIntersect) return intersect$1;
  hasRequiredIntersect = 1;
  const internals = {};
  intersect$1 = function(array1, array2, options = {}) {
    if (!array1 || !array2) {
      return options.first ? null : [];
    }
    const common = [];
    const hash = Array.isArray(array1) ? new Set(array1) : array1;
    const found = /* @__PURE__ */ new Set();
    for (const value of array2) {
      if (internals.has(hash, value) && !found.has(value)) {
        if (options.first) {
          return value;
        }
        common.push(value);
        found.add(value);
      }
    }
    return options.first ? null : common;
  };
  internals.has = function(ref, key) {
    if (typeof ref.has === "function") {
      return ref.has(key);
    }
    return ref[key] !== void 0;
  };
  return intersect$1;
}
var intersectExports = /* @__PURE__ */ requireIntersect();
const intersect = /* @__PURE__ */ getDefaultExportFromCjs(intersectExports);
var isPromise$1;
var hasRequiredIsPromise;
function requireIsPromise() {
  if (hasRequiredIsPromise) return isPromise$1;
  hasRequiredIsPromise = 1;
  isPromise$1 = function(promise) {
    return typeof promise?.then === "function";
  };
  return isPromise$1;
}
var isPromiseExports = /* @__PURE__ */ requireIsPromise();
const isPromise = /* @__PURE__ */ getDefaultExportFromCjs(isPromiseExports);
var mergeExports = /* @__PURE__ */ requireMerge();
const merge = /* @__PURE__ */ getDefaultExportFromCjs(mergeExports);
var once$1;
var hasRequiredOnce;
function requireOnce() {
  if (hasRequiredOnce) return once$1;
  hasRequiredOnce = 1;
  const internals = {
    wrapped: /* @__PURE__ */ Symbol("wrapped")
  };
  once$1 = function(method) {
    if (method[internals.wrapped]) {
      return method;
    }
    let once2 = false;
    const wrappedFn = function(...args) {
      if (!once2) {
        once2 = true;
        method(...args);
      }
    };
    wrappedFn[internals.wrapped] = true;
    return wrappedFn;
  };
  return once$1;
}
var onceExports = /* @__PURE__ */ requireOnce();
const once = /* @__PURE__ */ getDefaultExportFromCjs(onceExports);
var reachExports = /* @__PURE__ */ requireReach();
const reach = /* @__PURE__ */ getDefaultExportFromCjs(reachExports);
var reachTemplate$1;
var hasRequiredReachTemplate;
function requireReachTemplate() {
  if (hasRequiredReachTemplate) return reachTemplate$1;
  hasRequiredReachTemplate = 1;
  const Reach = /* @__PURE__ */ requireReach();
  reachTemplate$1 = function(obj, template, options) {
    return template.replace(/{([^{}]+)}/g, ($0, chain) => {
      const value = Reach(obj, chain, options);
      return value ?? "";
    });
  };
  return reachTemplate$1;
}
var reachTemplateExports = /* @__PURE__ */ requireReachTemplate();
const reachTemplate = /* @__PURE__ */ getDefaultExportFromCjs(reachTemplateExports);
var stringifyExports = /* @__PURE__ */ requireStringify();
const stringify = /* @__PURE__ */ getDefaultExportFromCjs(stringifyExports);
var wait$1;
var hasRequiredWait;
function requireWait() {
  if (hasRequiredWait) return wait$1;
  hasRequiredWait = 1;
  const internals = {
    maxTimer: 2 ** 31 - 1
    // ~25 days
  };
  wait$1 = function(timeout, returnValue, options) {
    if (typeof timeout === "bigint") {
      timeout = Number(timeout);
    }
    if (timeout >= Number.MAX_SAFE_INTEGER) {
      timeout = Infinity;
    }
    if (typeof timeout !== "number" && timeout !== void 0) {
      throw new TypeError("Timeout must be a number or bigint");
    }
    return new Promise((resolve) => {
      const _setTimeout = options ? options.setTimeout : setTimeout;
      const activate = () => {
        const time = Math.min(timeout, internals.maxTimer);
        timeout -= time;
        _setTimeout(() => timeout > 0 ? activate() : resolve(returnValue), time);
      };
      if (timeout !== Infinity) {
        activate();
      }
    });
  };
  return wait$1;
}
var waitExports = /* @__PURE__ */ requireWait();
const wait = /* @__PURE__ */ getDefaultExportFromCjs(waitExports);
const lib = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  AssertError: assertError,
  Bench: bench,
  applyToDefaults,
  assert,
  block,
  clone,
  contain,
  deepEqual,
  escapeHeaderAttribute,
  escapeHtml,
  escapeJson,
  escapeRegex,
  flatten,
  ignore,
  intersect,
  isPromise,
  merge,
  once,
  reach,
  reachTemplate,
  stringify,
  wait
});
const require$$0 = /* @__PURE__ */ getAugmentedNamespace(lib);
export {
  assert as a,
  escapeRegex as e,
  require$$0 as r
};
