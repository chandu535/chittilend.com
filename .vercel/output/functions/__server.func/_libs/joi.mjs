import { g as getDefaultExportFromCjs } from "../_chunks/_libs/react.mjs";
import { r as require$$0 } from "../_chunks/_libs/@hapi/hoek.mjs";
import { r as requireLib$1 } from "../_chunks/_libs/@hapi/formula.mjs";
import { r as requireLib$2 } from "../_chunks/_libs/@hapi/pinpoint.mjs";
import { r as requireLib$3 } from "../_chunks/_libs/@hapi/topo.mjs";
import { r as require$$1$1 } from "../_chunks/_libs/@hapi/address.mjs";
import { r as require$$2 } from "../_chunks/_libs/@hapi/tlds.mjs";
var cache = {};
var common = {};
const version = "18.0.2";
const require$$1 = {
  version
};
var schemas = {};
var hasRequiredSchemas;
function requireSchemas() {
  if (hasRequiredSchemas) return schemas;
  hasRequiredSchemas = 1;
  const Joi2 = /* @__PURE__ */ requireLib();
  const internals = {};
  internals.wrap = Joi2.string().min(1).max(2).allow(false);
  schemas.preferences = Joi2.object({
    allowUnknown: Joi2.boolean(),
    abortEarly: Joi2.boolean(),
    artifacts: Joi2.boolean(),
    cache: Joi2.boolean(),
    context: Joi2.object(),
    convert: Joi2.boolean(),
    dateFormat: Joi2.valid("date", "iso", "string", "time", "utc"),
    debug: Joi2.boolean(),
    errors: {
      escapeHtml: Joi2.boolean(),
      label: Joi2.valid("path", "key", false),
      language: [
        Joi2.string(),
        Joi2.object().ref()
      ],
      render: Joi2.boolean(),
      stack: Joi2.boolean(),
      wrap: {
        label: internals.wrap,
        array: internals.wrap,
        string: internals.wrap
      }
    },
    externals: Joi2.boolean(),
    messages: Joi2.object(),
    noDefaults: Joi2.boolean(),
    nonEnumerables: Joi2.boolean(),
    presence: Joi2.valid("required", "optional", "forbidden"),
    skipFunctions: Joi2.boolean(),
    stripUnknown: Joi2.object({
      arrays: Joi2.boolean(),
      objects: Joi2.boolean()
    }).or("arrays", "objects").allow(true, false),
    warnings: Joi2.boolean()
  }).strict();
  internals.nameRx = /^[a-zA-Z0-9]\w*$/;
  internals.rule = Joi2.object({
    alias: Joi2.array().items(Joi2.string().pattern(internals.nameRx)).single(),
    args: Joi2.array().items(
      Joi2.string(),
      Joi2.object({
        name: Joi2.string().pattern(internals.nameRx).required(),
        ref: Joi2.boolean(),
        assert: Joi2.alternatives([
          Joi2.function(),
          Joi2.object().schema()
        ]).conditional("ref", { is: true, then: Joi2.required() }),
        normalize: Joi2.function(),
        message: Joi2.string().when("assert", { is: Joi2.function(), then: Joi2.required() })
      })
    ),
    convert: Joi2.boolean(),
    manifest: Joi2.boolean(),
    method: Joi2.function().allow(false),
    multi: Joi2.boolean(),
    validate: Joi2.function()
  });
  schemas.extension = Joi2.object({
    type: Joi2.alternatives([
      Joi2.string(),
      Joi2.object().regex()
    ]).required(),
    args: Joi2.function(),
    cast: Joi2.object().pattern(internals.nameRx, Joi2.object({
      from: Joi2.function().maxArity(1).required(),
      to: Joi2.function().minArity(1).maxArity(2).required()
    })),
    base: Joi2.object().schema().when("type", { is: Joi2.object().regex(), then: Joi2.forbidden() }),
    coerce: [
      Joi2.function().maxArity(3),
      Joi2.object({ method: Joi2.function().maxArity(3).required(), from: Joi2.array().items(Joi2.string()).single() })
    ],
    flags: Joi2.object().pattern(internals.nameRx, Joi2.object({
      setter: Joi2.string(),
      default: Joi2.any()
    })),
    manifest: {
      build: Joi2.function().arity(2)
    },
    messages: [Joi2.object(), Joi2.string()],
    modifiers: Joi2.object().pattern(internals.nameRx, Joi2.function().minArity(1).maxArity(2)),
    overrides: Joi2.object().pattern(internals.nameRx, Joi2.function()),
    prepare: Joi2.function().maxArity(3),
    rebuild: Joi2.function().arity(1),
    rules: Joi2.object().pattern(internals.nameRx, internals.rule),
    terms: Joi2.object().pattern(internals.nameRx, Joi2.object({
      init: Joi2.array().allow(null).required(),
      manifest: Joi2.object().pattern(/.+/, [
        Joi2.valid("schema", "single"),
        Joi2.object({
          mapped: Joi2.object({
            from: Joi2.string().required(),
            to: Joi2.string().required()
          }).required()
        })
      ])
    })),
    validate: Joi2.function().maxArity(3)
  }).strict();
  schemas.extensions = Joi2.array().items(Joi2.object(), Joi2.function().arity(1)).strict();
  internals.desc = {
    buffer: Joi2.object({
      buffer: Joi2.string()
    }),
    func: Joi2.object({
      function: Joi2.function().required(),
      options: {
        literal: true
      }
    }),
    override: Joi2.object({
      override: true
    }),
    ref: Joi2.object({
      ref: Joi2.object({
        type: Joi2.valid("value", "global", "local"),
        path: Joi2.array().required(),
        separator: Joi2.string().length(1).allow(false),
        ancestor: Joi2.number().min(0).integer().allow("root"),
        map: Joi2.array().items(Joi2.array().length(2)).min(1),
        adjust: Joi2.function(),
        iterables: Joi2.boolean(),
        in: Joi2.boolean(),
        render: Joi2.boolean()
      }).required()
    }),
    regex: Joi2.object({
      regex: Joi2.string().min(3)
    }),
    special: Joi2.object({
      special: Joi2.valid("deep").required()
    }),
    template: Joi2.object({
      template: Joi2.string().required(),
      options: Joi2.object()
    }),
    value: Joi2.object({
      value: Joi2.alternatives([Joi2.object(), Joi2.array()]).required()
    })
  };
  internals.desc.entity = Joi2.alternatives([
    Joi2.array().items(Joi2.link("...")),
    Joi2.boolean(),
    Joi2.function(),
    Joi2.number(),
    Joi2.string(),
    internals.desc.buffer,
    internals.desc.func,
    internals.desc.ref,
    internals.desc.regex,
    internals.desc.special,
    internals.desc.template,
    internals.desc.value,
    Joi2.link("/")
  ]);
  internals.desc.values = Joi2.array().items(
    null,
    Joi2.boolean(),
    Joi2.function(),
    Joi2.number().allow(Infinity, -Infinity),
    Joi2.string().allow(""),
    Joi2.symbol(),
    internals.desc.buffer,
    internals.desc.func,
    internals.desc.override,
    internals.desc.ref,
    internals.desc.regex,
    internals.desc.template,
    internals.desc.value
  );
  internals.desc.messages = Joi2.object().pattern(/.+/, [
    Joi2.string(),
    internals.desc.template,
    Joi2.object().pattern(/.+/, [Joi2.string(), internals.desc.template])
  ]);
  schemas.description = Joi2.object({
    type: Joi2.string().required(),
    flags: Joi2.object({
      cast: Joi2.string(),
      default: Joi2.any(),
      description: Joi2.string(),
      empty: Joi2.link("/"),
      failover: internals.desc.entity,
      id: Joi2.string(),
      label: Joi2.string(),
      only: true,
      presence: ["optional", "required", "forbidden"],
      result: ["raw", "strip"],
      strip: Joi2.boolean(),
      unit: Joi2.string()
    }).unknown(),
    preferences: {
      allowUnknown: Joi2.boolean(),
      abortEarly: Joi2.boolean(),
      artifacts: Joi2.boolean(),
      cache: Joi2.boolean(),
      convert: Joi2.boolean(),
      dateFormat: ["date", "iso", "string", "time", "utc"],
      errors: {
        escapeHtml: Joi2.boolean(),
        label: ["path", "key"],
        language: [
          Joi2.string(),
          internals.desc.ref
        ],
        wrap: {
          label: internals.wrap,
          array: internals.wrap
        }
      },
      externals: Joi2.boolean(),
      messages: internals.desc.messages,
      noDefaults: Joi2.boolean(),
      nonEnumerables: Joi2.boolean(),
      presence: ["required", "optional", "forbidden"],
      skipFunctions: Joi2.boolean(),
      stripUnknown: Joi2.object({
        arrays: Joi2.boolean(),
        objects: Joi2.boolean()
      }).or("arrays", "objects").allow(true, false),
      warnings: Joi2.boolean()
    },
    allow: internals.desc.values,
    invalid: internals.desc.values,
    rules: Joi2.array().min(1).items({
      name: Joi2.string().required(),
      args: Joi2.object().min(1),
      keep: Joi2.boolean(),
      message: [
        Joi2.string(),
        internals.desc.messages
      ],
      warn: Joi2.boolean()
    }),
    // Terms
    keys: Joi2.object().pattern(/.*/, Joi2.link("/")),
    link: internals.desc.ref
  }).pattern(/^[a-z]\w*$/, Joi2.any());
  return schemas;
}
var messages = {};
var template = { exports: {} };
var errors = {};
var annotate = {};
var hasRequiredAnnotate;
function requireAnnotate() {
  if (hasRequiredAnnotate) return annotate;
  hasRequiredAnnotate = 1;
  const { clone } = require$$0;
  const Common = /* @__PURE__ */ requireCommon();
  const internals = {
    annotations: /* @__PURE__ */ Symbol("annotations")
  };
  annotate.error = function(stripColorCodes) {
    if (!this._original || typeof this._original !== "object") {
      return this.details[0].message;
    }
    const redFgEscape = stripColorCodes ? "" : "\x1B[31m";
    const redBgEscape = stripColorCodes ? "" : "\x1B[41m";
    const endColor = stripColorCodes ? "" : "\x1B[0m";
    const obj = clone(this._original);
    for (let i = this.details.length - 1; i >= 0; --i) {
      const pos = i + 1;
      const error = this.details[i];
      const path = error.path;
      let node = obj;
      for (let j = 0; ; ++j) {
        const seg = path[j];
        if (Common.isSchema(node)) {
          node = node.clone();
        }
        if (j + 1 < path.length && typeof node[seg] !== "string") {
          node = node[seg];
        } else {
          const refAnnotations = node[internals.annotations] || { errors: {}, missing: {} };
          node[internals.annotations] = refAnnotations;
          const cacheKey = seg || error.context.key;
          if (node[seg] !== void 0) {
            refAnnotations.errors[cacheKey] = refAnnotations.errors[cacheKey] || [];
            refAnnotations.errors[cacheKey].push(pos);
          } else {
            refAnnotations.missing[cacheKey] = pos;
          }
          break;
        }
      }
    }
    const replacers = {
      key: /_\$key\$_([, \d]+)_\$end\$_"/g,
      missing: /"_\$miss\$_([^|]+)\|(\d+)_\$end\$_": "__missing__"/g,
      arrayIndex: /\s*"_\$idx\$_([, \d]+)_\$end\$_",?\n(.*)/g,
      specials: /"\[(NaN|Symbol.*|-?Infinity|function.*|\(.*)]"/g
    };
    let message = internals.safeStringify(obj, 2).replace(replacers.key, ($0, $1) => `" ${redFgEscape}[${$1}]${endColor}`).replace(replacers.missing, ($0, $1, $2) => `${redBgEscape}"${$1}"${endColor}${redFgEscape} [${$2}]: -- missing --${endColor}`).replace(replacers.arrayIndex, ($0, $1, $2) => `
${$2} ${redFgEscape}[${$1}]${endColor}`).replace(replacers.specials, ($0, $1) => $1);
    message = `${message}
${redFgEscape}`;
    for (let i = 0; i < this.details.length; ++i) {
      const pos = i + 1;
      message = `${message}
[${pos}] ${this.details[i].message}`;
    }
    message = message + endColor;
    return message;
  };
  internals.safeStringify = function(obj, spaces) {
    return JSON.stringify(obj, internals.serializer(), spaces);
  };
  internals.serializer = function() {
    const keys2 = [];
    const stack = [];
    const cycleReplacer = (key, value) => {
      if (stack[0] === value) {
        return "[Circular ~]";
      }
      return "[Circular ~." + keys2.slice(0, stack.indexOf(value)).join(".") + "]";
    };
    return function(key, value) {
      if (stack.length > 0) {
        const thisPos = stack.indexOf(this);
        if (~thisPos) {
          stack.length = thisPos + 1;
          keys2.length = thisPos + 1;
          keys2[thisPos] = key;
        } else {
          stack.push(this);
          keys2.push(key);
        }
        if (~stack.indexOf(value)) {
          value = cycleReplacer.call(this, key, value);
        }
      } else {
        stack.push(value);
      }
      if (value) {
        const annotations = value[internals.annotations];
        if (annotations) {
          if (Array.isArray(value)) {
            const annotated = [];
            for (let i = 0; i < value.length; ++i) {
              if (annotations.errors[i]) {
                annotated.push(`_$idx$_${annotations.errors[i].sort().join(", ")}_$end$_`);
              }
              annotated.push(value[i]);
            }
            value = annotated;
          } else {
            for (const errorKey in annotations.errors) {
              value[`${errorKey}_$key$_${annotations.errors[errorKey].sort().join(", ")}_$end$_`] = value[errorKey];
              value[errorKey] = void 0;
            }
            for (const missingKey in annotations.missing) {
              value[`_$miss$_${missingKey}|${annotations.missing[missingKey]}_$end$_`] = "__missing__";
            }
          }
          return value;
        }
      }
      if (value === Infinity || value === -Infinity || Number.isNaN(value) || typeof value === "function" || typeof value === "symbol") {
        return "[" + value.toString() + "]";
      }
      return value;
    };
  };
  return annotate;
}
var hasRequiredErrors;
function requireErrors() {
  if (hasRequiredErrors) return errors;
  hasRequiredErrors = 1;
  (function(exports$1) {
    const Annotate = /* @__PURE__ */ requireAnnotate();
    const Common = /* @__PURE__ */ requireCommon();
    const Template = /* @__PURE__ */ requireTemplate();
    exports$1.Report = class {
      constructor(code, value, local, flags, messages2, state2, prefs) {
        this.code = code;
        this.flags = flags;
        this.messages = messages2;
        this.path = state2.path;
        this.prefs = prefs;
        this.state = state2;
        this.value = value;
        this.message = null;
        this.template = null;
        this.local = local || {};
        this.local.label = exports$1.label(this.flags, this.state, this.prefs, this.messages);
        if (this.value !== void 0 && !this.local.hasOwnProperty("value")) {
          this.local.value = this.value;
        }
        if (this.path.length) {
          const key = this.path[this.path.length - 1];
          if (typeof key !== "object") {
            this.local.key = key;
          }
        }
      }
      _setTemplate(template2) {
        this.template = template2;
        if (!this.flags.label && this.path.length === 0) {
          const localized = this._template(this.template, "root");
          if (localized) {
            this.local.label = localized;
          }
        }
      }
      toString() {
        if (this.message) {
          return this.message;
        }
        const code = this.code;
        if (!this.prefs.errors.render) {
          return this.code;
        }
        const template2 = this._template(this.template) || this._template(this.prefs.messages) || this._template(this.messages);
        if (template2 === void 0) {
          return `Error code "${code}" is not defined, your custom type is missing the correct messages definition`;
        }
        this.message = template2.render(this.value, this.state, this.prefs, this.local, { errors: this.prefs.errors, messages: [this.prefs.messages, this.messages] });
        if (!this.prefs.errors.label) {
          this.message = this.message.replace(/^"" /, "").trim();
        }
        return this.message;
      }
      _template(messages2, code) {
        return exports$1.template(this.value, messages2, code || this.code, this.state, this.prefs);
      }
    };
    exports$1.path = function(path) {
      let label = "";
      for (const segment of path) {
        if (typeof segment === "object") {
          continue;
        }
        if (typeof segment === "string") {
          if (label) {
            label += ".";
          }
          label += segment;
        } else {
          label += `[${segment}]`;
        }
      }
      return label;
    };
    exports$1.template = function(value, messages2, code, state2, prefs) {
      if (!messages2) {
        return;
      }
      if (Template.isTemplate(messages2)) {
        return code !== "root" ? messages2 : null;
      }
      let lang = prefs.errors.language;
      if (Common.isResolvable(lang)) {
        lang = lang.resolve(value, state2, prefs);
      }
      if (lang && messages2[lang]) {
        if (messages2[lang][code] !== void 0) {
          return messages2[lang][code];
        }
        if (messages2[lang]["*"] !== void 0) {
          return messages2[lang]["*"];
        }
      }
      if (!messages2[code]) {
        return messages2["*"];
      }
      return messages2[code];
    };
    exports$1.label = function(flags, state2, prefs, messages2) {
      if (!prefs.errors.label) {
        return "";
      }
      if (flags.label) {
        return flags.label;
      }
      let path = state2.path;
      if (prefs.errors.label === "key" && state2.path.length > 1) {
        path = state2.path.slice(-1);
      }
      const normalized = exports$1.path(path);
      if (normalized) {
        return normalized;
      }
      return exports$1.template(null, prefs.messages, "root", state2, prefs) || messages2 && exports$1.template(null, messages2, "root", state2, prefs) || "value";
    };
    exports$1.process = function(errors2, original, prefs) {
      if (!errors2) {
        return null;
      }
      const { override, message, details } = exports$1.details(errors2);
      if (override) {
        return override;
      }
      if (prefs.errors.stack) {
        return new exports$1.ValidationError(message, details, original);
      }
      const limit = Error.stackTraceLimit;
      Error.stackTraceLimit = 0;
      const validationError = new exports$1.ValidationError(message, details, original);
      Error.stackTraceLimit = limit;
      return validationError;
    };
    exports$1.details = function(errors2, options = {}) {
      let messages2 = [];
      const details = [];
      for (const item of errors2) {
        if (item instanceof Error) {
          if (options.override !== false) {
            return { override: item };
          }
          const message2 = item.toString();
          messages2.push(message2);
          details.push({
            message: message2,
            type: "override",
            context: { error: item }
          });
          continue;
        }
        const message = item.toString();
        messages2.push(message);
        details.push({
          message,
          path: item.path.filter((v) => typeof v !== "object"),
          type: item.code,
          context: item.local
        });
      }
      if (messages2.length > 1) {
        messages2 = [...new Set(messages2)];
      }
      return { message: messages2.join(". "), details };
    };
    exports$1.ValidationError = class extends Error {
      constructor(message, details, original) {
        super(message);
        this._original = original;
        this.details = details;
      }
      static isError(err) {
        return err instanceof exports$1.ValidationError;
      }
    };
    exports$1.ValidationError.prototype.isJoi = true;
    exports$1.ValidationError.prototype.name = "ValidationError";
    exports$1.ValidationError.prototype.annotate = Annotate.error;
  })(errors);
  return errors;
}
var ref = {};
var hasRequiredRef;
function requireRef() {
  if (hasRequiredRef) return ref;
  hasRequiredRef = 1;
  (function(exports$1) {
    const { assert, clone, reach } = require$$0;
    const Common = /* @__PURE__ */ requireCommon();
    let Template;
    const internals = {
      symbol: /* @__PURE__ */ Symbol("ref"),
      // Used to internally identify references (shared with other joi versions)
      defaults: {
        adjust: null,
        in: false,
        iterables: null,
        map: null,
        separator: ".",
        type: "value"
      }
    };
    exports$1.create = function(key, options = {}) {
      assert(typeof key === "string", "Invalid reference key:", key);
      Common.assertOptions(options, ["adjust", "ancestor", "in", "iterables", "map", "prefix", "render", "separator"]);
      assert(!options.prefix || typeof options.prefix === "object", "options.prefix must be of type object");
      const ref2 = Object.assign({}, internals.defaults, options);
      delete ref2.prefix;
      const separator = ref2.separator;
      const context = internals.context(key, separator, options.prefix);
      ref2.type = context.type;
      key = context.key;
      if (ref2.type === "value") {
        if (context.root) {
          assert(!separator || key[0] !== separator, "Cannot specify relative path with root prefix");
          ref2.ancestor = "root";
          if (!key) {
            key = null;
          }
        }
        if (separator && separator === key) {
          key = null;
          ref2.ancestor = 0;
        } else {
          if (ref2.ancestor !== void 0) {
            assert(!separator || !key || key[0] !== separator, "Cannot combine prefix with ancestor option");
          } else {
            const [ancestor, slice] = internals.ancestor(key, separator);
            if (slice) {
              key = key.slice(slice);
              if (key === "") {
                key = null;
              }
            }
            ref2.ancestor = ancestor;
          }
        }
      }
      ref2.path = separator ? key === null ? [] : key.split(separator) : [key];
      return new internals.Ref(ref2);
    };
    exports$1.in = function(key, options = {}) {
      return exports$1.create(key, { ...options, in: true });
    };
    exports$1.isRef = function(ref2) {
      return ref2 ? !!ref2[Common.symbols.ref] : false;
    };
    internals.Ref = class {
      constructor(options) {
        assert(typeof options === "object", "Invalid reference construction");
        Common.assertOptions(options, [
          "adjust",
          "ancestor",
          "in",
          "iterables",
          "map",
          "path",
          "render",
          "separator",
          "type",
          // Copied
          "depth",
          "key",
          "root",
          "display"
          // Overridden
        ]);
        assert([false, void 0].includes(options.separator) || typeof options.separator === "string" && options.separator.length === 1, "Invalid separator");
        assert(!options.adjust || typeof options.adjust === "function", "options.adjust must be a function");
        assert(!options.map || Array.isArray(options.map), "options.map must be an array");
        assert(!options.map || !options.adjust, "Cannot set both map and adjust options");
        Object.assign(this, internals.defaults, options);
        assert(this.type === "value" || this.ancestor === void 0, "Non-value references cannot reference ancestors");
        if (Array.isArray(this.map)) {
          this.map = new Map(this.map);
        }
        this.depth = this.path.length;
        this.key = this.path.length ? this.path.join(this.separator) : null;
        this.root = this.path[0];
        this.updateDisplay();
      }
      resolve(value, state2, prefs, local, options = {}) {
        assert(!this.in || options.in, "Invalid in() reference usage");
        if (this.type === "global") {
          return this._resolve(prefs.context, state2, options);
        }
        if (this.type === "local") {
          return this._resolve(local, state2, options);
        }
        if (!this.ancestor) {
          return this._resolve(value, state2, options);
        }
        if (this.ancestor === "root") {
          return this._resolve(state2.ancestors[state2.ancestors.length - 1], state2, options);
        }
        assert(this.ancestor <= state2.ancestors.length, "Invalid reference exceeds the schema root:", this.display);
        return this._resolve(state2.ancestors[this.ancestor - 1], state2, options);
      }
      _resolve(target, state2, options) {
        let resolved;
        if (this.type === "value" && state2.mainstay.shadow && options.shadow !== false) {
          resolved = state2.mainstay.shadow.get(this.absolute(state2));
        }
        if (resolved === void 0) {
          resolved = reach(target, this.path, { iterables: this.iterables, functions: true });
        }
        if (this.adjust) {
          resolved = this.adjust(resolved);
        }
        if (this.map) {
          const mapped = this.map.get(resolved);
          if (mapped !== void 0) {
            resolved = mapped;
          }
        }
        if (state2.mainstay) {
          state2.mainstay.tracer.resolve(state2, this, resolved);
        }
        return resolved;
      }
      toString() {
        return this.display;
      }
      absolute(state2) {
        return [...state2.path.slice(0, -this.ancestor), ...this.path];
      }
      clone() {
        return new internals.Ref(this);
      }
      describe() {
        const ref2 = { path: this.path };
        if (this.type !== "value") {
          ref2.type = this.type;
        }
        if (this.separator !== ".") {
          ref2.separator = this.separator;
        }
        if (this.type === "value" && this.ancestor !== 1) {
          ref2.ancestor = this.ancestor;
        }
        if (this.map) {
          ref2.map = [...this.map];
        }
        for (const key of ["adjust", "iterables", "render"]) {
          if (this[key] !== null && this[key] !== void 0) {
            ref2[key] = this[key];
          }
        }
        if (this.in !== false) {
          ref2.in = true;
        }
        return { ref: ref2 };
      }
      updateDisplay() {
        const key = this.key !== null ? this.key : "";
        if (this.type !== "value") {
          this.display = `ref:${this.type}:${key}`;
          return;
        }
        if (!this.separator) {
          this.display = `ref:${key}`;
          return;
        }
        if (!this.ancestor) {
          this.display = `ref:${this.separator}${key}`;
          return;
        }
        if (this.ancestor === "root") {
          this.display = `ref:root:${key}`;
          return;
        }
        if (this.ancestor === 1) {
          this.display = `ref:${key || ".."}`;
          return;
        }
        const lead = new Array(this.ancestor + 1).fill(this.separator).join("");
        this.display = `ref:${lead}${key || ""}`;
      }
    };
    internals.Ref.prototype[Common.symbols.ref] = true;
    exports$1.build = function(desc) {
      desc = Object.assign({}, internals.defaults, desc);
      if (desc.type === "value" && desc.ancestor === void 0) {
        desc.ancestor = 1;
      }
      return new internals.Ref(desc);
    };
    internals.context = function(key, separator, prefix = {}) {
      key = key.trim();
      if (prefix) {
        const globalp = prefix.global === void 0 ? "$" : prefix.global;
        if (globalp !== separator && key.startsWith(globalp)) {
          return { key: key.slice(globalp.length), type: "global" };
        }
        const local = prefix.local === void 0 ? "#" : prefix.local;
        if (local !== separator && key.startsWith(local)) {
          return { key: key.slice(local.length), type: "local" };
        }
        const root = prefix.root === void 0 ? "/" : prefix.root;
        if (root !== separator && key.startsWith(root)) {
          return { key: key.slice(root.length), type: "value", root: true };
        }
      }
      return { key, type: "value" };
    };
    internals.ancestor = function(key, separator) {
      if (!separator) {
        return [1, 0];
      }
      if (key[0] !== separator) {
        return [1, 0];
      }
      if (key[1] !== separator) {
        return [0, 1];
      }
      let i = 2;
      while (key[i] === separator) {
        ++i;
      }
      return [i - 1, i];
    };
    exports$1.toSibling = 0;
    exports$1.toParent = 1;
    exports$1.Manager = class {
      constructor() {
        this.refs = [];
      }
      register(source, target) {
        if (!source) {
          return;
        }
        target = target === void 0 ? exports$1.toParent : target;
        if (Array.isArray(source)) {
          for (const ref2 of source) {
            this.register(ref2, target);
          }
          return;
        }
        if (Common.isSchema(source)) {
          for (const item of source._refs.refs) {
            if (item.ancestor - target >= 0) {
              this.refs.push({ ancestor: item.ancestor - target, root: item.root });
            }
          }
          return;
        }
        if (exports$1.isRef(source) && source.type === "value" && source.ancestor - target >= 0) {
          this.refs.push({ ancestor: source.ancestor - target, root: source.root });
        }
        Template = Template || /* @__PURE__ */ requireTemplate();
        if (Template.isTemplate(source)) {
          this.register(source.refs(), target);
        }
      }
      get length() {
        return this.refs.length;
      }
      clone() {
        const copy = new exports$1.Manager();
        copy.refs = clone(this.refs);
        return copy;
      }
      reset() {
        this.refs = [];
      }
      roots() {
        return this.refs.filter((ref2) => !ref2.ancestor).map((ref2) => ref2.root);
      }
    };
  })(ref);
  return ref;
}
var hasRequiredTemplate;
function requireTemplate() {
  if (hasRequiredTemplate) return template.exports;
  hasRequiredTemplate = 1;
  (function(module, exports$1) {
    const { assert, clone, escapeHtml } = require$$0;
    const Formula = /* @__PURE__ */ requireLib$1();
    const Common = /* @__PURE__ */ requireCommon();
    const Errors = /* @__PURE__ */ requireErrors();
    const Ref = /* @__PURE__ */ requireRef();
    const internals = {
      symbol: /* @__PURE__ */ Symbol("template"),
      opens: new Array(1e3).join("\0"),
      closes: new Array(1e3).join(""),
      dateFormat: {
        date: Date.prototype.toDateString,
        iso: Date.prototype.toISOString,
        string: Date.prototype.toString,
        time: Date.prototype.toTimeString,
        utc: Date.prototype.toUTCString
      }
    };
    module.exports = internals.Template = class {
      constructor(source, options) {
        assert(typeof source === "string", "Template source must be a string");
        assert(!source.includes("\0") && !source.includes(""), "Template source cannot contain reserved control characters");
        this.source = source;
        this.rendered = source;
        this._template = null;
        if (options) {
          const { functions, ...opts } = options;
          this._settings = Object.keys(opts).length ? clone(opts) : void 0;
          this._functions = functions;
          if (this._functions) {
            assert(Object.keys(this._functions).every((key) => typeof key === "string"), "Functions keys must be strings");
            assert(Object.values(this._functions).every((key) => typeof key === "function"), "Functions values must be functions");
          }
        } else {
          this._settings = void 0;
          this._functions = void 0;
        }
        this._parse();
      }
      _parse() {
        if (!this.source.includes("{")) {
          return;
        }
        const encoded = internals.encode(this.source);
        const parts = internals.split(encoded);
        let refs = false;
        const processed = [];
        const head = parts.shift();
        if (head) {
          processed.push(head);
        }
        for (const part of parts) {
          const raw = part[0] !== "{";
          const ender = raw ? "}" : "}}";
          const end = part.indexOf(ender);
          if (end === -1 || // Ignore non-matching closing
          part[1] === "{") {
            processed.push(`{${internals.decode(part)}`);
            continue;
          }
          let variable = part.slice(raw ? 0 : 1, end);
          const wrapped = variable[0] === ":";
          if (wrapped) {
            variable = variable.slice(1);
          }
          const dynamic = this._ref(internals.decode(variable), { raw, wrapped });
          processed.push(dynamic);
          if (typeof dynamic !== "string") {
            refs = true;
          }
          const rest = part.slice(end + ender.length);
          if (rest) {
            processed.push(internals.decode(rest));
          }
        }
        if (!refs) {
          this.rendered = processed.join("");
          return;
        }
        this._template = processed;
      }
      static date(date2, prefs) {
        return internals.dateFormat[prefs.dateFormat].call(date2);
      }
      describe(options = {}) {
        if (!this._settings && options.compact) {
          return this.source;
        }
        const desc = { template: this.source };
        if (this._settings) {
          desc.options = this._settings;
        }
        if (this._functions) {
          desc.functions = this._functions;
        }
        return desc;
      }
      static build(desc) {
        return new internals.Template(desc.template, desc.options || desc.functions ? { ...desc.options, functions: desc.functions } : void 0);
      }
      isDynamic() {
        return !!this._template;
      }
      static isTemplate(template2) {
        return template2 ? !!template2[Common.symbols.template] : false;
      }
      refs() {
        if (!this._template) {
          return;
        }
        const refs = [];
        for (const part of this._template) {
          if (typeof part !== "string") {
            refs.push(...part.refs);
          }
        }
        return refs;
      }
      resolve(value, state2, prefs, local) {
        if (this._template && this._template.length === 1) {
          return this._part(
            this._template[0],
            /* context -> [*/
            value,
            state2,
            prefs,
            local,
            {}
            /*] */
          );
        }
        return this.render(value, state2, prefs, local);
      }
      _part(part, ...args) {
        if (part.ref) {
          return part.ref.resolve(...args);
        }
        return part.formula.evaluate(args);
      }
      render(value, state2, prefs, local, options = {}) {
        if (!this.isDynamic()) {
          return this.rendered;
        }
        const parts = [];
        for (const part of this._template) {
          if (typeof part === "string") {
            parts.push(part);
          } else {
            const rendered = this._part(
              part,
              /* context -> [*/
              value,
              state2,
              prefs,
              local,
              options
              /*] */
            );
            const string2 = internals.stringify(rendered, value, state2, prefs, local, options);
            if (string2 !== void 0) {
              const result = part.raw || (options.errors && options.errors.escapeHtml) === false ? string2 : escapeHtml(string2);
              parts.push(internals.wrap(result, part.wrapped && prefs.errors.wrap.label));
            }
          }
        }
        return parts.join("");
      }
      _ref(content, { raw, wrapped }) {
        const refs = [];
        const reference = (variable) => {
          const ref2 = Ref.create(variable, this._settings);
          refs.push(ref2);
          return (context) => {
            const resolved = ref2.resolve(...context);
            return resolved !== void 0 ? resolved : null;
          };
        };
        try {
          const functions = this._functions ? { ...internals.functions, ...this._functions } : internals.functions;
          var formula = new Formula.Parser(content, { reference, functions, constants: internals.constants });
        } catch (err) {
          err.message = `Invalid template variable "${content}" fails due to: ${err.message}`;
          throw err;
        }
        if (formula.single) {
          if (formula.single.type === "reference") {
            const ref2 = refs[0];
            return { ref: ref2, raw, refs, wrapped: wrapped || ref2.type === "local" && ref2.key === "label" };
          }
          return internals.stringify(formula.single.value);
        }
        return { formula, raw, refs };
      }
      toString() {
        return this.source;
      }
    };
    internals.Template.prototype[Common.symbols.template] = true;
    internals.Template.prototype.isImmutable = true;
    internals.encode = function(string2) {
      return string2.replace(/\\(\{+)/g, ($0, $1) => {
        return internals.opens.slice(0, $1.length);
      }).replace(/\\(\}+)/g, ($0, $1) => {
        return internals.closes.slice(0, $1.length);
      });
    };
    internals.decode = function(string2) {
      return string2.replace(/\u0000/g, "{").replace(/\u0001/g, "}");
    };
    internals.split = function(string2) {
      const parts = [];
      let current = "";
      for (let i = 0; i < string2.length; ++i) {
        const char = string2[i];
        if (char === "{") {
          let next = "";
          while (i + 1 < string2.length && string2[i + 1] === "{") {
            next += "{";
            ++i;
          }
          parts.push(current);
          current = next;
        } else {
          current += char;
        }
      }
      parts.push(current);
      return parts;
    };
    internals.wrap = function(value, ends) {
      if (!ends) {
        return value;
      }
      if (ends.length === 1) {
        return `${ends}${value}${ends}`;
      }
      return `${ends[0]}${value}${ends[1]}`;
    };
    internals.stringify = function(value, original, state2, prefs, local, options = {}) {
      const type = typeof value;
      const wrap = prefs && prefs.errors && prefs.errors.wrap || {};
      let skipWrap = false;
      if (Ref.isRef(value) && value.render) {
        skipWrap = value.in;
        value = value.resolve(original, state2, prefs, local, { in: value.in, ...options });
      }
      if (value === null) {
        return "null";
      }
      if (type === "string") {
        return internals.wrap(value, options.arrayItems && wrap.string);
      }
      if (type === "number" || type === "function" || type === "symbol") {
        return value.toString();
      }
      if (type !== "object") {
        return JSON.stringify(value);
      }
      if (value instanceof Date) {
        return internals.Template.date(value, prefs);
      }
      if (value instanceof Map) {
        const pairs = [];
        for (const [key, sym] of value.entries()) {
          pairs.push(`${key.toString()} -> ${sym.toString()}`);
        }
        value = pairs;
      }
      if (!Array.isArray(value)) {
        return value.toString();
      }
      const values2 = [];
      for (const item of value) {
        values2.push(internals.stringify(item, original, state2, prefs, local, { arrayItems: true, ...options }));
      }
      return internals.wrap(values2.join(", "), !skipWrap && wrap.array);
    };
    internals.constants = {
      true: true,
      false: false,
      null: null,
      second: 1e3,
      minute: 60 * 1e3,
      hour: 60 * 60 * 1e3,
      day: 24 * 60 * 60 * 1e3
    };
    internals.functions = {
      if(condition, then, otherwise) {
        return condition ? then : otherwise;
      },
      length(item) {
        if (typeof item === "string") {
          return item.length;
        }
        if (!item || typeof item !== "object") {
          return null;
        }
        if (Array.isArray(item)) {
          return item.length;
        }
        return Object.keys(item).length;
      },
      msg(code) {
        const [value, state2, prefs, local, options] = this;
        const messages2 = options.messages;
        if (!messages2) {
          return "";
        }
        const template2 = Errors.template(value, messages2[0], code, state2, prefs) || Errors.template(value, messages2[1], code, state2, prefs);
        if (!template2) {
          return "";
        }
        return template2.render(value, state2, prefs, local, options);
      },
      number(value) {
        if (typeof value === "number") {
          return value;
        }
        if (typeof value === "string") {
          return parseFloat(value);
        }
        if (typeof value === "boolean") {
          return value ? 1 : 0;
        }
        if (value instanceof Date) {
          return value.getTime();
        }
        return null;
      }
    };
  })(template);
  return template.exports;
}
var hasRequiredMessages;
function requireMessages() {
  if (hasRequiredMessages) return messages;
  hasRequiredMessages = 1;
  (function(exports$1) {
    const { assert, clone } = require$$0;
    const Template = /* @__PURE__ */ requireTemplate();
    exports$1.compile = function(messages2, target) {
      if (typeof messages2 === "string") {
        assert(!target, "Cannot set single message string");
        return new Template(messages2);
      }
      if (Template.isTemplate(messages2)) {
        assert(!target, "Cannot set single message template");
        return messages2;
      }
      assert(typeof messages2 === "object" && !Array.isArray(messages2), "Invalid message options");
      target = target ? clone(target) : {};
      for (let code in messages2) {
        const message = messages2[code];
        if (code === "root" || Template.isTemplate(message)) {
          target[code] = message;
          continue;
        }
        if (typeof message === "string") {
          target[code] = new Template(message);
          continue;
        }
        assert(typeof message === "object" && !Array.isArray(message), "Invalid message for", code);
        const language = code;
        target[language] = target[language] || {};
        for (code in message) {
          const localized = message[code];
          if (code === "root" || Template.isTemplate(localized)) {
            target[language][code] = localized;
            continue;
          }
          assert(typeof localized === "string", "Invalid message for", code, "in", language);
          target[language][code] = new Template(localized);
        }
      }
      return target;
    };
    exports$1.decompile = function(messages2) {
      const target = {};
      for (let code in messages2) {
        const message = messages2[code];
        if (code === "root") {
          target.root = message;
          continue;
        }
        if (Template.isTemplate(message)) {
          target[code] = message.describe({ compact: true });
          continue;
        }
        const language = code;
        target[language] = {};
        for (code in message) {
          const localized = message[code];
          if (code === "root") {
            target[language].root = localized;
            continue;
          }
          target[language][code] = localized.describe({ compact: true });
        }
      }
      return target;
    };
    exports$1.merge = function(base2, extended) {
      if (!base2) {
        return exports$1.compile(extended);
      }
      if (!extended) {
        return base2;
      }
      if (typeof extended === "string") {
        return new Template(extended);
      }
      if (Template.isTemplate(extended)) {
        return extended;
      }
      const target = clone(base2);
      for (let code in extended) {
        const message = extended[code];
        if (code === "root" || Template.isTemplate(message)) {
          target[code] = message;
          continue;
        }
        if (typeof message === "string") {
          target[code] = new Template(message);
          continue;
        }
        assert(typeof message === "object" && !Array.isArray(message), "Invalid message for", code);
        const language = code;
        target[language] = target[language] || {};
        for (code in message) {
          const localized = message[code];
          if (code === "root" || Template.isTemplate(localized)) {
            target[language][code] = localized;
            continue;
          }
          assert(typeof localized === "string", "Invalid message for", code, "in", language);
          target[language][code] = new Template(localized);
        }
      }
      return target;
    };
  })(messages);
  return messages;
}
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  (function(exports$1) {
    const { assert: Assert, AssertError } = require$$0;
    const Pkg = require$$1;
    let Messages;
    let Schemas;
    const internals = {
      isoDate: /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/
    };
    exports$1.version = Pkg.version;
    exports$1.defaults = {
      abortEarly: true,
      allowUnknown: false,
      artifacts: false,
      cache: true,
      context: null,
      convert: true,
      dateFormat: "iso",
      errors: {
        escapeHtml: false,
        label: "path",
        language: null,
        render: true,
        stack: false,
        wrap: {
          label: '"',
          array: "[]"
        }
      },
      externals: true,
      messages: {},
      nonEnumerables: false,
      noDefaults: false,
      presence: "optional",
      skipFunctions: false,
      stripUnknown: false,
      warnings: false
    };
    exports$1.symbols = {
      any: /* @__PURE__ */ Symbol.for("@hapi/joi/schema"),
      // Used to internally identify any-based types (shared with other joi versions)
      arraySingle: /* @__PURE__ */ Symbol("arraySingle"),
      deepDefault: /* @__PURE__ */ Symbol("deepDefault"),
      errors: /* @__PURE__ */ Symbol("errors"),
      literal: /* @__PURE__ */ Symbol("literal"),
      override: /* @__PURE__ */ Symbol("override"),
      parent: /* @__PURE__ */ Symbol("parent"),
      prefs: /* @__PURE__ */ Symbol("prefs"),
      ref: /* @__PURE__ */ Symbol("ref"),
      template: /* @__PURE__ */ Symbol("template"),
      values: /* @__PURE__ */ Symbol("values")
    };
    exports$1.assertOptions = function(options, keys2, name = "Options") {
      Assert(options && typeof options === "object" && !Array.isArray(options), "Options must be of type object");
      const unknownKeys = Object.keys(options).filter((k) => !keys2.includes(k));
      Assert(unknownKeys.length === 0, `${name} contain unknown keys: ${unknownKeys}`);
    };
    exports$1.checkPreferences = function(prefs) {
      Schemas = Schemas || /* @__PURE__ */ requireSchemas();
      const result = Schemas.preferences.validate(prefs);
      if (result.error) {
        throw new AssertError([result.error.details[0].message]);
      }
    };
    exports$1.compare = function(a, b, operator) {
      switch (operator) {
        case "=":
          return a === b;
        case ">":
          return a > b;
        case "<":
          return a < b;
        case ">=":
          return a >= b;
        case "<=":
          return a <= b;
      }
    };
    exports$1.default = function(value, defaultValue) {
      return value === void 0 ? defaultValue : value;
    };
    exports$1.isIsoDate = function(date2) {
      return internals.isoDate.test(date2);
    };
    exports$1.isNumber = function(value) {
      return typeof value === "number" && !isNaN(value);
    };
    exports$1.isResolvable = function(obj) {
      if (!obj) {
        return false;
      }
      return obj[exports$1.symbols.ref] || obj[exports$1.symbols.template];
    };
    exports$1.isSchema = function(schema, options = {}) {
      const any2 = schema && schema[exports$1.symbols.any];
      if (!any2) {
        return false;
      }
      Assert(options.legacy || any2.version === exports$1.version, "Cannot mix different versions of joi schemas");
      return true;
    };
    exports$1.isValues = function(obj) {
      return obj[exports$1.symbols.values];
    };
    exports$1.limit = function(value) {
      return Number.isSafeInteger(value) && value >= 0;
    };
    exports$1.preferences = function(target, source) {
      Messages = Messages || /* @__PURE__ */ requireMessages();
      target = target || {};
      source = source || {};
      const merged = Object.assign({}, target, source);
      if (source.errors && target.errors) {
        merged.errors = Object.assign({}, target.errors, source.errors);
        merged.errors.wrap = Object.assign({}, target.errors.wrap, source.errors.wrap);
      }
      if (source.messages) {
        merged.messages = Messages.compile(source.messages, target.messages);
      }
      delete merged[exports$1.symbols.prefs];
      return merged;
    };
    exports$1.tryWithPath = function(fn, key, options = {}) {
      try {
        return fn();
      } catch (err) {
        if (err.path !== void 0) {
          err.path = key + "." + err.path;
        } else {
          err.path = key;
        }
        if (options.append) {
          err.message = `${err.message} (${err.path})`;
        }
        throw err;
      }
    };
    exports$1.validateArg = function(value, label, { assert, message }) {
      if (exports$1.isSchema(assert)) {
        const result = assert.validate(value);
        if (!result.error) {
          return;
        }
        return result.error.message;
      } else if (!assert(value)) {
        return label ? `${label} ${message}` : message;
      }
    };
    exports$1.verifyFlat = function(args, method) {
      for (const arg of args) {
        Assert(!Array.isArray(arg), "Method no longer accepts array arguments:", method);
      }
    };
  })(common);
  return common;
}
var hasRequiredCache;
function requireCache() {
  if (hasRequiredCache) return cache;
  hasRequiredCache = 1;
  const { assert, clone } = require$$0;
  const Common = /* @__PURE__ */ requireCommon();
  const internals = {
    max: 1e3,
    supported: /* @__PURE__ */ new Set(["undefined", "boolean", "number", "string"])
  };
  cache.provider = {
    provision(options) {
      return new internals.Cache(options);
    }
  };
  internals.Cache = class {
    constructor(options = {}) {
      Common.assertOptions(options, ["max"]);
      assert(options.max === void 0 || options.max && options.max > 0 && isFinite(options.max), "Invalid max cache size");
      this._max = options.max || internals.max;
      this._map = /* @__PURE__ */ new Map();
      this._list = new internals.List();
    }
    get length() {
      return this._map.size;
    }
    set(key, value) {
      if (key !== null && !internals.supported.has(typeof key)) {
        return;
      }
      let node = this._map.get(key);
      if (node) {
        node.value = value;
        this._list.first(node);
        return;
      }
      node = this._list.unshift({ key, value });
      this._map.set(key, node);
      this._compact();
    }
    get(key) {
      const node = this._map.get(key);
      if (node) {
        this._list.first(node);
        return clone(node.value);
      }
    }
    _compact() {
      if (this._map.size > this._max) {
        const node = this._list.pop();
        this._map.delete(node.key);
      }
    }
  };
  internals.List = class {
    constructor() {
      this.tail = null;
      this.head = null;
    }
    unshift(node) {
      node.next = null;
      node.prev = this.head;
      if (this.head) {
        this.head.next = node;
      }
      this.head = node;
      if (!this.tail) {
        this.tail = node;
      }
      return node;
    }
    first(node) {
      if (node === this.head) {
        return;
      }
      this._remove(node);
      this.unshift(node);
    }
    pop() {
      return this._remove(this.tail);
    }
    _remove(node) {
      const { next, prev } = node;
      next.prev = prev;
      if (prev) {
        prev.next = next;
      }
      if (node === this.tail) {
        this.tail = next;
      }
      node.prev = null;
      node.next = null;
      return node;
    }
  };
  return cache;
}
var compile = {};
var hasRequiredCompile;
function requireCompile() {
  if (hasRequiredCompile) return compile;
  hasRequiredCompile = 1;
  (function(exports$1) {
    const { assert } = require$$0;
    const Common = /* @__PURE__ */ requireCommon();
    const Ref = /* @__PURE__ */ requireRef();
    const internals = {};
    exports$1.schema = function(Joi2, config, options = {}) {
      Common.assertOptions(options, ["appendPath", "override"]);
      try {
        return internals.schema(Joi2, config, options);
      } catch (err) {
        if (options.appendPath && err.path !== void 0) {
          err.message = `${err.message} (${err.path})`;
        }
        throw err;
      }
    };
    internals.schema = function(Joi2, config, options) {
      assert(config !== void 0, "Invalid undefined schema");
      if (Array.isArray(config)) {
        assert(config.length, "Invalid empty array schema");
        if (config.length === 1) {
          config = config[0];
        }
      }
      const valid = (base2, ...values2) => {
        if (options.override !== false) {
          return base2.valid(Joi2.override, ...values2);
        }
        return base2.valid(...values2);
      };
      if (internals.simple(config)) {
        return valid(Joi2, config);
      }
      if (typeof config === "function") {
        return Joi2.custom(config);
      }
      assert(typeof config === "object", "Invalid schema content:", typeof config);
      if (Common.isResolvable(config)) {
        return valid(Joi2, config);
      }
      if (Common.isSchema(config)) {
        return config;
      }
      if (Array.isArray(config)) {
        for (const item of config) {
          if (!internals.simple(item)) {
            return Joi2.alternatives().try(...config);
          }
        }
        return valid(Joi2, ...config);
      }
      if (config instanceof RegExp) {
        return Joi2.string().regex(config);
      }
      if (config instanceof Date) {
        return valid(Joi2.date(), config);
      }
      assert(Object.getPrototypeOf(config) === Object.getPrototypeOf({}), "Schema can only contain plain objects");
      return Joi2.object().keys(config);
    };
    exports$1.ref = function(id, options) {
      return Ref.isRef(id) ? id : Ref.create(id, options);
    };
    exports$1.compile = function(root, schema, options = {}) {
      Common.assertOptions(options, ["legacy"]);
      const any2 = schema && schema[Common.symbols.any];
      if (any2) {
        assert(options.legacy || any2.version === Common.version, "Cannot mix different versions of joi schemas:", any2.version, Common.version);
        return schema;
      }
      if (typeof schema !== "object" || !options.legacy) {
        return exports$1.schema(root, schema, { appendPath: true });
      }
      const compiler = internals.walk(schema);
      if (!compiler) {
        return exports$1.schema(root, schema, { appendPath: true });
      }
      return compiler.compile(compiler.root, schema);
    };
    internals.walk = function(schema) {
      if (typeof schema !== "object") {
        return null;
      }
      if (Array.isArray(schema)) {
        for (const item of schema) {
          const compiler = internals.walk(item);
          if (compiler) {
            return compiler;
          }
        }
        return null;
      }
      const any2 = schema[Common.symbols.any];
      if (any2) {
        return { root: schema[any2.root], compile: any2.compile };
      }
      assert(Object.getPrototypeOf(schema) === Object.getPrototypeOf({}), "Schema can only contain plain objects");
      for (const key in schema) {
        const compiler = internals.walk(schema[key]);
        if (compiler) {
          return compiler;
        }
      }
      return null;
    };
    internals.simple = function(value) {
      return value === null || ["boolean", "string", "number"].includes(typeof value);
    };
    exports$1.when = function(schema, condition, options) {
      if (options === void 0) {
        assert(condition && typeof condition === "object", "Missing options");
        options = condition;
        condition = Ref.create(".");
      }
      if (Array.isArray(options)) {
        options = { switch: options };
      }
      Common.assertOptions(options, ["is", "not", "then", "otherwise", "switch", "break"]);
      if (Common.isSchema(condition)) {
        assert(options.is === void 0, '"is" can not be used with a schema condition');
        assert(options.not === void 0, '"not" can not be used with a schema condition');
        assert(options.switch === void 0, '"switch" can not be used with a schema condition');
        return internals.condition(schema, { is: condition, then: options.then, otherwise: options.otherwise, break: options.break });
      }
      assert(Ref.isRef(condition) || typeof condition === "string", "Invalid condition:", condition);
      assert(options.not === void 0 || options.is === void 0, 'Cannot combine "is" with "not"');
      if (options.switch === void 0) {
        let rule2 = options;
        if (options.not !== void 0) {
          rule2 = { is: options.not, then: options.otherwise, otherwise: options.then, break: options.break };
        }
        let is = rule2.is !== void 0 ? schema.$_compile(rule2.is) : schema.$_root.invalid(null, false, 0, "").required();
        assert(rule2.then !== void 0 || rule2.otherwise !== void 0, 'options must have at least one of "then", "otherwise", or "switch"');
        assert(rule2.break === void 0 || rule2.then === void 0 || rule2.otherwise === void 0, "Cannot specify then, otherwise, and break all together");
        if (options.is !== void 0 && !Ref.isRef(options.is) && !Common.isSchema(options.is)) {
          is = is.required();
        }
        return internals.condition(schema, { ref: exports$1.ref(condition), is, then: rule2.then, otherwise: rule2.otherwise, break: rule2.break });
      }
      assert(Array.isArray(options.switch), '"switch" must be an array');
      assert(options.is === void 0, 'Cannot combine "switch" with "is"');
      assert(options.not === void 0, 'Cannot combine "switch" with "not"');
      assert(options.then === void 0, 'Cannot combine "switch" with "then"');
      const rule = {
        ref: exports$1.ref(condition),
        switch: [],
        break: options.break
      };
      for (let i = 0; i < options.switch.length; ++i) {
        const test = options.switch[i];
        const last = i === options.switch.length - 1;
        Common.assertOptions(test, last ? ["is", "then", "otherwise"] : ["is", "then"]);
        assert(test.is !== void 0, 'Switch statement missing "is"');
        assert(test.then !== void 0, 'Switch statement missing "then"');
        const item = {
          is: schema.$_compile(test.is),
          then: schema.$_compile(test.then)
        };
        if (!Ref.isRef(test.is) && !Common.isSchema(test.is)) {
          item.is = item.is.required();
        }
        if (last) {
          assert(options.otherwise === void 0 || test.otherwise === void 0, 'Cannot specify "otherwise" inside and outside a "switch"');
          const otherwise = options.otherwise !== void 0 ? options.otherwise : test.otherwise;
          if (otherwise !== void 0) {
            assert(rule.break === void 0, "Cannot specify both otherwise and break");
            item.otherwise = schema.$_compile(otherwise);
          }
        }
        rule.switch.push(item);
      }
      return rule;
    };
    internals.condition = function(schema, condition) {
      for (const key of ["then", "otherwise"]) {
        if (condition[key] === void 0) {
          delete condition[key];
        } else {
          condition[key] = schema.$_compile(condition[key]);
        }
      }
      return condition;
    };
  })(compile);
  return compile;
}
var extend = {};
var hasRequiredExtend;
function requireExtend() {
  if (hasRequiredExtend) return extend;
  hasRequiredExtend = 1;
  const { assert, clone } = require$$0;
  const Common = /* @__PURE__ */ requireCommon();
  const Messages = /* @__PURE__ */ requireMessages();
  const internals = {};
  extend.type = function(from, options) {
    const base2 = Object.getPrototypeOf(from);
    const prototype = clone(base2);
    const schema = from._assign(Object.create(prototype));
    const def = Object.assign({}, options);
    delete def.base;
    prototype._definition = def;
    const parent = base2._definition || {};
    def.messages = Messages.merge(parent.messages, def.messages);
    def.properties = Object.assign({}, parent.properties, def.properties);
    schema.type = def.type;
    def.flags = Object.assign({}, parent.flags, def.flags);
    const terms = Object.assign({}, parent.terms);
    if (def.terms) {
      for (const name in def.terms) {
        const term = def.terms[name];
        assert(schema.$_terms[name] === void 0, "Invalid term override for", def.type, name);
        schema.$_terms[name] = term.init;
        terms[name] = term;
      }
    }
    def.terms = terms;
    if (!def.args) {
      def.args = parent.args;
    }
    def.prepare = internals.prepare(def.prepare, parent.prepare);
    if (def.coerce) {
      if (typeof def.coerce === "function") {
        def.coerce = { method: def.coerce };
      }
      if (def.coerce.from && !Array.isArray(def.coerce.from)) {
        def.coerce = { method: def.coerce.method, from: [].concat(def.coerce.from) };
      }
    }
    def.coerce = internals.coerce(def.coerce, parent.coerce);
    def.validate = internals.validate(def.validate, parent.validate);
    const rules = Object.assign({}, parent.rules);
    if (def.rules) {
      for (const name in def.rules) {
        const rule = def.rules[name];
        assert(typeof rule === "object", "Invalid rule definition for", def.type, name);
        let method = rule.method;
        if (method === void 0) {
          method = function() {
            return this.$_addRule(name);
          };
        }
        if (method) {
          assert(!prototype[name], "Rule conflict in", def.type, name);
          prototype[name] = method;
        }
        assert(!rules[name], "Rule conflict in", def.type, name);
        rules[name] = rule;
        if (rule.alias) {
          const aliases = [].concat(rule.alias);
          for (const alias of aliases) {
            prototype[alias] = rule.method;
          }
        }
        if (rule.args) {
          rule.argsByName = /* @__PURE__ */ new Map();
          rule.args = rule.args.map((arg) => {
            if (typeof arg === "string") {
              arg = { name: arg };
            }
            assert(!rule.argsByName.has(arg.name), "Duplicated argument name", arg.name);
            if (Common.isSchema(arg.assert)) {
              arg.assert = arg.assert.strict().label(arg.name);
            }
            rule.argsByName.set(arg.name, arg);
            return arg;
          });
        }
      }
    }
    def.rules = rules;
    const modifiers = Object.assign({}, parent.modifiers);
    if (def.modifiers) {
      for (const name in def.modifiers) {
        assert(!prototype[name], "Rule conflict in", def.type, name);
        const modifier = def.modifiers[name];
        assert(typeof modifier === "function", "Invalid modifier definition for", def.type, name);
        const method = function(arg) {
          return this.rule({ [name]: arg });
        };
        prototype[name] = method;
        modifiers[name] = modifier;
      }
    }
    def.modifiers = modifiers;
    if (def.overrides) {
      prototype._super = base2;
      schema.$_super = {};
      for (const override in def.overrides) {
        assert(base2[override], "Cannot override missing", override);
        def.overrides[override][Common.symbols.parent] = base2[override];
        schema.$_super[override] = base2[override].bind(schema);
      }
      Object.assign(prototype, def.overrides);
    }
    def.cast = Object.assign({}, parent.cast, def.cast);
    const manifest2 = Object.assign({}, parent.manifest, def.manifest);
    manifest2.build = internals.build(def.manifest && def.manifest.build, parent.manifest && parent.manifest.build);
    def.manifest = manifest2;
    def.rebuild = internals.rebuild(def.rebuild, parent.rebuild);
    return schema;
  };
  internals.build = function(child, parent) {
    if (!child || !parent) {
      return child || parent;
    }
    return function(obj, desc) {
      return parent(child(obj, desc), desc);
    };
  };
  internals.coerce = function(child, parent) {
    if (!child || !parent) {
      return child || parent;
    }
    return {
      from: child.from && parent.from ? [.../* @__PURE__ */ new Set([...child.from, ...parent.from])] : null,
      method(value, helpers) {
        let coerced;
        if (!parent.from || parent.from.includes(typeof value)) {
          coerced = parent.method(value, helpers);
          if (coerced) {
            if (coerced.errors || coerced.value === void 0) {
              return coerced;
            }
            value = coerced.value;
          }
        }
        if (!child.from || child.from.includes(typeof value)) {
          const own = child.method(value, helpers);
          if (own) {
            return own;
          }
        }
        return coerced;
      }
    };
  };
  internals.prepare = function(child, parent) {
    if (!child || !parent) {
      return child || parent;
    }
    return function(value, helpers) {
      const prepared = child(value, helpers);
      if (prepared) {
        if (prepared.errors || prepared.value === void 0) {
          return prepared;
        }
        value = prepared.value;
      }
      return parent(value, helpers) || prepared;
    };
  };
  internals.rebuild = function(child, parent) {
    if (!child || !parent) {
      return child || parent;
    }
    return function(schema) {
      parent(schema);
      child(schema);
    };
  };
  internals.validate = function(child, parent) {
    if (!child || !parent) {
      return child || parent;
    }
    return function(value, helpers) {
      const result = parent(value, helpers);
      if (result) {
        if (result.errors && (!Array.isArray(result.errors) || result.errors.length)) {
          return result;
        }
        value = result.value;
      }
      return child(value, helpers) || result;
    };
  };
  return extend;
}
var manifest = {};
var hasRequiredManifest;
function requireManifest() {
  if (hasRequiredManifest) return manifest;
  hasRequiredManifest = 1;
  const { assert, clone } = require$$0;
  const Common = /* @__PURE__ */ requireCommon();
  const Messages = /* @__PURE__ */ requireMessages();
  const Ref = /* @__PURE__ */ requireRef();
  const Template = /* @__PURE__ */ requireTemplate();
  let Schemas;
  const internals = {};
  manifest.describe = function(schema) {
    const def = schema._definition;
    const desc = {
      type: schema.type,
      flags: {},
      rules: []
    };
    for (const flag in schema._flags) {
      if (flag[0] !== "_") {
        desc.flags[flag] = internals.describe(schema._flags[flag]);
      }
    }
    if (!Object.keys(desc.flags).length) {
      delete desc.flags;
    }
    if (schema._preferences) {
      desc.preferences = clone(schema._preferences, { shallow: ["messages"] });
      delete desc.preferences[Common.symbols.prefs];
      if (desc.preferences.messages) {
        desc.preferences.messages = Messages.decompile(desc.preferences.messages);
      }
    }
    if (schema._valids) {
      desc.allow = schema._valids.describe();
    }
    if (schema._invalids) {
      desc.invalid = schema._invalids.describe();
    }
    for (const rule of schema._rules) {
      const ruleDef = def.rules[rule.name];
      if (ruleDef.manifest === false) {
        continue;
      }
      const item = { name: rule.name };
      for (const custom in def.modifiers) {
        if (rule[custom] !== void 0) {
          item[custom] = internals.describe(rule[custom]);
        }
      }
      if (rule.args) {
        item.args = {};
        for (const key in rule.args) {
          const arg = rule.args[key];
          if (key === "options" && !Object.keys(arg).length) {
            continue;
          }
          item.args[key] = internals.describe(arg, { assign: key });
        }
        if (!Object.keys(item.args).length) {
          delete item.args;
        }
      }
      desc.rules.push(item);
    }
    if (!desc.rules.length) {
      delete desc.rules;
    }
    for (const term in schema.$_terms) {
      if (term[0] === "_") {
        continue;
      }
      assert(!desc[term], "Cannot describe schema due to internal name conflict with", term);
      const items = schema.$_terms[term];
      if (!items) {
        continue;
      }
      if (items instanceof Map) {
        if (items.size) {
          desc[term] = [...items.entries()];
        }
        continue;
      }
      if (Common.isValues(items)) {
        desc[term] = items.describe();
        continue;
      }
      assert(def.terms[term], "Term", term, "missing configuration");
      const manifest2 = def.terms[term].manifest;
      const mapped = typeof manifest2 === "object";
      if (!items.length && !mapped) {
        continue;
      }
      const normalized = [];
      for (const item of items) {
        normalized.push(internals.describe(item));
      }
      if (mapped) {
        const { from, to } = manifest2.mapped;
        desc[term] = {};
        for (const item of normalized) {
          desc[term][item[to]] = item[from];
        }
        continue;
      }
      if (manifest2 === "single") {
        assert(normalized.length === 1, "Term", term, "contains more than one item");
        desc[term] = normalized[0];
        continue;
      }
      desc[term] = normalized;
    }
    internals.validate(schema.$_root, desc);
    return desc;
  };
  internals.describe = function(item, options = {}) {
    if (Array.isArray(item)) {
      return item.map(internals.describe);
    }
    if (item === Common.symbols.deepDefault) {
      return { special: "deep" };
    }
    if (typeof item !== "object" || item === null) {
      return item;
    }
    if (options.assign === "options") {
      return clone(item);
    }
    if (Buffer && Buffer.isBuffer(item)) {
      return { buffer: item.toString("binary") };
    }
    if (item instanceof Date) {
      return item.toISOString();
    }
    if (item instanceof Error) {
      return item;
    }
    if (item instanceof RegExp) {
      if (options.assign === "regex") {
        return item.toString();
      }
      return { regex: item.toString() };
    }
    if (item[Common.symbols.literal]) {
      return { function: item.literal };
    }
    if (typeof item.describe === "function") {
      if (options.assign === "ref") {
        return item.describe().ref;
      }
      return item.describe();
    }
    const normalized = {};
    for (const key in item) {
      const value = item[key];
      if (value === void 0) {
        continue;
      }
      normalized[key] = internals.describe(value, { assign: key });
    }
    return normalized;
  };
  manifest.build = function(joi, desc) {
    const builder = new internals.Builder(joi);
    return builder.parse(desc);
  };
  internals.Builder = class {
    constructor(joi) {
      this.joi = joi;
    }
    parse(desc) {
      internals.validate(this.joi, desc);
      let schema = this.joi[desc.type]()._bare();
      const def = schema._definition;
      if (desc.flags) {
        for (const flag in desc.flags) {
          const setter = def.flags[flag] && def.flags[flag].setter || flag;
          assert(typeof schema[setter] === "function", "Invalid flag", flag, "for type", desc.type);
          schema = schema[setter](this.build(desc.flags[flag]));
        }
      }
      if (desc.preferences) {
        schema = schema.preferences(this.build(desc.preferences));
      }
      if (desc.allow) {
        schema = schema.allow(...this.build(desc.allow));
      }
      if (desc.invalid) {
        schema = schema.invalid(...this.build(desc.invalid));
      }
      if (desc.rules) {
        for (const rule of desc.rules) {
          assert(typeof schema[rule.name] === "function", "Invalid rule", rule.name, "for type", desc.type);
          const args = [];
          if (rule.args) {
            const built = {};
            for (const key in rule.args) {
              built[key] = this.build(rule.args[key], { assign: key });
            }
            const keys2 = Object.keys(built);
            const definition = def.rules[rule.name].args;
            if (definition) {
              assert(keys2.length <= definition.length, "Invalid number of arguments for", desc.type, rule.name, "(expected up to", definition.length, ", found", keys2.length, ")");
              for (const { name } of definition) {
                args.push(built[name]);
              }
            } else {
              assert(keys2.length === 1, "Invalid number of arguments for", desc.type, rule.name, "(expected up to 1, found", keys2.length, ")");
              args.push(built[keys2[0]]);
            }
          }
          schema = schema[rule.name](...args);
          const options = {};
          for (const custom in def.modifiers) {
            if (rule[custom] !== void 0) {
              options[custom] = this.build(rule[custom]);
            }
          }
          if (Object.keys(options).length) {
            schema = schema.rule(options);
          }
        }
      }
      const terms = {};
      for (const key in desc) {
        if (["allow", "flags", "invalid", "whens", "preferences", "rules", "type"].includes(key)) {
          continue;
        }
        assert(def.terms[key], "Term", key, "missing configuration");
        const manifest2 = def.terms[key].manifest;
        if (manifest2 === "schema") {
          terms[key] = desc[key].map((item) => this.parse(item));
          continue;
        }
        if (manifest2 === "values") {
          terms[key] = desc[key].map((item) => this.build(item));
          continue;
        }
        if (manifest2 === "single") {
          terms[key] = this.build(desc[key]);
          continue;
        }
        if (typeof manifest2 === "object") {
          terms[key] = {};
          for (const name in desc[key]) {
            const value = desc[key][name];
            terms[key][name] = this.parse(value);
          }
          continue;
        }
        terms[key] = this.build(desc[key]);
      }
      if (desc.whens) {
        terms.whens = desc.whens.map((when) => this.build(when));
      }
      schema = def.manifest.build(schema, terms);
      schema.$_temp.ruleset = false;
      return schema;
    }
    build(desc, options = {}) {
      if (desc === null) {
        return null;
      }
      if (Array.isArray(desc)) {
        return desc.map((item) => this.build(item));
      }
      if (desc instanceof Error) {
        return desc;
      }
      if (options.assign === "options") {
        return clone(desc);
      }
      if (options.assign === "regex") {
        return internals.regex(desc);
      }
      if (options.assign === "ref") {
        return Ref.build(desc);
      }
      if (typeof desc !== "object") {
        return desc;
      }
      if (Object.keys(desc).length === 1) {
        if (desc.buffer) {
          assert(Buffer, "Buffers are not supported");
          return Buffer && Buffer.from(desc.buffer, "binary");
        }
        if (desc.function) {
          return { [Common.symbols.literal]: true, literal: desc.function };
        }
        if (desc.override) {
          return Common.symbols.override;
        }
        if (desc.ref) {
          return Ref.build(desc.ref);
        }
        if (desc.regex) {
          return internals.regex(desc.regex);
        }
        if (desc.special) {
          assert(["deep"].includes(desc.special), "Unknown special value", desc.special);
          return Common.symbols.deepDefault;
        }
        if (desc.value) {
          return clone(desc.value);
        }
      }
      if (desc.type) {
        return this.parse(desc);
      }
      if (desc.template) {
        return Template.build(desc);
      }
      const normalized = {};
      for (const key in desc) {
        normalized[key] = this.build(desc[key], { assign: key });
      }
      return normalized;
    }
  };
  internals.regex = function(string2) {
    const end = string2.lastIndexOf("/");
    const exp = string2.slice(1, end);
    const flags = string2.slice(end + 1);
    return new RegExp(exp, flags);
  };
  internals.validate = function(joi, desc) {
    Schemas = Schemas || /* @__PURE__ */ requireSchemas();
    joi.assert(desc, Schemas.description);
  };
  return manifest;
}
var trace = {};
var hasRequiredTrace;
function requireTrace() {
  if (hasRequiredTrace) return trace;
  hasRequiredTrace = 1;
  const { deepEqual } = require$$0;
  const Pinpoint = /* @__PURE__ */ requireLib$2();
  const Errors = /* @__PURE__ */ requireErrors();
  const internals = {
    codes: {
      error: 1,
      pass: 2,
      full: 3
    },
    labels: {
      0: "never used",
      1: "always error",
      2: "always pass"
    }
  };
  trace.setup = function(root) {
    const trace2 = function() {
      root._tracer = root._tracer || new internals.Tracer();
      return root._tracer;
    };
    root.trace = trace2;
    root[/* @__PURE__ */ Symbol.for("@hapi/lab/coverage/initialize")] = trace2;
    root.untrace = () => {
      root._tracer = null;
    };
  };
  trace.location = function(schema) {
    return schema.$_setFlag("_tracerLocation", Pinpoint.location(2));
  };
  internals.Tracer = class {
    constructor() {
      this.name = "Joi";
      this._schemas = /* @__PURE__ */ new Map();
    }
    _register(schema) {
      const existing = this._schemas.get(schema);
      if (existing) {
        return existing.store;
      }
      const store = new internals.Store(schema);
      const { filename, line } = schema._flags._tracerLocation || Pinpoint.location(5);
      this._schemas.set(schema, { filename, line, store });
      return store;
    }
    _combine(merged, sources) {
      for (const { store } of this._schemas.values()) {
        store._combine(merged, sources);
      }
    }
    report(file) {
      const coverage = [];
      for (const { filename, line, store } of this._schemas.values()) {
        if (file && file !== filename) {
          continue;
        }
        const missing = [];
        const skipped = [];
        for (const [schema, log] of store._sources.entries()) {
          if (internals.sub(log.paths, skipped)) {
            continue;
          }
          if (!log.entry) {
            missing.push({
              status: "never reached",
              paths: [...log.paths]
            });
            skipped.push(...log.paths);
            continue;
          }
          for (const type of ["valid", "invalid"]) {
            const set = schema[`_${type}s`];
            if (!set) {
              continue;
            }
            const values2 = new Set(set._values);
            const refs = new Set(set._refs);
            for (const { value, ref: ref2 } of log[type]) {
              values2.delete(value);
              refs.delete(ref2);
            }
            if (values2.size || refs.size) {
              missing.push({
                status: [...values2, ...[...refs].map((ref2) => ref2.display)],
                rule: `${type}s`
              });
            }
          }
          const rules = schema._rules.map((rule) => rule.name);
          for (const type of ["default", "failover"]) {
            if (schema._flags[type] !== void 0) {
              rules.push(type);
            }
          }
          for (const name of rules) {
            const status = internals.labels[log.rule[name] || 0];
            if (status) {
              const report = { rule: name, status };
              if (log.paths.size) {
                report.paths = [...log.paths];
              }
              missing.push(report);
            }
          }
        }
        if (missing.length) {
          coverage.push({
            filename,
            line,
            missing,
            severity: "error",
            message: `Schema missing tests for ${missing.map(internals.message).join(", ")}`
          });
        }
      }
      return coverage.length ? coverage : null;
    }
  };
  internals.Store = class {
    constructor(schema) {
      this.active = true;
      this._sources = /* @__PURE__ */ new Map();
      this._combos = /* @__PURE__ */ new Map();
      this._scan(schema);
    }
    debug(state2, source, name, result) {
      state2.mainstay.debug && state2.mainstay.debug.push({ type: source, name, result, path: state2.path });
    }
    entry(schema, state2) {
      internals.debug(state2, { type: "entry" });
      this._record(schema, (log) => {
        log.entry = true;
      });
    }
    filter(schema, state2, source, value) {
      internals.debug(state2, { type: source, ...value });
      this._record(schema, (log) => {
        log[source].add(value);
      });
    }
    log(schema, state2, source, name, result) {
      internals.debug(state2, { type: source, name, result: result === "full" ? "pass" : result });
      this._record(schema, (log) => {
        log[source][name] = log[source][name] || 0;
        log[source][name] |= internals.codes[result];
      });
    }
    resolve(state2, ref2, to) {
      if (!state2.mainstay.debug) {
        return;
      }
      const log = { type: "resolve", ref: ref2.display, to, path: state2.path };
      state2.mainstay.debug.push(log);
    }
    value(state2, by, from, to, name) {
      if (!state2.mainstay.debug || deepEqual(from, to)) {
        return;
      }
      const log = { type: "value", by, from, to, path: state2.path };
      if (name) {
        log.name = name;
      }
      state2.mainstay.debug.push(log);
    }
    _record(schema, each) {
      const log = this._sources.get(schema);
      if (log) {
        each(log);
        return;
      }
      const sources = this._combos.get(schema);
      for (const source of sources) {
        this._record(source, each);
      }
    }
    _scan(schema, _path) {
      const path = _path || [];
      let log = this._sources.get(schema);
      if (!log) {
        log = {
          paths: /* @__PURE__ */ new Set(),
          entry: false,
          rule: {},
          valid: /* @__PURE__ */ new Set(),
          invalid: /* @__PURE__ */ new Set()
        };
        this._sources.set(schema, log);
      }
      if (path.length) {
        log.paths.add(path);
      }
      const each = (sub, source) => {
        const subId = internals.id(sub, source);
        this._scan(sub, path.concat(subId));
      };
      schema.$_modify({ each, ref: false });
    }
    _combine(merged, sources) {
      this._combos.set(merged, sources);
    }
  };
  internals.message = function(item) {
    const path = item.paths ? Errors.path(item.paths[0]) + (item.rule ? ":" : "") : "";
    return `${path}${item.rule || ""} (${item.status})`;
  };
  internals.id = function(schema, { source, name, path, key }) {
    if (schema._flags.id) {
      return schema._flags.id;
    }
    if (key) {
      return key;
    }
    name = `@${name}`;
    if (source === "terms") {
      return [name, path[Math.min(path.length - 1, 1)]];
    }
    return name;
  };
  internals.sub = function(paths, skipped) {
    for (const path of paths) {
      for (const skip of skipped) {
        if (deepEqual(path.slice(0, skip.length), skip)) {
          return true;
        }
      }
    }
    return false;
  };
  internals.debug = function(state2, event) {
    if (state2.mainstay.debug) {
      event.path = state2.debug ? [...state2.path, state2.debug] : state2.path;
      state2.mainstay.debug.push(event);
    }
  };
  return trace;
}
var modify = {};
var hasRequiredModify;
function requireModify() {
  if (hasRequiredModify) return modify;
  hasRequiredModify = 1;
  (function(exports$1) {
    const { assert } = require$$0;
    const Common = /* @__PURE__ */ requireCommon();
    const Ref = /* @__PURE__ */ requireRef();
    const internals = {};
    exports$1.Ids = internals.Ids = class {
      constructor() {
        this._byId = /* @__PURE__ */ new Map();
        this._byKey = /* @__PURE__ */ new Map();
        this._schemaChain = false;
      }
      clone() {
        const clone = new internals.Ids();
        clone._byId = new Map(this._byId);
        clone._byKey = new Map(this._byKey);
        clone._schemaChain = this._schemaChain;
        return clone;
      }
      concat(source) {
        if (source._schemaChain) {
          this._schemaChain = true;
        }
        for (const [id, value] of source._byId.entries()) {
          assert(!this._byKey.has(id), "Schema id conflicts with existing key:", id);
          this._byId.set(id, value);
        }
        for (const [key, value] of source._byKey.entries()) {
          assert(!this._byId.has(key), "Schema key conflicts with existing id:", key);
          this._byKey.set(key, value);
        }
      }
      fork(path, adjuster, root) {
        const chain = this._collect(path);
        chain.push({ schema: root });
        const tail = chain.shift();
        let adjusted = { id: tail.id, schema: adjuster(tail.schema) };
        assert(Common.isSchema(adjusted.schema), "adjuster function failed to return a joi schema type");
        for (const node of chain) {
          adjusted = { id: node.id, schema: internals.fork(node.schema, adjusted.id, adjusted.schema) };
        }
        return adjusted.schema;
      }
      labels(path, behind = []) {
        const current = path[0];
        const node = this._get(current);
        if (!node) {
          return [...behind, ...path].join(".");
        }
        const forward = path.slice(1);
        behind = [...behind, node.schema._flags.label || current];
        if (!forward.length) {
          return behind.join(".");
        }
        return node.schema._ids.labels(forward, behind);
      }
      reach(path, behind = []) {
        const current = path[0];
        const node = this._get(current);
        assert(node, "Schema does not contain path", [...behind, ...path].join("."));
        const forward = path.slice(1);
        if (!forward.length) {
          return node.schema;
        }
        return node.schema._ids.reach(forward, [...behind, current]);
      }
      register(schema, { key } = {}) {
        if (!schema || !Common.isSchema(schema)) {
          return;
        }
        if (schema.$_property("schemaChain") || schema._ids._schemaChain) {
          this._schemaChain = true;
        }
        const id = schema._flags.id;
        if (id) {
          const existing = this._byId.get(id);
          assert(!existing || existing.schema === schema, "Cannot add different schemas with the same id:", id);
          assert(!this._byKey.has(id), "Schema id conflicts with existing key:", id);
          this._byId.set(id, { schema, id });
        }
        if (key) {
          assert(!this._byKey.has(key), "Schema already contains key:", key);
          assert(!this._byId.has(key), "Schema key conflicts with existing id:", key);
          this._byKey.set(key, { schema, id: key });
        }
      }
      reset() {
        this._byId = /* @__PURE__ */ new Map();
        this._byKey = /* @__PURE__ */ new Map();
        this._schemaChain = false;
      }
      _collect(path, behind = [], nodes = []) {
        const current = path[0];
        const node = this._get(current);
        assert(node, "Schema does not contain path", [...behind, ...path].join("."));
        nodes = [node, ...nodes];
        const forward = path.slice(1);
        if (!forward.length) {
          return nodes;
        }
        return node.schema._ids._collect(forward, [...behind, current], nodes);
      }
      _get(id) {
        return this._byId.get(id) || this._byKey.get(id);
      }
    };
    internals.fork = function(schema, id, replacement) {
      const each = (item, { key }) => {
        if (id === (item._flags.id || key)) {
          return replacement;
        }
      };
      const obj = exports$1.schema(schema, { each, ref: false });
      return obj ? obj.$_mutateRebuild() : schema;
    };
    exports$1.schema = function(schema, options) {
      let obj;
      for (const name in schema._flags) {
        if (name[0] === "_") {
          continue;
        }
        const result = internals.scan(schema._flags[name], { source: "flags", name }, options);
        if (result !== void 0) {
          obj = obj || schema.clone();
          obj._flags[name] = result;
        }
      }
      for (let i = 0; i < schema._rules.length; ++i) {
        const rule = schema._rules[i];
        const result = internals.scan(rule.args, { source: "rules", name: rule.name }, options);
        if (result !== void 0) {
          obj = obj || schema.clone();
          const clone = Object.assign({}, rule);
          clone.args = result;
          obj._rules[i] = clone;
          const existingUnique = obj._singleRules.get(rule.name);
          if (existingUnique === rule) {
            obj._singleRules.set(rule.name, clone);
          }
        }
      }
      for (const name in schema.$_terms) {
        if (name[0] === "_") {
          continue;
        }
        const result = internals.scan(schema.$_terms[name], { source: "terms", name }, options);
        if (result !== void 0) {
          obj = obj || schema.clone();
          obj.$_terms[name] = result;
        }
      }
      return obj;
    };
    internals.scan = function(item, source, options, _path, _key) {
      const path = _path || [];
      if (item === null || typeof item !== "object") {
        return;
      }
      let clone;
      if (Array.isArray(item)) {
        for (let i = 0; i < item.length; ++i) {
          const key = source.source === "terms" && source.name === "keys" && item[i].key;
          const result = internals.scan(item[i], source, options, [i, ...path], key);
          if (result !== void 0) {
            clone = clone || item.slice();
            clone[i] = result;
          }
        }
        return clone;
      }
      if (options.schema !== false && Common.isSchema(item) || options.ref !== false && Ref.isRef(item)) {
        const result = options.each(item, { ...source, path, key: _key });
        if (result === item) {
          return;
        }
        return result;
      }
      for (const key in item) {
        if (key[0] === "_") {
          continue;
        }
        const result = internals.scan(item[key], source, options, [key, ...path], _key);
        if (result !== void 0) {
          clone = clone || Object.assign({}, item);
          clone[key] = result;
        }
      }
      return clone;
    };
  })(modify);
  return modify;
}
var validator = {};
var state;
var hasRequiredState;
function requireState() {
  if (hasRequiredState) return state;
  hasRequiredState = 1;
  const { clone, reach } = require$$0;
  const Common = /* @__PURE__ */ requireCommon();
  const internals = {
    value: /* @__PURE__ */ Symbol("value")
  };
  state = internals.State = class {
    constructor(path, ancestors, state2) {
      this.path = path;
      this.ancestors = ancestors;
      this.mainstay = state2.mainstay;
      this.schemas = state2.schemas;
      this.debug = null;
    }
    localize(path, ancestors = null, schema = null) {
      const state2 = new internals.State(path, ancestors, this);
      if (schema && state2.schemas) {
        state2.schemas = [internals.schemas(schema), ...state2.schemas];
      }
      return state2;
    }
    nest(schema, debug) {
      const state2 = new internals.State(this.path, this.ancestors, this);
      state2.schemas = state2.schemas && [internals.schemas(schema), ...state2.schemas];
      state2.debug = debug;
      return state2;
    }
    shadow(value, reason) {
      this.mainstay.shadow = this.mainstay.shadow || new internals.Shadow();
      this.mainstay.shadow.set(this.path, value, reason);
    }
    snapshot() {
      if (this.mainstay.shadow) {
        this._snapshot = clone(this.mainstay.shadow.node(this.path));
      }
      this.mainstay.snapshot();
    }
    restore() {
      if (this.mainstay.shadow) {
        this.mainstay.shadow.override(this.path, this._snapshot);
        this._snapshot = void 0;
      }
      this.mainstay.restore();
    }
    commit() {
      if (this.mainstay.shadow) {
        this.mainstay.shadow.override(this.path, this._snapshot);
        this._snapshot = void 0;
      }
      this.mainstay.commit();
    }
  };
  internals.schemas = function(schema) {
    if (Common.isSchema(schema)) {
      return { schema };
    }
    return schema;
  };
  internals.Shadow = class {
    constructor() {
      this._values = null;
    }
    set(path, value, reason) {
      if (!path.length) {
        return;
      }
      if (reason === "strip" && typeof path[path.length - 1] === "number") {
        return;
      }
      this._values = this._values || /* @__PURE__ */ new Map();
      let node = this._values;
      for (let i = 0; i < path.length; ++i) {
        const segment = path[i];
        let next = node.get(segment);
        if (!next) {
          next = /* @__PURE__ */ new Map();
          node.set(segment, next);
        }
        node = next;
      }
      node[internals.value] = value;
    }
    get(path) {
      const node = this.node(path);
      if (node) {
        return node[internals.value];
      }
    }
    node(path) {
      if (!this._values) {
        return;
      }
      return reach(this._values, path, { iterables: true });
    }
    override(path, node) {
      if (!this._values) {
        return;
      }
      const parents = path.slice(0, -1);
      const own = path[path.length - 1];
      const parent = reach(this._values, parents, { iterables: true });
      if (node) {
        parent.set(own, node);
        return;
      }
      if (parent) {
        parent.delete(own);
      }
    }
  };
  return state;
}
var hasRequiredValidator;
function requireValidator() {
  if (hasRequiredValidator) return validator;
  hasRequiredValidator = 1;
  (function(exports$1) {
    const { assert, clone, ignore, reach } = require$$0;
    const Common = /* @__PURE__ */ requireCommon();
    const Errors = /* @__PURE__ */ requireErrors();
    const State = /* @__PURE__ */ requireState();
    const internals = {
      result: /* @__PURE__ */ Symbol("result")
    };
    exports$1.entry = function(value, schema, prefs) {
      let settings = Common.defaults;
      if (prefs) {
        assert(prefs.warnings === void 0, "Cannot override warnings preference in synchronous validation");
        assert(prefs.artifacts === void 0, "Cannot override artifacts preference in synchronous validation");
        settings = Common.preferences(Common.defaults, prefs);
      }
      const result = internals.entry(value, schema, settings);
      assert(!result.mainstay.externals.length, "Schema with external rules must use validateAsync()");
      const outcome = { value: result.value };
      if (result.error) {
        outcome.error = result.error;
      }
      if (result.mainstay.warnings.length) {
        outcome.warning = Errors.details(result.mainstay.warnings);
      }
      if (result.mainstay.debug) {
        outcome.debug = result.mainstay.debug;
      }
      if (result.mainstay.artifacts) {
        outcome.artifacts = result.mainstay.artifacts;
      }
      return outcome;
    };
    exports$1.entryAsync = async function(value, schema, prefs) {
      let settings = Common.defaults;
      if (prefs) {
        settings = Common.preferences(Common.defaults, prefs);
      }
      const result = internals.entry(value, schema, settings);
      const mainstay = result.mainstay;
      if (result.error) {
        if (mainstay.debug) {
          result.error.debug = mainstay.debug;
        }
        throw result.error;
      }
      if (mainstay.externals.length) {
        let root = result.value;
        const errors2 = [];
        for (const external of mainstay.externals) {
          const path = external.state.path;
          const linked = external.schema.type === "link" ? mainstay.links.get(external.schema) : null;
          let node = root;
          let key;
          let parent;
          const ancestors = path.length ? [root] : [];
          const original = path.length ? reach(value, path) : value;
          if (path.length) {
            key = path[path.length - 1];
            let current = root;
            for (const segment of path.slice(0, -1)) {
              current = current[segment];
              ancestors.unshift(current);
            }
            parent = ancestors[0];
            node = parent[key];
          }
          try {
            const createError = (code, local) => (linked || external.schema).$_createError(code, node, local, external.state, settings);
            const output = await external.method(node, {
              schema: external.schema,
              linked,
              state: external.state,
              prefs,
              original,
              error: createError,
              errorsArray: internals.errorsArray,
              warn: (code, local) => mainstay.warnings.push((linked || external.schema).$_createError(code, node, local, external.state, settings)),
              message: (messages2, local) => (linked || external.schema).$_createError("external", node, local, external.state, settings, { messages: messages2 })
            });
            if (output === void 0 || output === node) {
              continue;
            }
            if (output instanceof Errors.Report) {
              mainstay.tracer.log(external.schema, external.state, "rule", "external", "error");
              errors2.push(output);
              if (settings.abortEarly) {
                break;
              }
              continue;
            }
            if (Array.isArray(output) && output[Common.symbols.errors]) {
              mainstay.tracer.log(external.schema, external.state, "rule", "external", "error");
              errors2.push(...output);
              if (settings.abortEarly) {
                break;
              }
              continue;
            }
            if (parent) {
              mainstay.tracer.value(external.state, "rule", node, output, "external");
              parent[key] = output;
            } else {
              mainstay.tracer.value(external.state, "rule", root, output, "external");
              root = output;
            }
          } catch (err) {
            if (settings.errors.label) {
              err.message += ` (${external.label})`;
            }
            throw err;
          }
        }
        result.value = root;
        if (errors2.length) {
          result.error = Errors.process(errors2, value, settings);
          if (mainstay.debug) {
            result.error.debug = mainstay.debug;
          }
          throw result.error;
        }
      }
      if (!settings.warnings && !settings.debug && !settings.artifacts) {
        return result.value;
      }
      const outcome = { value: result.value };
      if (mainstay.warnings.length) {
        outcome.warning = Errors.details(mainstay.warnings);
      }
      if (mainstay.debug) {
        outcome.debug = mainstay.debug;
      }
      if (mainstay.artifacts) {
        outcome.artifacts = mainstay.artifacts;
      }
      return outcome;
    };
    exports$1.standard = function(value, schema) {
      if (schema.isAsync()) {
        return exports$1.entryAsync(value, schema);
      }
      return exports$1.entry(value, schema);
    };
    internals.Mainstay = class {
      constructor(tracer, debug, links) {
        this.externals = [];
        this.warnings = [];
        this.tracer = tracer;
        this.debug = debug;
        this.links = links;
        this.shadow = null;
        this.artifacts = null;
        this._snapshots = [];
      }
      snapshot() {
        this._snapshots.push({
          externals: this.externals.slice(),
          warnings: this.warnings.slice()
        });
      }
      restore() {
        const snapshot = this._snapshots.pop();
        this.externals = snapshot.externals;
        this.warnings = snapshot.warnings;
      }
      commit() {
        this._snapshots.pop();
      }
    };
    internals.entry = function(value, schema, prefs) {
      const { tracer, cleanup } = internals.tracer(schema, prefs);
      const debug = prefs.debug ? [] : null;
      const links = schema._ids._schemaChain ? /* @__PURE__ */ new Map() : null;
      const mainstay = new internals.Mainstay(tracer, debug, links);
      const schemas2 = schema._ids._schemaChain ? [{ schema }] : null;
      const state2 = new State([], [], { mainstay, schemas: schemas2 });
      const result = exports$1.validate(value, schema, state2, prefs);
      if (cleanup) {
        schema.$_root.untrace();
      }
      const error = Errors.process(result.errors, value, prefs);
      return { value: result.value, error, mainstay };
    };
    internals.tracer = function(schema, prefs) {
      if (schema.$_root._tracer) {
        return { tracer: schema.$_root._tracer._register(schema) };
      }
      if (prefs.debug) {
        assert(schema.$_root.trace, "Debug mode not supported");
        return { tracer: schema.$_root.trace()._register(schema), cleanup: true };
      }
      return { tracer: internals.ignore };
    };
    exports$1.validate = function(value, schema, state2, prefs, overrides = {}) {
      if (schema.$_terms.whens) {
        schema = schema._generate(value, state2, prefs).schema;
      }
      if (schema._preferences) {
        prefs = internals.prefs(schema, prefs);
      }
      if (schema._cache && prefs.cache) {
        const result = schema._cache.get(value);
        state2.mainstay.tracer.debug(state2, "validate", "cached", !!result);
        if (result) {
          return result;
        }
      }
      const createError = (code, local, localState) => schema.$_createError(code, value, local, localState || state2, prefs);
      const helpers = {
        original: value,
        prefs,
        schema,
        state: state2,
        error: createError,
        errorsArray: internals.errorsArray,
        warn: (code, local, localState) => state2.mainstay.warnings.push(createError(code, local, localState)),
        message: (messages2, local) => schema.$_createError("custom", value, local, state2, prefs, { messages: messages2 })
      };
      state2.mainstay.tracer.entry(schema, state2);
      const def = schema._definition;
      if (def.prepare && value !== void 0 && prefs.convert) {
        const prepared = def.prepare(value, helpers);
        if (prepared) {
          state2.mainstay.tracer.value(state2, "prepare", value, prepared.value);
          if (prepared.errors) {
            return internals.finalize(prepared.value, [].concat(prepared.errors), helpers);
          }
          value = prepared.value;
        }
      }
      if (def.coerce && value !== void 0 && prefs.convert && (!def.coerce.from || def.coerce.from.includes(typeof value))) {
        const coerced = def.coerce.method(value, helpers);
        if (coerced) {
          state2.mainstay.tracer.value(state2, "coerced", value, coerced.value);
          if (coerced.errors) {
            return internals.finalize(coerced.value, [].concat(coerced.errors), helpers);
          }
          value = coerced.value;
        }
      }
      const empty = schema._flags.empty;
      if (empty && empty.$_match(internals.trim(value, schema), state2.nest(empty), Common.defaults)) {
        state2.mainstay.tracer.value(state2, "empty", value, void 0);
        value = void 0;
      }
      const presence = overrides.presence || schema._flags.presence || (schema._flags._endedSwitch ? null : prefs.presence);
      if (value === void 0) {
        if (presence === "forbidden") {
          return internals.finalize(value, null, helpers);
        }
        if (presence === "required") {
          return internals.finalize(value, [schema.$_createError("any.required", value, null, state2, prefs)], helpers);
        }
        if (presence === "optional") {
          if (schema._flags.default !== Common.symbols.deepDefault) {
            return internals.finalize(value, null, helpers);
          }
          state2.mainstay.tracer.value(state2, "default", value, {});
          value = {};
        }
      } else if (presence === "forbidden") {
        return internals.finalize(value, [schema.$_createError("any.unknown", value, null, state2, prefs)], helpers);
      }
      const errors2 = [];
      if (schema._valids) {
        const match = schema._valids.get(value, state2, prefs, schema._flags.insensitive);
        if (match) {
          if (prefs.convert) {
            state2.mainstay.tracer.value(state2, "valids", value, match.value);
            value = match.value;
          }
          state2.mainstay.tracer.filter(schema, state2, "valid", match);
          return internals.finalize(value, null, helpers);
        }
        if (schema._flags.only) {
          const report = schema.$_createError("any.only", value, { valids: schema._valids.values({ display: true }) }, state2, prefs);
          if (prefs.abortEarly) {
            return internals.finalize(value, [report], helpers);
          }
          errors2.push(report);
        }
      }
      if (schema._invalids) {
        const match = schema._invalids.get(value, state2, prefs, schema._flags.insensitive);
        if (match) {
          state2.mainstay.tracer.filter(schema, state2, "invalid", match);
          const report = schema.$_createError("any.invalid", value, { invalids: schema._invalids.values({ display: true }) }, state2, prefs);
          if (prefs.abortEarly) {
            return internals.finalize(value, [report], helpers);
          }
          errors2.push(report);
        }
      }
      if (def.validate) {
        const base2 = def.validate(value, helpers);
        if (base2) {
          state2.mainstay.tracer.value(state2, "base", value, base2.value);
          value = base2.value;
          if (base2.errors) {
            if (!Array.isArray(base2.errors)) {
              errors2.push(base2.errors);
              return internals.finalize(value, errors2, helpers);
            }
            if (base2.errors.length) {
              errors2.push(...base2.errors);
              return internals.finalize(value, errors2, helpers);
            }
          }
        }
      }
      if (!schema._rules.length) {
        return internals.finalize(value, errors2, helpers);
      }
      return internals.rules(value, errors2, helpers);
    };
    internals.rules = function(value, errors2, helpers) {
      const { schema, state: state2, prefs } = helpers;
      for (const rule of schema._rules) {
        const definition = schema._definition.rules[rule.method];
        if (definition.convert && prefs.convert) {
          state2.mainstay.tracer.log(schema, state2, "rule", rule.name, "full");
          continue;
        }
        let ret;
        let args = rule.args;
        if (rule._resolve.length) {
          args = Object.assign({}, args);
          for (const key of rule._resolve) {
            const resolver = definition.argsByName.get(key);
            const resolved = args[key].resolve(value, state2, prefs);
            const normalized = resolver.normalize ? resolver.normalize(resolved) : resolved;
            const invalid = Common.validateArg(normalized, null, resolver);
            if (invalid) {
              ret = schema.$_createError("any.ref", resolved, { arg: key, ref: args[key], reason: invalid }, state2, prefs);
              break;
            }
            args[key] = normalized;
          }
        }
        ret = ret || definition.validate(value, helpers, args, rule);
        const result = internals.rule(ret, rule);
        if (result.errors) {
          state2.mainstay.tracer.log(schema, state2, "rule", rule.name, "error");
          if (rule.warn) {
            state2.mainstay.warnings.push(...result.errors);
            continue;
          }
          if (prefs.abortEarly) {
            return internals.finalize(value, result.errors, helpers);
          }
          errors2.push(...result.errors);
        } else {
          state2.mainstay.tracer.log(schema, state2, "rule", rule.name, "pass");
          state2.mainstay.tracer.value(state2, "rule", value, result.value, rule.name);
          value = result.value;
        }
      }
      return internals.finalize(value, errors2, helpers);
    };
    internals.rule = function(ret, rule) {
      if (ret instanceof Errors.Report) {
        internals.error(ret, rule);
        return { errors: [ret], value: null };
      }
      if (Array.isArray(ret) && ret[Common.symbols.errors]) {
        ret.forEach((report) => internals.error(report, rule));
        return { errors: ret, value: null };
      }
      return { errors: null, value: ret };
    };
    internals.error = function(report, rule) {
      if (rule.message) {
        report._setTemplate(rule.message);
      }
      return report;
    };
    internals.finalize = function(value, errors2, helpers) {
      errors2 = errors2 || [];
      const { schema, state: state2, prefs } = helpers;
      if (errors2.length) {
        const failover = internals.default("failover", void 0, errors2, helpers);
        if (failover !== void 0) {
          state2.mainstay.tracer.value(state2, "failover", value, failover);
          value = failover;
          errors2 = [];
        }
      }
      if (errors2.length && schema._flags.error) {
        if (typeof schema._flags.error === "function") {
          errors2 = schema._flags.error(errors2);
          if (!Array.isArray(errors2)) {
            errors2 = [errors2];
          }
          for (const error of errors2) {
            assert(error instanceof Error || error instanceof Errors.Report, "error() must return an Error object");
          }
        } else {
          errors2 = [schema._flags.error];
        }
      }
      if (value === void 0) {
        const defaulted = internals.default("default", value, errors2, helpers);
        state2.mainstay.tracer.value(state2, "default", value, defaulted);
        value = defaulted;
      }
      if (schema._flags.cast && value !== void 0) {
        const caster = schema._definition.cast[schema._flags.cast];
        if (caster.from(value)) {
          const casted = caster.to(value, helpers);
          state2.mainstay.tracer.value(state2, "cast", value, casted, schema._flags.cast);
          value = casted;
        }
      }
      if (schema.$_terms.externals && prefs.externals && prefs._externals !== false) {
        for (const { method } of schema.$_terms.externals) {
          state2.mainstay.externals.push({ method, schema, state: state2, label: Errors.label(schema._flags, state2, prefs) });
        }
      }
      const result = { value, errors: errors2.length ? errors2 : null };
      if (schema._flags.result) {
        result.value = schema._flags.result === "strip" ? void 0 : (
          /* raw */
          helpers.original
        );
        state2.mainstay.tracer.value(state2, schema._flags.result, value, result.value);
        state2.shadow(value, schema._flags.result);
      }
      if (schema._cache && prefs.cache !== false && !schema._refs.length) {
        schema._cache.set(helpers.original, result);
      }
      if (value !== void 0 && !result.errors && schema._flags.artifact !== void 0) {
        state2.mainstay.artifacts = state2.mainstay.artifacts || /* @__PURE__ */ new Map();
        if (!state2.mainstay.artifacts.has(schema._flags.artifact)) {
          state2.mainstay.artifacts.set(schema._flags.artifact, []);
        }
        state2.mainstay.artifacts.get(schema._flags.artifact).push(state2.path);
      }
      return result;
    };
    internals.prefs = function(schema, prefs) {
      const isDefaultOptions = prefs === Common.defaults;
      if (isDefaultOptions && schema._preferences[Common.symbols.prefs]) {
        return schema._preferences[Common.symbols.prefs];
      }
      prefs = Common.preferences(prefs, schema._preferences);
      if (isDefaultOptions) {
        schema._preferences[Common.symbols.prefs] = prefs;
      }
      return prefs;
    };
    internals.default = function(flag, value, errors2, helpers) {
      const { schema, state: state2, prefs } = helpers;
      const source = schema._flags[flag];
      if (prefs.noDefaults || source === void 0) {
        return value;
      }
      state2.mainstay.tracer.log(schema, state2, "rule", flag, "full");
      if (!source) {
        return source;
      }
      if (typeof source === "function") {
        const args = source.length ? [clone(state2.ancestors[0]), helpers] : [];
        try {
          return source(...args);
        } catch (err) {
          errors2.push(schema.$_createError(`any.${flag}`, null, { error: err }, state2, prefs));
          return;
        }
      }
      if (typeof source !== "object") {
        return source;
      }
      if (source[Common.symbols.literal]) {
        return source.literal;
      }
      if (Common.isResolvable(source)) {
        return source.resolve(value, state2, prefs);
      }
      return clone(source);
    };
    internals.trim = function(value, schema) {
      if (typeof value !== "string") {
        return value;
      }
      const trim = schema.$_getRule("trim");
      if (!trim || !trim.args.enabled) {
        return value;
      }
      return value.trim();
    };
    internals.ignore = {
      active: false,
      debug: ignore,
      entry: ignore,
      filter: ignore,
      log: ignore,
      resolve: ignore,
      value: ignore
    };
    internals.errorsArray = function() {
      const errors2 = [];
      errors2[Common.symbols.errors] = true;
      return errors2;
    };
  })(validator);
  return validator;
}
var values;
var hasRequiredValues;
function requireValues() {
  if (hasRequiredValues) return values;
  hasRequiredValues = 1;
  const { assert, deepEqual } = require$$0;
  const Common = /* @__PURE__ */ requireCommon();
  const internals = {};
  values = internals.Values = class {
    constructor(values2, refs) {
      this._values = new Set(values2);
      this._refs = new Set(refs);
      this._lowercase = internals.lowercases(values2);
      this._override = false;
    }
    get length() {
      return this._values.size + this._refs.size;
    }
    add(value, refs) {
      if (Common.isResolvable(value)) {
        if (!this._refs.has(value)) {
          this._refs.add(value);
          if (refs) {
            refs.register(value);
          }
        }
        return;
      }
      if (!this.has(value, null, null, false)) {
        this._values.add(value);
        if (typeof value === "string") {
          this._lowercase.set(value.toLowerCase(), value);
        }
      }
    }
    static merge(target, source, remove) {
      target = target || new internals.Values();
      if (source) {
        if (source._override) {
          return source.clone();
        }
        for (const item of [...source._values, ...source._refs]) {
          target.add(item);
        }
      }
      if (remove) {
        for (const item of [...remove._values, ...remove._refs]) {
          target.remove(item);
        }
      }
      return target.length ? target : null;
    }
    remove(value) {
      if (Common.isResolvable(value)) {
        this._refs.delete(value);
        return;
      }
      this._values.delete(value);
      if (typeof value === "string") {
        this._lowercase.delete(value.toLowerCase());
      }
    }
    has(value, state2, prefs, insensitive) {
      return !!this.get(value, state2, prefs, insensitive);
    }
    get(value, state2, prefs, insensitive) {
      if (!this.length) {
        return false;
      }
      if (this._values.has(value)) {
        return { value };
      }
      if (typeof value === "string" && value && insensitive) {
        const found = this._lowercase.get(value.toLowerCase());
        if (found) {
          return { value: found };
        }
      }
      if (!this._refs.size && typeof value !== "object") {
        return false;
      }
      if (typeof value === "object") {
        for (const item of this._values) {
          if (deepEqual(item, value)) {
            return { value: item };
          }
        }
      }
      if (state2) {
        for (const ref2 of this._refs) {
          const resolved = ref2.resolve(value, state2, prefs, null, { in: true });
          if (resolved === void 0) {
            continue;
          }
          const items = !ref2.in || typeof resolved !== "object" ? [resolved] : Array.isArray(resolved) ? resolved : Object.keys(resolved);
          for (const item of items) {
            if (typeof item !== typeof value) {
              continue;
            }
            if (insensitive && value && typeof value === "string") {
              if (item.toLowerCase() === value.toLowerCase()) {
                return { value: item, ref: ref2 };
              }
            } else {
              if (deepEqual(item, value)) {
                return { value: item, ref: ref2 };
              }
            }
          }
        }
      }
      return false;
    }
    override() {
      this._override = true;
    }
    values(options) {
      if (options && options.display) {
        const values2 = [];
        for (const item of [...this._values, ...this._refs]) {
          if (item !== void 0) {
            values2.push(item);
          }
        }
        return values2;
      }
      return Array.from([...this._values, ...this._refs]);
    }
    clone() {
      const set = new internals.Values(this._values, this._refs);
      set._override = this._override;
      return set;
    }
    concat(source) {
      assert(!source._override, "Cannot concat override set of values");
      const set = new internals.Values([...this._values, ...source._values], [...this._refs, ...source._refs]);
      set._override = this._override;
      return set;
    }
    describe() {
      const normalized = [];
      if (this._override) {
        normalized.push({ override: true });
      }
      for (const value of this._values.values()) {
        normalized.push(value && typeof value === "object" ? { value } : value);
      }
      for (const value of this._refs.values()) {
        normalized.push(value.describe());
      }
      return normalized;
    }
  };
  internals.Values.prototype[Common.symbols.values] = true;
  internals.Values.prototype.slice = internals.Values.prototype.clone;
  internals.lowercases = function(from) {
    const map = /* @__PURE__ */ new Map();
    if (from) {
      for (const value of from) {
        if (typeof value === "string") {
          map.set(value.toLowerCase(), value);
        }
      }
    }
    return map;
  };
  return values;
}
var base;
var hasRequiredBase;
function requireBase() {
  if (hasRequiredBase) return base;
  hasRequiredBase = 1;
  const { assert, clone, deepEqual, merge } = require$$0;
  const Cache = /* @__PURE__ */ requireCache();
  const Common = /* @__PURE__ */ requireCommon();
  const Compile = /* @__PURE__ */ requireCompile();
  const Errors = /* @__PURE__ */ requireErrors();
  const Extend = /* @__PURE__ */ requireExtend();
  const Manifest = /* @__PURE__ */ requireManifest();
  const Messages = /* @__PURE__ */ requireMessages();
  const Modify = /* @__PURE__ */ requireModify();
  const Ref = /* @__PURE__ */ requireRef();
  const Trace = /* @__PURE__ */ requireTrace();
  const Validator = /* @__PURE__ */ requireValidator();
  const Values = /* @__PURE__ */ requireValues();
  const internals = {};
  internals.Base = class {
    constructor(type) {
      this.type = type;
      this.$_root = null;
      this._definition = {};
      this._reset();
    }
    _reset() {
      this._ids = new Modify.Ids();
      this._preferences = null;
      this._refs = new Ref.Manager();
      this._cache = null;
      this._valids = null;
      this._invalids = null;
      this._flags = {};
      this._rules = [];
      this._singleRules = /* @__PURE__ */ new Map();
      this.$_terms = {};
      this.$_temp = {
        // Runtime state (not cloned)
        ruleset: null,
        // null: use last, false: error, number: start position
        whens: {}
        // Runtime cache of generated whens
      };
    }
    // Manifest
    describe() {
      assert(typeof Manifest.describe === "function", "Manifest functionality disabled");
      return Manifest.describe(this);
    }
    // Rules
    allow(...values2) {
      Common.verifyFlat(values2, "allow");
      return this._values(values2, "_valids");
    }
    alter(targets) {
      assert(targets && typeof targets === "object" && !Array.isArray(targets), "Invalid targets argument");
      assert(!this._inRuleset(), "Cannot set alterations inside a ruleset");
      const obj = this.clone();
      obj.$_terms.alterations = obj.$_terms.alterations || [];
      for (const target in targets) {
        const adjuster = targets[target];
        assert(typeof adjuster === "function", "Alteration adjuster for", target, "must be a function");
        obj.$_terms.alterations.push({ target, adjuster });
      }
      obj.$_temp.ruleset = false;
      return obj;
    }
    artifact(id) {
      assert(id !== void 0, "Artifact cannot be undefined");
      assert(!this._cache, "Cannot set an artifact with a rule cache");
      return this.$_setFlag("artifact", id);
    }
    cast(to) {
      assert(to === false || typeof to === "string", "Invalid to value");
      assert(to === false || this._definition.cast[to], "Type", this.type, "does not support casting to", to);
      return this.$_setFlag("cast", to === false ? void 0 : to);
    }
    default(value, options) {
      return this._default("default", value, options);
    }
    description(desc) {
      assert(desc && typeof desc === "string", "Description must be a non-empty string");
      return this.$_setFlag("description", desc);
    }
    empty(schema) {
      const obj = this.clone();
      if (schema !== void 0) {
        schema = obj.$_compile(schema, { override: false });
      }
      return obj.$_setFlag("empty", schema, { clone: false });
    }
    error(err) {
      assert(err, "Missing error");
      assert(err instanceof Error || typeof err === "function", "Must provide a valid Error object or a function");
      return this.$_setFlag("error", err);
    }
    example(example, options = {}) {
      assert(example !== void 0, "Missing example");
      Common.assertOptions(options, ["override"]);
      return this._inner("examples", example, { single: true, override: options.override });
    }
    external(method, description) {
      if (typeof method === "object") {
        assert(!description, "Cannot combine options with description");
        description = method.description;
        method = method.method;
      }
      assert(typeof method === "function", "Method must be a function");
      assert(description === void 0 || description && typeof description === "string", "Description must be a non-empty string");
      return this._inner("externals", { method, description }, { single: true });
    }
    failover(value, options) {
      return this._default("failover", value, options);
    }
    forbidden() {
      return this.presence("forbidden");
    }
    id(id) {
      if (!id) {
        return this.$_setFlag("id", void 0);
      }
      assert(typeof id === "string", "id must be a non-empty string");
      assert(/^[^\.]+$/.test(id), "id cannot contain period character");
      return this.$_setFlag("id", id);
    }
    invalid(...values2) {
      return this._values(values2, "_invalids");
    }
    label(name) {
      assert(name && typeof name === "string", "Label name must be a non-empty string");
      return this.$_setFlag("label", name);
    }
    meta(meta) {
      assert(meta !== void 0, "Meta cannot be undefined");
      return this._inner("metas", meta, { single: true });
    }
    note(...notes) {
      assert(notes.length, "Missing notes");
      for (const note of notes) {
        assert(note && typeof note === "string", "Notes must be non-empty strings");
      }
      return this._inner("notes", notes);
    }
    only(mode = true) {
      assert(typeof mode === "boolean", "Invalid mode:", mode);
      return this.$_setFlag("only", mode);
    }
    optional() {
      return this.presence("optional");
    }
    prefs(prefs) {
      assert(prefs, "Missing preferences");
      assert(prefs.context === void 0, "Cannot override context");
      assert(prefs.externals === void 0, "Cannot override externals");
      assert(prefs.warnings === void 0, "Cannot override warnings");
      assert(prefs.debug === void 0, "Cannot override debug");
      Common.checkPreferences(prefs);
      const obj = this.clone();
      obj._preferences = Common.preferences(obj._preferences, prefs);
      return obj;
    }
    presence(mode) {
      assert(["optional", "required", "forbidden"].includes(mode), "Unknown presence mode", mode);
      return this.$_setFlag("presence", mode);
    }
    raw(enabled = true) {
      return this.$_setFlag("result", enabled ? "raw" : void 0);
    }
    result(mode) {
      assert(["raw", "strip"].includes(mode), "Unknown result mode", mode);
      return this.$_setFlag("result", mode);
    }
    required() {
      return this.presence("required");
    }
    strict(enabled) {
      const obj = this.clone();
      const convert = enabled === void 0 ? false : !enabled;
      obj._preferences = Common.preferences(obj._preferences, { convert });
      return obj;
    }
    strip(enabled = true) {
      return this.$_setFlag("result", enabled ? "strip" : void 0);
    }
    tag(...tags) {
      assert(tags.length, "Missing tags");
      for (const tag of tags) {
        assert(tag && typeof tag === "string", "Tags must be non-empty strings");
      }
      return this._inner("tags", tags);
    }
    unit(name) {
      assert(name && typeof name === "string", "Unit name must be a non-empty string");
      return this.$_setFlag("unit", name);
    }
    valid(...values2) {
      Common.verifyFlat(values2, "valid");
      const obj = this.allow(...values2);
      obj.$_setFlag("only", !!obj._valids, { clone: false });
      return obj;
    }
    when(condition, options) {
      const obj = this.clone();
      if (!obj.$_terms.whens) {
        obj.$_terms.whens = [];
      }
      const when = Compile.when(obj, condition, options);
      if (!["any", "link"].includes(obj.type)) {
        const conditions = when.is ? [when] : when.switch;
        for (const item of conditions) {
          assert(!item.then || item.then.type === "any" || item.then.type === obj.type, "Cannot combine", obj.type, "with", item.then && item.then.type);
          assert(!item.otherwise || item.otherwise.type === "any" || item.otherwise.type === obj.type, "Cannot combine", obj.type, "with", item.otherwise && item.otherwise.type);
        }
      }
      obj.$_terms.whens.push(when);
      return obj.$_mutateRebuild();
    }
    // Helpers
    cache(cache2) {
      assert(!this._inRuleset(), "Cannot set caching inside a ruleset");
      assert(!this._cache, "Cannot override schema cache");
      assert(this._flags.artifact === void 0, "Cannot cache a rule with an artifact");
      const obj = this.clone();
      obj._cache = cache2 || Cache.provider.provision();
      obj.$_temp.ruleset = false;
      return obj;
    }
    clone() {
      const obj = Object.create(Object.getPrototypeOf(this));
      return this._assign(obj);
    }
    concat(source) {
      assert(Common.isSchema(source), "Invalid schema object");
      assert(this.type === "any" || source.type === "any" || source.type === this.type, "Cannot merge type", this.type, "with another type:", source.type);
      assert(!this._inRuleset(), "Cannot concatenate onto a schema with open ruleset");
      assert(!source._inRuleset(), "Cannot concatenate a schema with open ruleset");
      let obj = this.clone();
      if (this.type === "any" && source.type !== "any") {
        const tmpObj = source.clone();
        for (const key of Object.keys(obj)) {
          if (key !== "type") {
            tmpObj[key] = obj[key];
          }
        }
        obj = tmpObj;
      }
      obj._ids.concat(source._ids);
      obj._refs.register(source, Ref.toSibling);
      obj._preferences = obj._preferences ? Common.preferences(obj._preferences, source._preferences) : source._preferences;
      obj._valids = Values.merge(obj._valids, source._valids, source._invalids);
      obj._invalids = Values.merge(obj._invalids, source._invalids, source._valids);
      for (const name of source._singleRules.keys()) {
        if (obj._singleRules.has(name)) {
          obj._rules = obj._rules.filter((target) => target.keep || target.name !== name);
          obj._singleRules.delete(name);
        }
      }
      for (const test of source._rules) {
        if (!source._definition.rules[test.method].multi) {
          obj._singleRules.set(test.name, test);
        }
        obj._rules.push(test);
      }
      if (obj._flags.empty && source._flags.empty) {
        obj._flags.empty = obj._flags.empty.concat(source._flags.empty);
        const flags = Object.assign({}, source._flags);
        delete flags.empty;
        merge(obj._flags, flags);
      } else if (source._flags.empty) {
        obj._flags.empty = source._flags.empty;
        const flags = Object.assign({}, source._flags);
        delete flags.empty;
        merge(obj._flags, flags);
      } else {
        merge(obj._flags, source._flags);
      }
      for (const key in source.$_terms) {
        const terms = source.$_terms[key];
        if (!terms) {
          if (!obj.$_terms[key]) {
            obj.$_terms[key] = terms;
          }
          continue;
        }
        if (!obj.$_terms[key]) {
          obj.$_terms[key] = terms.slice();
          continue;
        }
        obj.$_terms[key] = obj.$_terms[key].concat(terms);
      }
      if (this.$_root._tracer) {
        this.$_root._tracer._combine(obj, [this, source]);
      }
      return obj.$_mutateRebuild();
    }
    extend(options) {
      assert(!options.base, "Cannot extend type with another base");
      return Extend.type(this, options);
    }
    extract(path) {
      path = Array.isArray(path) ? path : path.split(".");
      return this._ids.reach(path);
    }
    fork(paths, adjuster) {
      assert(!this._inRuleset(), "Cannot fork inside a ruleset");
      let obj = this;
      for (let path of [].concat(paths)) {
        path = Array.isArray(path) ? path : path.split(".");
        obj = obj._ids.fork(path, adjuster, obj);
      }
      obj.$_temp.ruleset = false;
      return obj;
    }
    isAsync() {
      if (Boolean(this.$_terms.externals?.length)) {
        return true;
      }
      if (this.$_terms.whens) {
        for (const when of this.$_terms.whens) {
          if (when.then?.isAsync()) {
            return true;
          }
          if (when.otherwise?.isAsync()) {
            return true;
          }
          if (when.switch) {
            for (const item of when.switch) {
              if (item.then?.isAsync()) {
                return true;
              }
              if (item.otherwise?.isAsync()) {
                return true;
              }
            }
          }
        }
      }
      return false;
    }
    rule(options) {
      const def = this._definition;
      Common.assertOptions(options, Object.keys(def.modifiers));
      assert(this.$_temp.ruleset !== false, "Cannot apply rules to empty ruleset or the last rule added does not support rule properties");
      const start = this.$_temp.ruleset === null ? this._rules.length - 1 : this.$_temp.ruleset;
      assert(start >= 0 && start < this._rules.length, "Cannot apply rules to empty ruleset");
      const obj = this.clone();
      for (let i = start; i < obj._rules.length; ++i) {
        const original = obj._rules[i];
        const rule = clone(original);
        for (const name in options) {
          def.modifiers[name](rule, options[name]);
          assert(rule.name === original.name, "Cannot change rule name");
        }
        obj._rules[i] = rule;
        if (obj._singleRules.get(rule.name) === original) {
          obj._singleRules.set(rule.name, rule);
        }
      }
      obj.$_temp.ruleset = false;
      return obj.$_mutateRebuild();
    }
    get ruleset() {
      assert(!this._inRuleset(), "Cannot start a new ruleset without closing the previous one");
      const obj = this.clone();
      obj.$_temp.ruleset = obj._rules.length;
      return obj;
    }
    get $() {
      return this.ruleset;
    }
    tailor(targets) {
      targets = [].concat(targets);
      assert(!this._inRuleset(), "Cannot tailor inside a ruleset");
      let obj = this;
      if (this.$_terms.alterations) {
        for (const { target, adjuster } of this.$_terms.alterations) {
          if (targets.includes(target)) {
            obj = adjuster(obj);
            assert(Common.isSchema(obj), "Alteration adjuster for", target, "failed to return a schema object");
          }
        }
      }
      obj = obj.$_modify({ each: (item) => item.tailor(targets), ref: false });
      obj.$_temp.ruleset = false;
      return obj.$_mutateRebuild();
    }
    tracer() {
      return Trace.location ? Trace.location(this) : this;
    }
    validate(value, options) {
      return Validator.entry(value, this, options);
    }
    validateAsync(value, options) {
      return Validator.entryAsync(value, this, options);
    }
    // Extensions
    $_addRule(options) {
      if (typeof options === "string") {
        options = { name: options };
      }
      assert(options && typeof options === "object", "Invalid options");
      assert(options.name && typeof options.name === "string", "Invalid rule name");
      for (const key in options) {
        assert(key[0] !== "_", "Cannot set private rule properties");
      }
      const rule = Object.assign({}, options);
      rule._resolve = [];
      rule.method = rule.method || rule.name;
      const definition = this._definition.rules[rule.method];
      const args = rule.args;
      assert(definition, "Unknown rule", rule.method);
      const obj = this.clone();
      if (args) {
        assert(Object.keys(args).length === 1 || Object.keys(args).length === this._definition.rules[rule.name].args.length, "Invalid rule definition for", this.type, rule.name);
        for (const key in args) {
          let arg = args[key];
          if (definition.argsByName) {
            const resolver = definition.argsByName.get(key);
            if (resolver.ref && Common.isResolvable(arg)) {
              rule._resolve.push(key);
              obj.$_mutateRegister(arg);
            } else {
              if (resolver.normalize) {
                arg = resolver.normalize(arg);
                args[key] = arg;
              }
              if (resolver.assert) {
                const error = Common.validateArg(arg, key, resolver);
                assert(!error, error, "or reference");
              }
            }
          }
          if (arg === void 0) {
            delete args[key];
            continue;
          }
          args[key] = arg;
        }
      }
      if (!definition.multi) {
        obj._ruleRemove(rule.name, { clone: false });
        obj._singleRules.set(rule.name, rule);
      }
      if (obj.$_temp.ruleset === false) {
        obj.$_temp.ruleset = null;
      }
      if (definition.priority) {
        obj._rules.unshift(rule);
      } else {
        obj._rules.push(rule);
      }
      return obj;
    }
    $_compile(schema, options) {
      return Compile.schema(this.$_root, schema, options);
    }
    $_createError(code, value, local, state2, prefs, options = {}) {
      const flags = options.flags !== false ? this._flags : {};
      const messages2 = options.messages ? Messages.merge(this._definition.messages, options.messages) : this._definition.messages;
      return new Errors.Report(code, value, local, flags, messages2, state2, prefs);
    }
    $_getFlag(name) {
      return this._flags[name];
    }
    $_getRule(name) {
      return this._singleRules.get(name);
    }
    $_mapLabels(path) {
      path = Array.isArray(path) ? path : path.split(".");
      return this._ids.labels(path);
    }
    $_match(value, state2, prefs, overrides) {
      prefs = Object.assign({}, prefs);
      prefs.abortEarly = true;
      prefs._externals = false;
      state2.snapshot();
      const result = !Validator.validate(value, this, state2, prefs, overrides).errors;
      state2.restore();
      return result;
    }
    $_modify(options) {
      Common.assertOptions(options, ["each", "once", "ref", "schema"]);
      return Modify.schema(this, options) || this;
    }
    $_mutateRebuild() {
      assert(!this._inRuleset(), "Cannot add this rule inside a ruleset");
      this._refs.reset();
      this._ids.reset();
      const each = (item, { source, name, path, key }) => {
        const family = this._definition[source][name] && this._definition[source][name].register;
        if (family !== false) {
          this.$_mutateRegister(item, { family, key });
        }
      };
      this.$_modify({ each });
      if (this._definition.rebuild) {
        this._definition.rebuild(this);
      }
      this.$_temp.ruleset = false;
      return this;
    }
    $_mutateRegister(schema, { family, key } = {}) {
      this._refs.register(schema, family);
      this._ids.register(schema, { key });
    }
    $_property(name) {
      return this._definition.properties[name];
    }
    $_reach(path) {
      return this._ids.reach(path);
    }
    $_rootReferences() {
      return this._refs.roots();
    }
    $_setFlag(name, value, options = {}) {
      assert(name[0] === "_" || !this._inRuleset(), "Cannot set flag inside a ruleset");
      const flag = this._definition.flags[name] || {};
      if (deepEqual(value, flag.default)) {
        value = void 0;
      }
      if (deepEqual(value, this._flags[name])) {
        return this;
      }
      const obj = options.clone !== false ? this.clone() : this;
      if (value !== void 0) {
        obj._flags[name] = value;
        obj.$_mutateRegister(value);
      } else {
        delete obj._flags[name];
      }
      if (name[0] !== "_") {
        obj.$_temp.ruleset = false;
      }
      return obj;
    }
    $_parent(method, ...args) {
      return this[method][Common.symbols.parent].call(this, ...args);
    }
    $_validate(value, state2, prefs) {
      return Validator.validate(value, this, state2, prefs);
    }
    // Internals
    _assign(target) {
      target.type = this.type;
      target.$_root = this.$_root;
      target.$_temp = Object.assign({}, this.$_temp);
      target.$_temp.whens = {};
      target._ids = this._ids.clone();
      target._preferences = this._preferences;
      target._valids = this._valids && this._valids.clone();
      target._invalids = this._invalids && this._invalids.clone();
      target._rules = this._rules.slice();
      target._singleRules = clone(this._singleRules, { shallow: true });
      target._refs = this._refs.clone();
      target._flags = Object.assign({}, this._flags);
      target._cache = null;
      target.$_terms = {};
      for (const key in this.$_terms) {
        target.$_terms[key] = this.$_terms[key] ? this.$_terms[key].slice() : null;
      }
      target.$_super = {};
      for (const override in this.$_super) {
        target.$_super[override] = this._super[override].bind(target);
      }
      return target;
    }
    _bare() {
      const obj = this.clone();
      obj._reset();
      const terms = obj._definition.terms;
      for (const name in terms) {
        const term = terms[name];
        obj.$_terms[name] = term.init;
      }
      return obj.$_mutateRebuild();
    }
    _default(flag, value, options = {}) {
      Common.assertOptions(options, "literal");
      assert(value !== void 0, "Missing", flag, "value");
      assert(typeof value === "function" || !options.literal, "Only function value supports literal option");
      if (typeof value === "function" && options.literal) {
        value = {
          [Common.symbols.literal]: true,
          literal: value
        };
      }
      const obj = this.$_setFlag(flag, value);
      return obj;
    }
    _generate(value, state2, prefs) {
      if (!this.$_terms.whens) {
        return { schema: this };
      }
      const whens = [];
      const ids = [];
      for (let i = 0; i < this.$_terms.whens.length; ++i) {
        const when = this.$_terms.whens[i];
        if (when.concat) {
          whens.push(when.concat);
          ids.push(`${i}.concat`);
          continue;
        }
        const input = when.ref ? when.ref.resolve(value, state2, prefs) : value;
        const tests = when.is ? [when] : when.switch;
        const before = ids.length;
        for (let j = 0; j < tests.length; ++j) {
          const { is, then, otherwise } = tests[j];
          const baseId = `${i}${when.switch ? "." + j : ""}`;
          if (is.$_match(input, state2.nest(is, `${baseId}.is`), prefs)) {
            if (then) {
              const localState = state2.localize([...state2.path, `${baseId}.then`], state2.ancestors, state2.schemas);
              const { schema: generated, id: id2 } = then._generate(value, localState, prefs);
              whens.push(generated);
              ids.push(`${baseId}.then${id2 ? `(${id2})` : ""}`);
              break;
            }
          } else if (otherwise) {
            const localState = state2.localize([...state2.path, `${baseId}.otherwise`], state2.ancestors, state2.schemas);
            const { schema: generated, id: id2 } = otherwise._generate(value, localState, prefs);
            whens.push(generated);
            ids.push(`${baseId}.otherwise${id2 ? `(${id2})` : ""}`);
            break;
          }
        }
        if (when.break && ids.length > before) {
          break;
        }
      }
      const id = ids.join(", ");
      state2.mainstay.tracer.debug(state2, "rule", "when", id);
      if (!id) {
        return { schema: this };
      }
      if (!state2.mainstay.tracer.active && this.$_temp.whens[id]) {
        return { schema: this.$_temp.whens[id], id };
      }
      let obj = this;
      if (this._definition.generate) {
        obj = this._definition.generate(this, value, state2, prefs);
      }
      for (const when of whens) {
        obj = obj.concat(when);
      }
      if (this.$_root._tracer) {
        this.$_root._tracer._combine(obj, [this, ...whens]);
      }
      this.$_temp.whens[id] = obj;
      return { schema: obj, id };
    }
    _inner(type, values2, options = {}) {
      assert(!this._inRuleset(), `Cannot set ${type} inside a ruleset`);
      const obj = this.clone();
      if (!obj.$_terms[type] || options.override) {
        obj.$_terms[type] = [];
      }
      if (options.single) {
        obj.$_terms[type].push(values2);
      } else {
        obj.$_terms[type].push(...values2);
      }
      obj.$_temp.ruleset = false;
      return obj;
    }
    _inRuleset() {
      return this.$_temp.ruleset !== null && this.$_temp.ruleset !== false;
    }
    _ruleRemove(name, options = {}) {
      if (!this._singleRules.has(name)) {
        return this;
      }
      const obj = options.clone !== false ? this.clone() : this;
      obj._singleRules.delete(name);
      const filtered = [];
      for (let i = 0; i < obj._rules.length; ++i) {
        const test = obj._rules[i];
        if (test.name === name && !test.keep) {
          if (obj._inRuleset() && i < obj.$_temp.ruleset) {
            --obj.$_temp.ruleset;
          }
          continue;
        }
        filtered.push(test);
      }
      obj._rules = filtered;
      return obj;
    }
    _values(values2, key) {
      Common.verifyFlat(values2, key.slice(1, -1));
      const obj = this.clone();
      const override = values2[0] === Common.symbols.override;
      if (override) {
        values2 = values2.slice(1);
      }
      if (!obj[key] && values2.length) {
        obj[key] = new Values();
      } else if (override) {
        obj[key] = values2.length ? new Values() : null;
        obj.$_mutateRebuild();
      }
      if (!obj[key]) {
        return obj;
      }
      if (override) {
        obj[key].override();
      }
      for (const value of values2) {
        assert(value !== void 0, "Cannot call allow/valid/invalid with undefined");
        assert(value !== Common.symbols.override, "Override must be the first value");
        const other = key === "_invalids" ? "_valids" : "_invalids";
        if (obj[other]) {
          obj[other].remove(value);
          if (!obj[other].length) {
            assert(key === "_valids" || !obj._flags.only, "Setting invalid value", value, "leaves schema rejecting all values due to previous valid rule");
            obj[other] = null;
          }
        }
        obj[key].add(value, obj._refs);
      }
      return obj;
    }
    // Standard Schema
    get "~standard"() {
      const mapToStandardError = (error) => {
        let issues;
        if (Errors.ValidationError.isError(error)) {
          issues = error.details.map(({ message, path }) => ({
            message,
            path
          }));
        } else {
          issues = [{
            message: error.message
          }];
        }
        return {
          issues
        };
      };
      const mapToStandardValue = (value) => ({ value });
      return {
        version: 1,
        vendor: "joi",
        validate: (value) => {
          const result = Validator.standard(value, this);
          if (result instanceof Promise) {
            return result.then(mapToStandardValue, mapToStandardError);
          }
          if (!result.error) {
            return mapToStandardValue(result.value);
          }
          return mapToStandardError(result.error);
        }
      };
    }
  };
  internals.Base.prototype[Common.symbols.any] = {
    version: Common.version,
    compile: Compile.compile,
    root: "$_root"
  };
  internals.Base.prototype.isImmutable = true;
  internals.Base.prototype.deny = internals.Base.prototype.invalid;
  internals.Base.prototype.disallow = internals.Base.prototype.invalid;
  internals.Base.prototype.equal = internals.Base.prototype.valid;
  internals.Base.prototype.exist = internals.Base.prototype.required;
  internals.Base.prototype.not = internals.Base.prototype.invalid;
  internals.Base.prototype.options = internals.Base.prototype.prefs;
  internals.Base.prototype.preferences = internals.Base.prototype.prefs;
  base = new internals.Base();
  return base;
}
var any;
var hasRequiredAny;
function requireAny() {
  if (hasRequiredAny) return any;
  hasRequiredAny = 1;
  const { assert } = require$$0;
  const Base = /* @__PURE__ */ requireBase();
  const Common = /* @__PURE__ */ requireCommon();
  const Messages = /* @__PURE__ */ requireMessages();
  any = Base.extend({
    type: "any",
    flags: {
      only: { default: false }
    },
    terms: {
      alterations: { init: null },
      examples: { init: null },
      externals: { init: null },
      metas: { init: [] },
      notes: { init: [] },
      shared: { init: null },
      tags: { init: [] },
      whens: { init: null }
    },
    rules: {
      custom: {
        method(method, description) {
          assert(typeof method === "function", "Method must be a function");
          assert(description === void 0 || description && typeof description === "string", "Description must be a non-empty string");
          return this.$_addRule({ name: "custom", args: { method, description } });
        },
        validate(value, helpers, { method }) {
          try {
            return method(value, helpers);
          } catch (err) {
            return helpers.error("any.custom", { error: err });
          }
        },
        args: ["method", "description"],
        multi: true
      },
      messages: {
        method(messages2) {
          return this.prefs({ messages: messages2 });
        }
      },
      shared: {
        method(schema) {
          assert(Common.isSchema(schema) && schema._flags.id, "Schema must be a schema with an id");
          const obj = this.clone();
          obj.$_terms.shared = obj.$_terms.shared || [];
          obj.$_terms.shared.push(schema);
          obj.$_mutateRegister(schema);
          return obj;
        }
      },
      warning: {
        method(code, local) {
          assert(code && typeof code === "string", "Invalid warning code");
          return this.$_addRule({ name: "warning", args: { code, local }, warn: true });
        },
        validate(value, helpers, { code, local }) {
          return helpers.error(code, local);
        },
        args: ["code", "local"],
        multi: true
      }
    },
    modifiers: {
      keep(rule, enabled = true) {
        rule.keep = enabled;
      },
      message(rule, message) {
        rule.message = Messages.compile(message);
      },
      warn(rule, enabled = true) {
        rule.warn = enabled;
      }
    },
    manifest: {
      build(obj, desc) {
        for (const key in desc) {
          const values2 = desc[key];
          if (["examples", "externals", "metas", "notes", "tags"].includes(key)) {
            for (const value of values2) {
              obj = obj[key.slice(0, -1)](value);
            }
            continue;
          }
          if (key === "alterations") {
            const alter = {};
            for (const { target, adjuster } of values2) {
              alter[target] = adjuster;
            }
            obj = obj.alter(alter);
            continue;
          }
          if (key === "whens") {
            for (const value of values2) {
              const { ref: ref2, is, not, then, otherwise, concat } = value;
              if (concat) {
                obj = obj.concat(concat);
              } else if (ref2) {
                obj = obj.when(ref2, { is, not, then, otherwise, switch: value.switch, break: value.break });
              } else {
                obj = obj.when(is, { then, otherwise, break: value.break });
              }
            }
            continue;
          }
          if (key === "shared") {
            for (const value of values2) {
              obj = obj.shared(value);
            }
          }
        }
        return obj;
      }
    },
    messages: {
      "any.custom": "{{#label}} failed custom validation because {{#error.message}}",
      "any.default": "{{#label}} threw an error when running default method",
      "any.failover": "{{#label}} threw an error when running failover method",
      "any.invalid": "{{#label}} contains an invalid value",
      "any.only": '{{#label}} must be {if(#valids.length == 1, "", "one of ")}{{#valids}}',
      "any.ref": "{{#label}} {{#arg}} references {{:#ref}} which {{#reason}}",
      "any.required": "{{#label}} is required",
      "any.unknown": "{{#label}} is not allowed"
    }
  });
  return any;
}
var alternatives;
var hasRequiredAlternatives;
function requireAlternatives() {
  if (hasRequiredAlternatives) return alternatives;
  hasRequiredAlternatives = 1;
  const { assert, merge } = require$$0;
  const Any = /* @__PURE__ */ requireAny();
  const Common = /* @__PURE__ */ requireCommon();
  const Compile = /* @__PURE__ */ requireCompile();
  const Errors = /* @__PURE__ */ requireErrors();
  const Ref = /* @__PURE__ */ requireRef();
  const internals = {};
  alternatives = Any.extend({
    type: "alternatives",
    flags: {
      match: { default: "any" }
      // 'any', 'one', 'all'
    },
    terms: {
      matches: { init: [], register: Ref.toSibling }
    },
    args(schema, ...schemas2) {
      if (schemas2.length === 1) {
        if (Array.isArray(schemas2[0])) {
          return schema.try(...schemas2[0]);
        }
      }
      return schema.try(...schemas2);
    },
    validate(value, helpers) {
      const { schema, error, state: state2, prefs } = helpers;
      if (schema._flags.match) {
        const matched = [];
        const failed = [];
        for (let i = 0; i < schema.$_terms.matches.length; ++i) {
          const item = schema.$_terms.matches[i];
          const localState = state2.nest(item.schema, `match.${i}`);
          localState.snapshot();
          const result = item.schema.$_validate(value, localState, prefs);
          if (!result.errors) {
            matched.push(result.value);
            localState.commit();
          } else {
            failed.push(result.errors);
            localState.restore();
          }
        }
        if (matched.length === 0) {
          const context = {
            details: failed.map((f) => Errors.details(f, { override: false }))
          };
          return { errors: error("alternatives.any", context) };
        }
        if (schema._flags.match === "one") {
          return matched.length === 1 ? { value: matched[0] } : { errors: error("alternatives.one") };
        }
        if (matched.length !== schema.$_terms.matches.length) {
          const context = {
            details: failed.map((f) => Errors.details(f, { override: false }))
          };
          return { errors: error("alternatives.all", context) };
        }
        const isAnyObj = (alternative) => {
          return alternative.$_terms.matches.some((v) => {
            return v.schema.type === "object" || v.schema.type === "alternatives" && isAnyObj(v.schema);
          });
        };
        return isAnyObj(schema) ? { value: matched.reduce((acc, v) => merge(acc, v, { mergeArrays: false })) } : { value: matched[matched.length - 1] };
      }
      const errors2 = [];
      for (let i = 0; i < schema.$_terms.matches.length; ++i) {
        const item = schema.$_terms.matches[i];
        if (item.schema) {
          const localState = state2.nest(item.schema, `match.${i}`);
          localState.snapshot();
          const result = item.schema.$_validate(value, localState, prefs);
          if (!result.errors) {
            localState.commit();
            return result;
          }
          localState.restore();
          errors2.push({ schema: item.schema, reports: result.errors });
          continue;
        }
        const input = item.ref ? item.ref.resolve(value, state2, prefs) : value;
        const tests = item.is ? [item] : item.switch;
        for (let j = 0; j < tests.length; ++j) {
          const test = tests[j];
          const { is, then, otherwise } = test;
          const id = `match.${i}${item.switch ? "." + j : ""}`;
          if (!is.$_match(input, state2.nest(is, `${id}.is`), prefs)) {
            if (otherwise) {
              return otherwise.$_validate(value, state2.nest(otherwise, `${id}.otherwise`), prefs);
            }
          } else if (then) {
            return then.$_validate(value, state2.nest(then, `${id}.then`), prefs);
          }
        }
      }
      return internals.errors(errors2, helpers);
    },
    rules: {
      conditional: {
        method(condition, options) {
          assert(!this._flags._endedSwitch, "Unreachable condition");
          assert(!this._flags.match, "Cannot combine match mode", this._flags.match, "with conditional rule");
          assert(options.break === void 0, "Cannot use break option with alternatives conditional");
          const obj = this.clone();
          const match = Compile.when(obj, condition, options);
          const conditions = match.is ? [match] : match.switch;
          for (const item of conditions) {
            if (item.then && item.otherwise) {
              obj.$_setFlag("_endedSwitch", true, { clone: false });
              break;
            }
          }
          obj.$_terms.matches.push(match);
          return obj.$_mutateRebuild();
        }
      },
      match: {
        method(mode) {
          assert(["any", "one", "all"].includes(mode), "Invalid alternatives match mode", mode);
          if (mode !== "any") {
            for (const match of this.$_terms.matches) {
              assert(match.schema, "Cannot combine match mode", mode, "with conditional rules");
            }
          }
          return this.$_setFlag("match", mode);
        }
      },
      try: {
        method(...schemas2) {
          assert(schemas2.length, "Missing alternative schemas");
          Common.verifyFlat(schemas2, "try");
          assert(!this._flags._endedSwitch, "Unreachable condition");
          const obj = this.clone();
          for (const schema of schemas2) {
            obj.$_terms.matches.push({ schema: obj.$_compile(schema) });
          }
          return obj.$_mutateRebuild();
        }
      }
    },
    overrides: {
      label(name) {
        const obj = this.$_parent("label", name);
        const each = (item, source) => {
          return source.path[0] !== "is" && typeof item._flags.label !== "string" ? item.label(name) : void 0;
        };
        return obj.$_modify({ each, ref: false });
      },
      isAsync() {
        if (this.$_terms.externals?.length) {
          return true;
        }
        for (const match of this.$_terms.matches) {
          if (match.schema?.isAsync()) {
            return true;
          }
          if (match.then?.isAsync()) {
            return true;
          }
          if (match.otherwise?.isAsync()) {
            return true;
          }
        }
        return false;
      }
    },
    rebuild(schema) {
      const each = (item) => {
        if (Common.isSchema(item) && item.type === "array") {
          schema.$_setFlag("_arrayItems", true, { clone: false });
        }
      };
      schema.$_modify({ each });
    },
    manifest: {
      build(obj, desc) {
        if (desc.matches) {
          for (const match of desc.matches) {
            const { schema, ref: ref2, is, not, then, otherwise } = match;
            if (schema) {
              obj = obj.try(schema);
            } else if (ref2) {
              obj = obj.conditional(ref2, { is, then, not, otherwise, switch: match.switch });
            } else {
              obj = obj.conditional(is, { then, otherwise });
            }
          }
        }
        return obj;
      }
    },
    messages: {
      "alternatives.all": "{{#label}} does not match all of the required types",
      "alternatives.any": "{{#label}} does not match any of the allowed types",
      "alternatives.match": "{{#label}} does not match any of the allowed types",
      "alternatives.one": "{{#label}} matches more than one allowed type",
      "alternatives.types": "{{#label}} must be one of {{#types}}"
    }
  });
  internals.errors = function(failures, { error, state: state2 }) {
    if (!failures.length) {
      return { errors: error("alternatives.any") };
    }
    if (failures.length === 1) {
      return { errors: failures[0].reports };
    }
    const valids = /* @__PURE__ */ new Set();
    const complex = [];
    for (const { reports, schema } of failures) {
      if (reports.length > 1) {
        return internals.unmatched(failures, error);
      }
      const report = reports[0];
      if (report instanceof Errors.Report === false) {
        return internals.unmatched(failures, error);
      }
      if (report.state.path.length !== state2.path.length) {
        complex.push({ type: schema.type, report });
        continue;
      }
      if (report.code === "any.only") {
        for (const valid of report.local.valids) {
          valids.add(valid);
        }
        continue;
      }
      const [type, code] = report.code.split(".");
      if (code !== "base") {
        complex.push({ type: schema.type, report });
      } else if (report.code === "object.base") {
        valids.add(report.local.type);
      } else {
        valids.add(type);
      }
    }
    if (!complex.length) {
      return { errors: error("alternatives.types", { types: [...valids] }) };
    }
    if (complex.length === 1) {
      return { errors: complex[0].report };
    }
    return internals.unmatched(failures, error);
  };
  internals.unmatched = function(failures, error) {
    const errors2 = [];
    for (const failure of failures) {
      errors2.push(...failure.reports);
    }
    return { errors: error("alternatives.match", Errors.details(errors2, { override: false })) };
  };
  return alternatives;
}
var array;
var hasRequiredArray;
function requireArray() {
  if (hasRequiredArray) return array;
  hasRequiredArray = 1;
  const { assert, deepEqual, reach } = require$$0;
  const Any = /* @__PURE__ */ requireAny();
  const Common = /* @__PURE__ */ requireCommon();
  const Compile = /* @__PURE__ */ requireCompile();
  const internals = {};
  array = Any.extend({
    type: "array",
    flags: {
      single: { default: false },
      sparse: { default: false }
    },
    terms: {
      items: { init: [], manifest: "schema" },
      ordered: { init: [], manifest: "schema" },
      _exclusions: { init: [] },
      _inclusions: { init: [] },
      _requireds: { init: [] }
    },
    coerce: {
      from: "object",
      method(value, { schema, state: state2, prefs }) {
        if (!Array.isArray(value)) {
          return;
        }
        const sort = schema.$_getRule("sort");
        if (!sort) {
          return;
        }
        return internals.sort(schema, value, sort.args.options, state2, prefs);
      }
    },
    validate(value, { schema, error }) {
      if (!Array.isArray(value)) {
        if (schema._flags.single) {
          const single = [value];
          single[Common.symbols.arraySingle] = true;
          return { value: single };
        }
        return { errors: error("array.base") };
      }
      if (!schema.$_getRule("items") && !schema.$_terms.externals) {
        return;
      }
      return { value: value.slice() };
    },
    rules: {
      has: {
        method(schema) {
          schema = this.$_compile(schema, { appendPath: true });
          const obj = this.$_addRule({ name: "has", args: { schema } });
          obj.$_mutateRegister(schema);
          return obj;
        },
        validate(value, { state: state2, prefs, error }, { schema: has }) {
          const ancestors = [value, ...state2.ancestors];
          for (let i = 0; i < value.length; ++i) {
            const localState = state2.localize([...state2.path, i], ancestors, has);
            if (has.$_match(value[i], localState, prefs)) {
              return value;
            }
          }
          const patternLabel = has._flags.label;
          if (patternLabel) {
            return error("array.hasKnown", { patternLabel });
          }
          return error("array.hasUnknown", null);
        },
        multi: true
      },
      items: {
        method(...schemas2) {
          Common.verifyFlat(schemas2, "items");
          const obj = this.$_addRule("items");
          for (let i = 0; i < schemas2.length; ++i) {
            const type = Common.tryWithPath(() => this.$_compile(schemas2[i]), i, { append: true });
            obj.$_terms.items.push(type);
          }
          return obj.$_mutateRebuild();
        },
        validate(value, { schema, error, state: state2, prefs, errorsArray }) {
          const requireds = schema.$_terms._requireds.slice();
          const ordereds = schema.$_terms.ordered.slice();
          const inclusions = [...schema.$_terms._inclusions, ...requireds];
          const wasArray = !value[Common.symbols.arraySingle];
          delete value[Common.symbols.arraySingle];
          const errors2 = errorsArray();
          let il = value.length;
          for (let i = 0; i < il; ++i) {
            const item = value[i];
            let errored = false;
            let isValid = false;
            const key = wasArray ? i : new Number(i);
            const path = [...state2.path, key];
            if (!schema._flags.sparse && item === void 0) {
              errors2.push(error("array.sparse", { key, path, pos: i, value: void 0 }, state2.localize(path)));
              if (prefs.abortEarly) {
                return errors2;
              }
              ordereds.shift();
              continue;
            }
            const ancestors = [value, ...state2.ancestors];
            for (const exclusion of schema.$_terms._exclusions) {
              if (!exclusion.$_match(item, state2.localize(path, ancestors, exclusion), prefs, { presence: "ignore" })) {
                continue;
              }
              errors2.push(error("array.excludes", { pos: i, value: item }, state2.localize(path)));
              if (prefs.abortEarly) {
                return errors2;
              }
              errored = true;
              ordereds.shift();
              break;
            }
            if (errored) {
              continue;
            }
            if (schema.$_terms.ordered.length) {
              if (ordereds.length) {
                const ordered = ordereds.shift();
                const res = ordered.$_validate(item, state2.localize(path, ancestors, ordered), prefs);
                if (!res.errors) {
                  if (ordered._flags.result === "strip") {
                    internals.fastSplice(value, i);
                    --i;
                    --il;
                  } else if (!schema._flags.sparse && res.value === void 0) {
                    errors2.push(error("array.sparse", { key, path, pos: i, value: void 0 }, state2.localize(path)));
                    if (prefs.abortEarly) {
                      return errors2;
                    }
                    continue;
                  } else {
                    value[i] = res.value;
                  }
                } else {
                  errors2.push(...res.errors);
                  if (prefs.abortEarly) {
                    return errors2;
                  }
                }
                continue;
              } else if (!schema.$_terms.items.length) {
                errors2.push(error("array.orderedLength", { pos: i, limit: schema.$_terms.ordered.length }));
                if (prefs.abortEarly) {
                  return errors2;
                }
                break;
              }
            }
            const requiredChecks = [];
            let jl = requireds.length;
            for (let j = 0; j < jl; ++j) {
              const localState = state2.localize(path, ancestors, requireds[j]);
              localState.snapshot();
              const res = requireds[j].$_validate(item, localState, prefs);
              requiredChecks[j] = res;
              if (!res.errors) {
                localState.commit();
                value[i] = res.value;
                isValid = true;
                internals.fastSplice(requireds, j);
                --j;
                --jl;
                if (!schema._flags.sparse && res.value === void 0) {
                  errors2.push(error("array.sparse", { key, path, pos: i, value: void 0 }, state2.localize(path)));
                  if (prefs.abortEarly) {
                    return errors2;
                  }
                }
                break;
              }
              localState.restore();
            }
            if (isValid) {
              continue;
            }
            const stripUnknown = prefs.stripUnknown && !!prefs.stripUnknown.arrays || false;
            jl = inclusions.length;
            for (const inclusion of inclusions) {
              let res;
              const previousCheck = requireds.indexOf(inclusion);
              if (previousCheck !== -1) {
                res = requiredChecks[previousCheck];
              } else {
                const localState = state2.localize(path, ancestors, inclusion);
                localState.snapshot();
                res = inclusion.$_validate(item, localState, prefs);
                if (!res.errors) {
                  localState.commit();
                  if (inclusion._flags.result === "strip") {
                    internals.fastSplice(value, i);
                    --i;
                    --il;
                  } else if (!schema._flags.sparse && res.value === void 0) {
                    errors2.push(error("array.sparse", { key, path, pos: i, value: void 0 }, state2.localize(path)));
                    errored = true;
                  } else {
                    value[i] = res.value;
                  }
                  isValid = true;
                  break;
                }
                localState.restore();
              }
              if (jl === 1) {
                if (stripUnknown) {
                  internals.fastSplice(value, i);
                  --i;
                  --il;
                  isValid = true;
                  break;
                }
                errors2.push(...res.errors);
                if (prefs.abortEarly) {
                  return errors2;
                }
                errored = true;
                break;
              }
            }
            if (errored) {
              continue;
            }
            if ((schema.$_terms._inclusions.length || schema.$_terms._requireds.length) && !isValid) {
              if (stripUnknown) {
                internals.fastSplice(value, i);
                --i;
                --il;
                continue;
              }
              errors2.push(error("array.includes", { pos: i, value: item }, state2.localize(path)));
              if (prefs.abortEarly) {
                return errors2;
              }
            }
          }
          if (requireds.length) {
            internals.fillMissedErrors(schema, errors2, requireds, value, state2, prefs);
          }
          if (ordereds.length) {
            internals.fillOrderedErrors(schema, errors2, ordereds, value, state2, prefs);
            if (!errors2.length) {
              internals.fillDefault(ordereds, value, state2, prefs);
            }
          }
          return errors2.length ? errors2 : value;
        },
        priority: true,
        manifest: false
      },
      length: {
        method(limit) {
          return this.$_addRule({ name: "length", args: { limit }, operator: "=" });
        },
        validate(value, helpers, { limit }, { name, operator, args }) {
          if (Common.compare(value.length, limit, operator)) {
            return value;
          }
          return helpers.error("array." + name, { limit: args.limit, value });
        },
        args: [
          {
            name: "limit",
            ref: true,
            assert: Common.limit,
            message: "must be a positive integer"
          }
        ]
      },
      max: {
        method(limit) {
          return this.$_addRule({ name: "max", method: "length", args: { limit }, operator: "<=" });
        }
      },
      min: {
        method(limit) {
          return this.$_addRule({ name: "min", method: "length", args: { limit }, operator: ">=" });
        }
      },
      ordered: {
        method(...schemas2) {
          Common.verifyFlat(schemas2, "ordered");
          const obj = this.$_addRule("items");
          for (let i = 0; i < schemas2.length; ++i) {
            const type = Common.tryWithPath(() => this.$_compile(schemas2[i]), i, { append: true });
            internals.validateSingle(type, obj);
            obj.$_mutateRegister(type);
            obj.$_terms.ordered.push(type);
          }
          return obj.$_mutateRebuild();
        }
      },
      single: {
        method(enabled) {
          const value = enabled === void 0 ? true : !!enabled;
          assert(!value || !this._flags._arrayItems, "Cannot specify single rule when array has array items");
          return this.$_setFlag("single", value);
        }
      },
      sort: {
        method(options = {}) {
          Common.assertOptions(options, ["by", "order"]);
          const settings = {
            order: options.order || "ascending"
          };
          if (options.by) {
            settings.by = Compile.ref(options.by, { ancestor: 0 });
            assert(!settings.by.ancestor, "Cannot sort by ancestor");
          }
          return this.$_addRule({ name: "sort", args: { options: settings } });
        },
        validate(value, { error, state: state2, prefs, schema }, { options }) {
          const { value: sorted, errors: errors2 } = internals.sort(schema, value, options, state2, prefs);
          if (errors2) {
            return errors2;
          }
          for (let i = 0; i < value.length; ++i) {
            if (value[i] !== sorted[i]) {
              return error("array.sort", { order: options.order, by: options.by ? options.by.key : "value" });
            }
          }
          return value;
        },
        convert: true
      },
      sparse: {
        method(enabled) {
          const value = enabled === void 0 ? true : !!enabled;
          if (this._flags.sparse === value) {
            return this;
          }
          const obj = value ? this.clone() : this.$_addRule("items");
          return obj.$_setFlag("sparse", value, { clone: false });
        }
      },
      unique: {
        method(comparator, options = {}) {
          assert(!comparator || typeof comparator === "function" || typeof comparator === "string", "comparator must be a function or a string");
          Common.assertOptions(options, ["ignoreUndefined", "separator"]);
          const rule = { name: "unique", args: { options, comparator } };
          if (comparator) {
            if (typeof comparator === "string") {
              const separator = Common.default(options.separator, ".");
              rule.path = separator ? comparator.split(separator) : [comparator];
            } else {
              rule.comparator = comparator;
            }
          }
          return this.$_addRule(rule);
        },
        validate(value, { state: state2, error, schema }, { comparator: raw, options }, { comparator, path }) {
          const found = {
            string: /* @__PURE__ */ Object.create(null),
            number: /* @__PURE__ */ Object.create(null),
            undefined: /* @__PURE__ */ Object.create(null),
            boolean: /* @__PURE__ */ Object.create(null),
            bigint: /* @__PURE__ */ Object.create(null),
            object: /* @__PURE__ */ new Map(),
            function: /* @__PURE__ */ new Map(),
            custom: /* @__PURE__ */ new Map()
          };
          const compare = comparator || deepEqual;
          const ignoreUndefined = options.ignoreUndefined;
          for (let i = 0; i < value.length; ++i) {
            const item = path ? reach(value[i], path) : value[i];
            const records = comparator ? found.custom : found[typeof item];
            assert(records, "Failed to find unique map container for type", typeof item);
            if (records instanceof Map) {
              const entries = records.entries();
              let current;
              while (!(current = entries.next()).done) {
                if (compare(current.value[0], item)) {
                  const localState = state2.localize([...state2.path, i], [value, ...state2.ancestors]);
                  const context = {
                    pos: i,
                    value: value[i],
                    dupePos: current.value[1],
                    dupeValue: value[current.value[1]]
                  };
                  if (path) {
                    context.path = raw;
                  }
                  return error("array.unique", context, localState);
                }
              }
              records.set(item, i);
            } else {
              if ((!ignoreUndefined || item !== void 0) && records[item] !== void 0) {
                const context = {
                  pos: i,
                  value: value[i],
                  dupePos: records[item],
                  dupeValue: value[records[item]]
                };
                if (path) {
                  context.path = raw;
                }
                const localState = state2.localize([...state2.path, i], [value, ...state2.ancestors]);
                return error("array.unique", context, localState);
              }
              records[item] = i;
            }
          }
          return value;
        },
        args: ["comparator", "options"],
        multi: true
      }
    },
    overrides: {
      isAsync() {
        if (this.$_terms.externals?.length) {
          return true;
        }
        for (const item of this.$_terms.items) {
          if (item.isAsync()) {
            return true;
          }
        }
        for (const item of this.$_terms.ordered) {
          if (item.isAsync()) {
            return true;
          }
        }
        return false;
      }
    },
    cast: {
      set: {
        from: Array.isArray,
        to(value, helpers) {
          return new Set(value);
        }
      }
    },
    rebuild(schema) {
      schema.$_terms._inclusions = [];
      schema.$_terms._exclusions = [];
      schema.$_terms._requireds = [];
      for (const type of schema.$_terms.items) {
        internals.validateSingle(type, schema);
        if (type._flags.presence === "required") {
          schema.$_terms._requireds.push(type);
        } else if (type._flags.presence === "forbidden") {
          schema.$_terms._exclusions.push(type);
        } else {
          schema.$_terms._inclusions.push(type);
        }
      }
      for (const type of schema.$_terms.ordered) {
        internals.validateSingle(type, schema);
      }
    },
    manifest: {
      build(obj, desc) {
        if (desc.items) {
          obj = obj.items(...desc.items);
        }
        if (desc.ordered) {
          obj = obj.ordered(...desc.ordered);
        }
        return obj;
      }
    },
    messages: {
      "array.base": "{{#label}} must be an array",
      "array.excludes": "{{#label}} contains an excluded value",
      "array.hasKnown": "{{#label}} does not contain at least one required match for type {:#patternLabel}",
      "array.hasUnknown": "{{#label}} does not contain at least one required match",
      "array.includes": "{{#label}} does not match any of the allowed types",
      "array.includesRequiredBoth": "{{#label}} does not contain {{#knownMisses}} and {{#unknownMisses}} other required value(s)",
      "array.includesRequiredKnowns": "{{#label}} does not contain {{#knownMisses}}",
      "array.includesRequiredUnknowns": "{{#label}} does not contain {{#unknownMisses}} required value(s)",
      "array.length": "{{#label}} must contain {{#limit}} items",
      "array.max": "{{#label}} must contain less than or equal to {{#limit}} items",
      "array.min": "{{#label}} must contain at least {{#limit}} items",
      "array.orderedLength": "{{#label}} must contain at most {{#limit}} items",
      "array.sort": "{{#label}} must be sorted in {#order} order by {{#by}}",
      "array.sort.mismatching": "{{#label}} cannot be sorted due to mismatching types",
      "array.sort.unsupported": "{{#label}} cannot be sorted due to unsupported type {#type}",
      "array.sparse": "{{#label}} must not be a sparse array item",
      "array.unique": "{{#label}} contains a duplicate value"
    }
  });
  internals.fillMissedErrors = function(schema, errors2, requireds, value, state2, prefs) {
    const knownMisses = [];
    let unknownMisses = 0;
    for (const required of requireds) {
      const label = required._flags.label;
      if (label) {
        knownMisses.push(label);
      } else {
        ++unknownMisses;
      }
    }
    if (knownMisses.length) {
      if (unknownMisses) {
        errors2.push(schema.$_createError("array.includesRequiredBoth", value, { knownMisses, unknownMisses }, state2, prefs));
      } else {
        errors2.push(schema.$_createError("array.includesRequiredKnowns", value, { knownMisses }, state2, prefs));
      }
    } else {
      errors2.push(schema.$_createError("array.includesRequiredUnknowns", value, { unknownMisses }, state2, prefs));
    }
  };
  internals.fillOrderedErrors = function(schema, errors2, ordereds, value, state2, prefs) {
    const requiredOrdereds = [];
    for (const ordered of ordereds) {
      if (ordered._flags.presence === "required") {
        requiredOrdereds.push(ordered);
      }
    }
    if (requiredOrdereds.length) {
      internals.fillMissedErrors(schema, errors2, requiredOrdereds, value, state2, prefs);
    }
  };
  internals.fillDefault = function(ordereds, value, state2, prefs) {
    const overrides = [];
    let trailingUndefined = true;
    for (let i = ordereds.length - 1; i >= 0; --i) {
      const ordered = ordereds[i];
      const ancestors = [value, ...state2.ancestors];
      const override = ordered.$_validate(void 0, state2.localize(state2.path, ancestors, ordered), prefs).value;
      if (trailingUndefined) {
        if (override === void 0) {
          continue;
        }
        trailingUndefined = false;
      }
      overrides.unshift(override);
    }
    if (overrides.length) {
      value.push(...overrides);
    }
  };
  internals.fastSplice = function(arr, i) {
    let pos = i;
    while (pos < arr.length) {
      arr[pos++] = arr[pos];
    }
    --arr.length;
  };
  internals.validateSingle = function(type, obj) {
    if (type.type === "array" || type._flags._arrayItems) {
      assert(!obj._flags.single, "Cannot specify array item with single rule enabled");
      obj.$_setFlag("_arrayItems", true, { clone: false });
    }
  };
  internals.sort = function(schema, value, settings, state2, prefs) {
    const order = settings.order === "ascending" ? 1 : -1;
    const aFirst = -1 * order;
    const bFirst = order;
    const sort = (a, b) => {
      let compare = internals.compare(a, b, aFirst, bFirst);
      if (compare !== null) {
        return compare;
      }
      if (settings.by) {
        a = settings.by.resolve(a, state2, prefs);
        b = settings.by.resolve(b, state2, prefs);
      }
      compare = internals.compare(a, b, aFirst, bFirst);
      if (compare !== null) {
        return compare;
      }
      const type = typeof a;
      if (type !== typeof b) {
        throw schema.$_createError("array.sort.mismatching", value, null, state2, prefs);
      }
      if (type !== "number" && type !== "string") {
        throw schema.$_createError("array.sort.unsupported", value, { type }, state2, prefs);
      }
      if (type === "number") {
        return (a - b) * order;
      }
      return a < b ? aFirst : bFirst;
    };
    try {
      return { value: value.slice().sort(sort) };
    } catch (err) {
      return { errors: err };
    }
  };
  internals.compare = function(a, b, aFirst, bFirst) {
    if (a === b) {
      return 0;
    }
    if (a === void 0) {
      return 1;
    }
    if (b === void 0) {
      return -1;
    }
    if (a === null) {
      return bFirst;
    }
    if (b === null) {
      return aFirst;
    }
    return null;
  };
  return array;
}
var boolean;
var hasRequiredBoolean;
function requireBoolean() {
  if (hasRequiredBoolean) return boolean;
  hasRequiredBoolean = 1;
  const { assert } = require$$0;
  const Any = /* @__PURE__ */ requireAny();
  const Common = /* @__PURE__ */ requireCommon();
  const Values = /* @__PURE__ */ requireValues();
  const internals = {};
  internals.isBool = function(value) {
    return typeof value === "boolean";
  };
  boolean = Any.extend({
    type: "boolean",
    flags: {
      sensitive: { default: false }
    },
    terms: {
      falsy: {
        init: null,
        manifest: "values"
      },
      truthy: {
        init: null,
        manifest: "values"
      }
    },
    coerce(value, { schema }) {
      if (typeof value === "boolean") {
        return;
      }
      if (typeof value === "string") {
        const trimmedValue = value.trim();
        const normalized = schema._flags.sensitive ? trimmedValue : trimmedValue.toLowerCase();
        value = normalized === "true" ? true : normalized === "false" ? false : value;
      }
      if (typeof value !== "boolean") {
        value = schema.$_terms.truthy && schema.$_terms.truthy.has(value, null, null, !schema._flags.sensitive) || (schema.$_terms.falsy && schema.$_terms.falsy.has(value, null, null, !schema._flags.sensitive) ? false : value);
      }
      return { value };
    },
    validate(value, { error }) {
      if (typeof value !== "boolean") {
        return { value, errors: error("boolean.base") };
      }
    },
    rules: {
      truthy: {
        method(...values2) {
          Common.verifyFlat(values2, "truthy");
          const obj = this.clone();
          obj.$_terms.truthy = obj.$_terms.truthy || new Values();
          for (let i = 0; i < values2.length; ++i) {
            const value = values2[i];
            assert(value !== void 0, "Cannot call truthy with undefined");
            obj.$_terms.truthy.add(value);
          }
          return obj;
        }
      },
      falsy: {
        method(...values2) {
          Common.verifyFlat(values2, "falsy");
          const obj = this.clone();
          obj.$_terms.falsy = obj.$_terms.falsy || new Values();
          for (let i = 0; i < values2.length; ++i) {
            const value = values2[i];
            assert(value !== void 0, "Cannot call falsy with undefined");
            obj.$_terms.falsy.add(value);
          }
          return obj;
        }
      },
      sensitive: {
        method(enabled = true) {
          return this.$_setFlag("sensitive", enabled);
        }
      }
    },
    cast: {
      number: {
        from: internals.isBool,
        to(value, helpers) {
          return value ? 1 : 0;
        }
      },
      string: {
        from: internals.isBool,
        to(value, helpers) {
          return value ? "true" : "false";
        }
      }
    },
    manifest: {
      build(obj, desc) {
        if (desc.truthy) {
          obj = obj.truthy(...desc.truthy);
        }
        if (desc.falsy) {
          obj = obj.falsy(...desc.falsy);
        }
        return obj;
      }
    },
    messages: {
      "boolean.base": "{{#label}} must be a boolean"
    }
  });
  return boolean;
}
var date;
var hasRequiredDate;
function requireDate() {
  if (hasRequiredDate) return date;
  hasRequiredDate = 1;
  const { assert } = require$$0;
  const Any = /* @__PURE__ */ requireAny();
  const Common = /* @__PURE__ */ requireCommon();
  const Template = /* @__PURE__ */ requireTemplate();
  const internals = {};
  internals.isDate = function(value) {
    return value instanceof Date;
  };
  date = Any.extend({
    type: "date",
    coerce: {
      from: ["number", "string"],
      method(value, { schema }) {
        return { value: internals.parse(value, schema._flags.format) || value };
      }
    },
    validate(value, { schema, error, prefs }) {
      if (value instanceof Date && !isNaN(value.getTime())) {
        return;
      }
      const format = schema._flags.format;
      if (!prefs.convert || !format || typeof value !== "string") {
        return { value, errors: error("date.base") };
      }
      return { value, errors: error("date.format", { format }) };
    },
    rules: {
      compare: {
        method: false,
        validate(value, helpers, { date: date2 }, { name, operator, args }) {
          const to = date2 === "now" ? Date.now() : date2.getTime();
          if (Common.compare(value.getTime(), to, operator)) {
            return value;
          }
          return helpers.error("date." + name, { limit: args.date, value });
        },
        args: [
          {
            name: "date",
            ref: true,
            normalize: (date2) => {
              return date2 === "now" ? date2 : internals.parse(date2);
            },
            assert: (date2) => date2 !== null,
            message: "must have a valid date format"
          }
        ]
      },
      format: {
        method(format) {
          assert(["iso", "javascript", "unix"].includes(format), "Unknown date format", format);
          return this.$_setFlag("format", format);
        }
      },
      greater: {
        method(date2) {
          return this.$_addRule({ name: "greater", method: "compare", args: { date: date2 }, operator: ">" });
        }
      },
      iso: {
        method() {
          return this.format("iso");
        }
      },
      less: {
        method(date2) {
          return this.$_addRule({ name: "less", method: "compare", args: { date: date2 }, operator: "<" });
        }
      },
      max: {
        method(date2) {
          return this.$_addRule({ name: "max", method: "compare", args: { date: date2 }, operator: "<=" });
        }
      },
      min: {
        method(date2) {
          return this.$_addRule({ name: "min", method: "compare", args: { date: date2 }, operator: ">=" });
        }
      },
      timestamp: {
        method(type = "javascript") {
          assert(["javascript", "unix"].includes(type), '"type" must be one of "javascript, unix"');
          return this.format(type);
        }
      }
    },
    cast: {
      number: {
        from: internals.isDate,
        to(value, helpers) {
          return value.getTime();
        }
      },
      string: {
        from: internals.isDate,
        to(value, { prefs }) {
          return Template.date(value, prefs);
        }
      }
    },
    messages: {
      "date.base": "{{#label}} must be a valid date",
      "date.format": '{{#label}} must be in {msg("date.format." + #format) || #format} format',
      "date.greater": "{{#label}} must be greater than {{:#limit}}",
      "date.less": "{{#label}} must be less than {{:#limit}}",
      "date.max": "{{#label}} must be less than or equal to {{:#limit}}",
      "date.min": "{{#label}} must be greater than or equal to {{:#limit}}",
      // Messages used in date.format
      "date.format.iso": "ISO 8601 date",
      "date.format.javascript": "timestamp or number of milliseconds",
      "date.format.unix": "timestamp or number of seconds"
    }
  });
  internals.parse = function(value, format) {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value !== "string" && (isNaN(value) || !isFinite(value))) {
      return null;
    }
    if (/^\s*$/.test(value)) {
      return null;
    }
    if (format === "iso") {
      if (!Common.isIsoDate(value)) {
        return null;
      }
      return internals.date(value.toString());
    }
    const original = value;
    if (typeof value === "string" && /^[+-]?\d+(\.\d+)?$/.test(value)) {
      value = parseFloat(value);
    }
    if (format) {
      if (format === "javascript") {
        return internals.date(1 * value);
      }
      if (format === "unix") {
        return internals.date(1e3 * value);
      }
      if (typeof original === "string") {
        return null;
      }
    }
    return internals.date(value);
  };
  internals.date = function(value) {
    const date2 = new Date(value);
    if (!isNaN(date2.getTime())) {
      return date2;
    }
    return null;
  };
  return date;
}
var keys;
var hasRequiredKeys;
function requireKeys() {
  if (hasRequiredKeys) return keys;
  hasRequiredKeys = 1;
  const { applyToDefaults, assert, clone: Clone } = require$$0;
  const Topo = /* @__PURE__ */ requireLib$3();
  const Any = /* @__PURE__ */ requireAny();
  const Common = /* @__PURE__ */ requireCommon();
  const Compile = /* @__PURE__ */ requireCompile();
  const Errors = /* @__PURE__ */ requireErrors();
  const Ref = /* @__PURE__ */ requireRef();
  const Template = /* @__PURE__ */ requireTemplate();
  const internals = {
    renameDefaults: {
      alias: false,
      // Keep old value in place
      multiple: false,
      // Allow renaming multiple keys into the same target
      override: false
      // Overrides an existing key
    }
  };
  keys = Any.extend({
    type: "_keys",
    properties: {
      typeof: "object"
    },
    flags: {
      unknown: { default: void 0 }
    },
    terms: {
      dependencies: { init: null },
      keys: { init: null, manifest: { mapped: { from: "schema", to: "key" } } },
      patterns: { init: null },
      renames: { init: null }
    },
    args(schema, keys2) {
      return schema.keys(keys2);
    },
    validate(value, { schema, error, state: state2, prefs }) {
      if (!value || typeof value !== schema.$_property("typeof") || Array.isArray(value)) {
        return { value, errors: error("object.base", { type: schema.$_property("typeof") }) };
      }
      if (!schema.$_terms.renames && !schema.$_terms.dependencies && !schema.$_terms.keys && // null allows any keys
      !schema.$_terms.patterns && !schema.$_terms.externals) {
        return;
      }
      value = internals.clone(value, prefs);
      const errors2 = [];
      if (schema.$_terms.renames && !internals.rename(schema, value, state2, prefs, errors2)) {
        return { value, errors: errors2 };
      }
      if (!schema.$_terms.keys && // null allows any keys
      !schema.$_terms.patterns && !schema.$_terms.dependencies) {
        return { value, errors: errors2 };
      }
      const unprocessed = new Set(Object.keys(value));
      if (schema.$_terms.keys) {
        const ancestors = [value, ...state2.ancestors];
        for (const child of schema.$_terms.keys) {
          const key = child.key;
          const item = value[key];
          unprocessed.delete(key);
          const localState = state2.localize([...state2.path, key], ancestors, child);
          const result = child.schema.$_validate(item, localState, prefs);
          if (result.errors) {
            if (prefs.abortEarly) {
              return { value, errors: result.errors };
            }
            if (result.value !== void 0) {
              value[key] = result.value;
            }
            errors2.push(...result.errors);
          } else if (child.schema._flags.result === "strip" || result.value === void 0 && item !== void 0) {
            delete value[key];
          } else if (result.value !== void 0) {
            value[key] = result.value;
          }
        }
      }
      if (unprocessed.size || schema._flags._hasPatternMatch) {
        const early = internals.unknown(schema, value, unprocessed, errors2, state2, prefs);
        if (early) {
          return early;
        }
      }
      if (schema.$_terms.dependencies) {
        for (const dep of schema.$_terms.dependencies) {
          if (dep.key !== null && internals.isPresent(dep.options)(dep.key.resolve(value, state2, prefs, null, { shadow: false })) === false) {
            continue;
          }
          const failed = internals.dependencies[dep.rel](schema, dep, value, state2, prefs);
          if (failed) {
            const report = schema.$_createError(failed.code, value, failed.context, state2, prefs);
            if (prefs.abortEarly) {
              return { value, errors: report };
            }
            errors2.push(report);
          }
        }
      }
      return { value, errors: errors2 };
    },
    rules: {
      and: {
        method(...peers) {
          Common.verifyFlat(peers, "and");
          return internals.dependency(this, "and", null, peers);
        }
      },
      append: {
        method(schema) {
          if (schema === null || schema === void 0 || Object.keys(schema).length === 0) {
            return this;
          }
          return this.keys(schema);
        }
      },
      assert: {
        method(subject, schema, message) {
          if (!Template.isTemplate(subject)) {
            subject = Compile.ref(subject);
          }
          assert(message === void 0 || typeof message === "string", "Message must be a string");
          schema = this.$_compile(schema, { appendPath: true });
          const obj = this.$_addRule({ name: "assert", args: { subject, schema, message } });
          obj.$_mutateRegister(subject);
          obj.$_mutateRegister(schema);
          return obj;
        },
        validate(value, { error, prefs, state: state2 }, { subject, schema, message }) {
          const about = subject.resolve(value, state2, prefs);
          const path = Ref.isRef(subject) ? subject.absolute(state2) : [];
          if (schema.$_match(about, state2.localize(path, [value, ...state2.ancestors], schema), prefs)) {
            return value;
          }
          return error("object.assert", { subject, message });
        },
        args: ["subject", "schema", "message"],
        multi: true
      },
      instance: {
        method(constructor, name) {
          assert(typeof constructor === "function", "constructor must be a function");
          name = name || constructor.name;
          return this.$_addRule({ name: "instance", args: { constructor, name } });
        },
        validate(value, helpers, { constructor, name }) {
          if (value instanceof constructor) {
            return value;
          }
          return helpers.error("object.instance", { type: name, value });
        },
        args: ["constructor", "name"]
      },
      keys: {
        method(schema) {
          assert(schema === void 0 || typeof schema === "object", "Object schema must be a valid object");
          assert(!Common.isSchema(schema), "Object schema cannot be a joi schema");
          const obj = this.clone();
          if (!schema) {
            obj.$_terms.keys = null;
          } else if (!Object.keys(schema).length) {
            obj.$_terms.keys = new internals.Keys();
          } else {
            obj.$_terms.keys = obj.$_terms.keys ? obj.$_terms.keys.filter((child) => !schema.hasOwnProperty(child.key)) : new internals.Keys();
            for (const key in schema) {
              Common.tryWithPath(() => obj.$_terms.keys.push({ key, schema: this.$_compile(schema[key]) }), key);
            }
          }
          return obj.$_mutateRebuild();
        }
      },
      length: {
        method(limit) {
          return this.$_addRule({ name: "length", args: { limit }, operator: "=" });
        },
        validate(value, helpers, { limit }, { name, operator, args }) {
          if (Common.compare(Object.keys(value).length, limit, operator)) {
            return value;
          }
          return helpers.error("object." + name, { limit: args.limit, value });
        },
        args: [
          {
            name: "limit",
            ref: true,
            assert: Common.limit,
            message: "must be a positive integer"
          }
        ]
      },
      max: {
        method(limit) {
          return this.$_addRule({ name: "max", method: "length", args: { limit }, operator: "<=" });
        }
      },
      min: {
        method(limit) {
          return this.$_addRule({ name: "min", method: "length", args: { limit }, operator: ">=" });
        }
      },
      nand: {
        method(...peers) {
          Common.verifyFlat(peers, "nand");
          return internals.dependency(this, "nand", null, peers);
        }
      },
      or: {
        method(...peers) {
          Common.verifyFlat(peers, "or");
          return internals.dependency(this, "or", null, peers);
        }
      },
      oxor: {
        method(...peers) {
          return internals.dependency(this, "oxor", null, peers);
        }
      },
      pattern: {
        method(pattern, schema, options = {}) {
          const isRegExp = pattern instanceof RegExp;
          if (!isRegExp) {
            pattern = this.$_compile(pattern, { appendPath: true });
          }
          assert(schema !== void 0, "Invalid rule");
          Common.assertOptions(options, ["fallthrough", "matches"]);
          if (isRegExp) {
            assert(!pattern.flags.includes("g") && !pattern.flags.includes("y"), "pattern should not use global or sticky mode");
          }
          schema = this.$_compile(schema, { appendPath: true });
          const obj = this.clone();
          obj.$_terms.patterns = obj.$_terms.patterns || [];
          const config = { [isRegExp ? "regex" : "schema"]: pattern, rule: schema };
          if (options.matches) {
            config.matches = this.$_compile(options.matches);
            if (config.matches.type !== "array") {
              config.matches = config.matches.$_root.array().items(config.matches);
            }
            obj.$_mutateRegister(config.matches);
            obj.$_setFlag("_hasPatternMatch", true, { clone: false });
          }
          if (options.fallthrough) {
            config.fallthrough = true;
          }
          obj.$_terms.patterns.push(config);
          obj.$_mutateRegister(schema);
          return obj;
        }
      },
      ref: {
        method() {
          return this.$_addRule("ref");
        },
        validate(value, helpers) {
          if (Ref.isRef(value)) {
            return value;
          }
          return helpers.error("object.refType", { value });
        }
      },
      regex: {
        method() {
          return this.$_addRule("regex");
        },
        validate(value, helpers) {
          if (value instanceof RegExp) {
            return value;
          }
          return helpers.error("object.regex", { value });
        }
      },
      rename: {
        method(from, to, options = {}) {
          assert(typeof from === "string" || from instanceof RegExp, "Rename missing the from argument");
          assert(typeof to === "string" || to instanceof Template, "Invalid rename to argument");
          assert(to !== from, "Cannot rename key to same name:", from);
          Common.assertOptions(options, ["alias", "ignoreUndefined", "override", "multiple"]);
          const obj = this.clone();
          obj.$_terms.renames = obj.$_terms.renames || [];
          for (const rename of obj.$_terms.renames) {
            assert(rename.from !== from, "Cannot rename the same key multiple times");
          }
          if (to instanceof Template) {
            obj.$_mutateRegister(to);
          }
          obj.$_terms.renames.push({
            from,
            to,
            options: applyToDefaults(internals.renameDefaults, options)
          });
          return obj;
        }
      },
      schema: {
        method(type = "any") {
          return this.$_addRule({ name: "schema", args: { type } });
        },
        validate(value, helpers, { type }) {
          if (Common.isSchema(value) && (type === "any" || value.type === type)) {
            return value;
          }
          return helpers.error("object.schema", { type });
        }
      },
      unknown: {
        method(allow) {
          return this.$_setFlag("unknown", allow !== false);
        }
      },
      with: {
        method(key, peers, options = {}) {
          return internals.dependency(this, "with", key, peers, options);
        }
      },
      without: {
        method(key, peers, options = {}) {
          return internals.dependency(this, "without", key, peers, options);
        }
      },
      xor: {
        method(...peers) {
          Common.verifyFlat(peers, "xor");
          return internals.dependency(this, "xor", null, peers);
        }
      }
    },
    overrides: {
      default(value, options) {
        if (value === void 0) {
          value = Common.symbols.deepDefault;
        }
        return this.$_parent("default", value, options);
      },
      isAsync() {
        if (this.$_terms.externals?.length) {
          return true;
        }
        if (this.$_terms.keys?.length) {
          for (const key of this.$_terms.keys) {
            if (key.schema.isAsync()) {
              return true;
            }
          }
        }
        if (this.$_terms.patterns?.length) {
          for (const pattern of this.$_terms.patterns) {
            if (pattern.rule.isAsync()) {
              return true;
            }
          }
        }
        return false;
      }
    },
    rebuild(schema) {
      if (schema.$_terms.keys) {
        const topo = new Topo.Sorter();
        for (const child of schema.$_terms.keys) {
          Common.tryWithPath(() => topo.add(child, { after: child.schema.$_rootReferences(), group: child.key }), child.key);
        }
        schema.$_terms.keys = new internals.Keys(...topo.nodes);
      }
    },
    manifest: {
      build(obj, desc) {
        if (desc.keys) {
          obj = obj.keys(desc.keys);
        }
        if (desc.dependencies) {
          for (const { rel, key = null, peers, options } of desc.dependencies) {
            obj = internals.dependency(obj, rel, key, peers, options);
          }
        }
        if (desc.patterns) {
          for (const { regex, schema, rule, fallthrough, matches } of desc.patterns) {
            obj = obj.pattern(regex || schema, rule, { fallthrough, matches });
          }
        }
        if (desc.renames) {
          for (const { from, to, options } of desc.renames) {
            obj = obj.rename(from, to, options);
          }
        }
        return obj;
      }
    },
    messages: {
      "object.and": "{{#label}} contains {{#presentWithLabels}} without its required peers {{#missingWithLabels}}",
      "object.assert": '{{#label}} is invalid because {if(#subject.key, `"` + #subject.key + `" failed to ` + (#message || "pass the assertion test"), #message || "the assertion failed")}',
      "object.base": "{{#label}} must be of type {{#type}}",
      "object.instance": "{{#label}} must be an instance of {{:#type}}",
      "object.length": '{{#label}} must have {{#limit}} key{if(#limit == 1, "", "s")}',
      "object.max": '{{#label}} must have less than or equal to {{#limit}} key{if(#limit == 1, "", "s")}',
      "object.min": '{{#label}} must have at least {{#limit}} key{if(#limit == 1, "", "s")}',
      "object.missing": "{{#label}} must contain at least one of {{#peersWithLabels}}",
      "object.nand": "{{:#mainWithLabel}} must not exist simultaneously with {{#peersWithLabels}}",
      "object.oxor": "{{#label}} contains a conflict between optional exclusive peers {{#peersWithLabels}}",
      "object.pattern.match": "{{#label}} keys failed to match pattern requirements",
      "object.refType": "{{#label}} must be a Joi reference",
      "object.regex": "{{#label}} must be a RegExp object",
      "object.rename.multiple": "{{#label}} cannot rename {{:#from}} because multiple renames are disabled and another key was already renamed to {{:#to}}",
      "object.rename.override": "{{#label}} cannot rename {{:#from}} because override is disabled and target {{:#to}} exists",
      "object.schema": "{{#label}} must be a Joi schema of {{#type}} type",
      "object.unknown": "{{#label}} is not allowed",
      "object.with": "{{:#mainWithLabel}} missing required peer {{:#peerWithLabel}}",
      "object.without": "{{:#mainWithLabel}} conflict with forbidden peer {{:#peerWithLabel}}",
      "object.xor": "{{#label}} contains a conflict between exclusive peers {{#peersWithLabels}}"
    }
  });
  internals.clone = function(value, prefs) {
    if (typeof value === "object") {
      if (prefs.nonEnumerables) {
        return Clone(value, { shallow: true });
      }
      const clone2 = Object.create(Object.getPrototypeOf(value));
      Object.assign(clone2, value);
      return clone2;
    }
    const clone = function(...args) {
      return value.apply(this, args);
    };
    clone.prototype = Clone(value.prototype);
    Object.defineProperty(clone, "name", { value: value.name, writable: false });
    Object.defineProperty(clone, "length", { value: value.length, writable: false });
    Object.assign(clone, value);
    return clone;
  };
  internals.dependency = function(schema, rel, key, peers, options) {
    assert(key === null || typeof key === "string", rel, "key must be a strings");
    if (!options) {
      options = peers.length > 1 && typeof peers[peers.length - 1] === "object" ? peers.pop() : {};
    }
    Common.assertOptions(options, ["separator", "isPresent"]);
    peers = [].concat(peers);
    const separator = Common.default(options.separator, ".");
    const paths = [];
    for (const peer of peers) {
      assert(typeof peer === "string", rel, "peers must be strings");
      paths.push(Compile.ref(peer, { separator, ancestor: 0, prefix: false }));
    }
    if (key !== null) {
      key = Compile.ref(key, { separator, ancestor: 0, prefix: false });
    }
    const obj = schema.clone();
    obj.$_terms.dependencies = obj.$_terms.dependencies || [];
    obj.$_terms.dependencies.push(new internals.Dependency(rel, key, paths, peers, options));
    return obj;
  };
  internals.dependencies = {
    and(schema, dep, value, state2, prefs) {
      const missing = [];
      const present = [];
      const count = dep.peers.length;
      const isPresent = internals.isPresent(dep.options);
      for (const peer of dep.peers) {
        if (isPresent(peer.resolve(value, state2, prefs, null, { shadow: false })) === false) {
          missing.push(peer.key);
        } else {
          present.push(peer.key);
        }
      }
      if (missing.length !== count && present.length !== count) {
        return {
          code: "object.and",
          context: {
            present,
            presentWithLabels: internals.keysToLabels(schema, present),
            missing,
            missingWithLabels: internals.keysToLabels(schema, missing)
          }
        };
      }
    },
    nand(schema, dep, value, state2, prefs) {
      const present = [];
      const isPresent = internals.isPresent(dep.options);
      for (const peer of dep.peers) {
        if (isPresent(peer.resolve(value, state2, prefs, null, { shadow: false }))) {
          present.push(peer.key);
        }
      }
      if (present.length !== dep.peers.length) {
        return;
      }
      const main = dep.paths[0];
      const values2 = dep.paths.slice(1);
      return {
        code: "object.nand",
        context: {
          main,
          mainWithLabel: internals.keysToLabels(schema, main),
          peers: values2,
          peersWithLabels: internals.keysToLabels(schema, values2)
        }
      };
    },
    or(schema, dep, value, state2, prefs) {
      const isPresent = internals.isPresent(dep.options);
      for (const peer of dep.peers) {
        if (isPresent(peer.resolve(value, state2, prefs, null, { shadow: false }))) {
          return;
        }
      }
      return {
        code: "object.missing",
        context: {
          peers: dep.paths,
          peersWithLabels: internals.keysToLabels(schema, dep.paths)
        }
      };
    },
    oxor(schema, dep, value, state2, prefs) {
      const present = [];
      const isPresent = internals.isPresent(dep.options);
      for (const peer of dep.peers) {
        if (isPresent(peer.resolve(value, state2, prefs, null, { shadow: false }))) {
          present.push(peer.key);
        }
      }
      if (!present.length || present.length === 1) {
        return;
      }
      const context = { peers: dep.paths, peersWithLabels: internals.keysToLabels(schema, dep.paths) };
      context.present = present;
      context.presentWithLabels = internals.keysToLabels(schema, present);
      return { code: "object.oxor", context };
    },
    with(schema, dep, value, state2, prefs) {
      const isPresent = internals.isPresent(dep.options);
      for (const peer of dep.peers) {
        if (isPresent(peer.resolve(value, state2, prefs, null, { shadow: false })) === false) {
          return {
            code: "object.with",
            context: {
              main: dep.key.key,
              mainWithLabel: internals.keysToLabels(schema, dep.key.key),
              peer: peer.key,
              peerWithLabel: internals.keysToLabels(schema, peer.key)
            }
          };
        }
      }
    },
    without(schema, dep, value, state2, prefs) {
      const isPresent = internals.isPresent(dep.options);
      for (const peer of dep.peers) {
        if (isPresent(peer.resolve(value, state2, prefs, null, { shadow: false }))) {
          return {
            code: "object.without",
            context: {
              main: dep.key.key,
              mainWithLabel: internals.keysToLabels(schema, dep.key.key),
              peer: peer.key,
              peerWithLabel: internals.keysToLabels(schema, peer.key)
            }
          };
        }
      }
    },
    xor(schema, dep, value, state2, prefs) {
      const present = [];
      const isPresent = internals.isPresent(dep.options);
      for (const peer of dep.peers) {
        if (isPresent(peer.resolve(value, state2, prefs, null, { shadow: false }))) {
          present.push(peer.key);
        }
      }
      if (present.length === 1) {
        return;
      }
      const context = { peers: dep.paths, peersWithLabels: internals.keysToLabels(schema, dep.paths) };
      if (present.length === 0) {
        return { code: "object.missing", context };
      }
      context.present = present;
      context.presentWithLabels = internals.keysToLabels(schema, present);
      return { code: "object.xor", context };
    }
  };
  internals.keysToLabels = function(schema, keys2) {
    if (Array.isArray(keys2)) {
      return keys2.map((key) => schema.$_mapLabels(key));
    }
    return schema.$_mapLabels(keys2);
  };
  internals.isPresent = function(options) {
    return typeof options.isPresent === "function" ? options.isPresent : (resolved) => resolved !== void 0;
  };
  internals.rename = function(schema, value, state2, prefs, errors2) {
    const renamed = {};
    for (const rename of schema.$_terms.renames) {
      const matches = [];
      const pattern = typeof rename.from !== "string";
      if (!pattern) {
        if (Object.prototype.hasOwnProperty.call(value, rename.from) && (value[rename.from] !== void 0 || !rename.options.ignoreUndefined)) {
          matches.push(rename);
        }
      } else {
        for (const from in value) {
          if (value[from] === void 0 && rename.options.ignoreUndefined) {
            continue;
          }
          if (from === rename.to) {
            continue;
          }
          const match = rename.from.exec(from);
          if (!match) {
            continue;
          }
          matches.push({ from, to: rename.to, match });
        }
      }
      for (const match of matches) {
        const from = match.from;
        let to = match.to;
        if (to instanceof Template) {
          to = to.render(value, state2, prefs, match.match);
        }
        if (from === to) {
          continue;
        }
        if (!rename.options.multiple && renamed[to]) {
          errors2.push(schema.$_createError("object.rename.multiple", value, { from, to, pattern }, state2, prefs));
          if (prefs.abortEarly) {
            return false;
          }
        }
        if (Object.prototype.hasOwnProperty.call(value, to) && !rename.options.override && !renamed[to]) {
          errors2.push(schema.$_createError("object.rename.override", value, { from, to, pattern }, state2, prefs));
          if (prefs.abortEarly) {
            return false;
          }
        }
        if (value[from] === void 0) {
          delete value[to];
        } else {
          value[to] = value[from];
        }
        renamed[to] = true;
        if (!rename.options.alias) {
          delete value[from];
        }
      }
    }
    return true;
  };
  internals.unknown = function(schema, value, unprocessed, errors2, state2, prefs) {
    if (schema.$_terms.patterns) {
      let hasMatches = false;
      const matches = schema.$_terms.patterns.map((pattern) => {
        if (pattern.matches) {
          hasMatches = true;
          return [];
        }
      });
      const ancestors = [value, ...state2.ancestors];
      for (const key of unprocessed) {
        const item = value[key];
        const path = [...state2.path, key];
        for (let i = 0; i < schema.$_terms.patterns.length; ++i) {
          const pattern = schema.$_terms.patterns[i];
          if (pattern.regex) {
            const match = pattern.regex.test(key);
            state2.mainstay.tracer.debug(state2, "rule", `pattern.${i}`, match ? "pass" : "error");
            if (!match) {
              continue;
            }
          } else {
            if (!pattern.schema.$_match(key, state2.nest(pattern.schema, `pattern.${i}`), prefs)) {
              continue;
            }
          }
          unprocessed.delete(key);
          const localState = state2.localize(path, ancestors, { schema: pattern.rule, key });
          const result = pattern.rule.$_validate(item, localState, prefs);
          if (result.errors) {
            if (prefs.abortEarly) {
              return { value, errors: result.errors };
            }
            errors2.push(...result.errors);
          }
          if (pattern.matches) {
            matches[i].push(key);
          }
          value[key] = result.value;
          if (!pattern.fallthrough) {
            break;
          }
        }
      }
      if (hasMatches) {
        for (let i = 0; i < matches.length; ++i) {
          const match = matches[i];
          if (!match) {
            continue;
          }
          const stpm = schema.$_terms.patterns[i].matches;
          const localState = state2.localize(state2.path, ancestors, stpm);
          const result = stpm.$_validate(match, localState, prefs);
          if (result.errors) {
            const details = Errors.details(result.errors, { override: false });
            details.matches = match;
            const report = schema.$_createError("object.pattern.match", value, details, state2, prefs);
            if (prefs.abortEarly) {
              return { value, errors: report };
            }
            errors2.push(report);
          }
        }
      }
    }
    if (!unprocessed.size || !schema.$_terms.keys && !schema.$_terms.patterns) {
      return;
    }
    if (prefs.stripUnknown && typeof schema._flags.unknown === "undefined" || prefs.skipFunctions) {
      const stripUnknown = prefs.stripUnknown ? prefs.stripUnknown === true ? true : !!prefs.stripUnknown.objects : false;
      for (const key of unprocessed) {
        if (stripUnknown) {
          delete value[key];
          unprocessed.delete(key);
        } else if (typeof value[key] === "function") {
          unprocessed.delete(key);
        }
      }
    }
    const forbidUnknown = !Common.default(schema._flags.unknown, prefs.allowUnknown);
    if (forbidUnknown) {
      for (const unprocessedKey of unprocessed) {
        const localState = state2.localize([...state2.path, unprocessedKey], []);
        const report = schema.$_createError("object.unknown", value[unprocessedKey], { child: unprocessedKey }, localState, prefs, { flags: false });
        if (prefs.abortEarly) {
          return { value, errors: report };
        }
        errors2.push(report);
      }
    }
  };
  internals.Dependency = class {
    constructor(rel, key, peers, paths, options) {
      this.rel = rel;
      this.key = key;
      this.peers = peers;
      this.paths = paths;
      this.options = options;
    }
    describe() {
      const desc = {
        rel: this.rel,
        peers: this.paths
      };
      if (this.key !== null) {
        desc.key = this.key.key;
      }
      if (this.peers[0].separator !== ".") {
        desc.options = { ...desc.options, separator: this.peers[0].separator };
      }
      if (this.options.isPresent) {
        desc.options = { ...desc.options, isPresent: this.options.isPresent };
      }
      return desc;
    }
  };
  internals.Keys = class extends Array {
    concat(source) {
      const result = this.slice();
      const keys2 = /* @__PURE__ */ new Map();
      for (let i = 0; i < result.length; ++i) {
        keys2.set(result[i].key, i);
      }
      for (const item of source) {
        const key = item.key;
        const pos = keys2.get(key);
        if (pos !== void 0) {
          result[pos] = { key, schema: result[pos].schema.concat(item.schema) };
        } else {
          result.push(item);
        }
      }
      return result;
    }
  };
  return keys;
}
var _function;
var hasRequired_function;
function require_function() {
  if (hasRequired_function) return _function;
  hasRequired_function = 1;
  const { assert } = require$$0;
  const Keys = /* @__PURE__ */ requireKeys();
  _function = Keys.extend({
    type: "function",
    properties: {
      typeof: "function"
    },
    rules: {
      arity: {
        method(n) {
          assert(Number.isSafeInteger(n) && n >= 0, "n must be a positive integer");
          return this.$_addRule({ name: "arity", args: { n } });
        },
        validate(value, helpers, { n }) {
          if (value.length === n) {
            return value;
          }
          return helpers.error("function.arity", { n });
        }
      },
      class: {
        method() {
          return this.$_addRule("class");
        },
        validate(value, helpers) {
          if (/^\s*class\s/.test(value.toString())) {
            return value;
          }
          return helpers.error("function.class", { value });
        }
      },
      minArity: {
        method(n) {
          assert(Number.isSafeInteger(n) && n > 0, "n must be a strict positive integer");
          return this.$_addRule({ name: "minArity", args: { n } });
        },
        validate(value, helpers, { n }) {
          if (value.length >= n) {
            return value;
          }
          return helpers.error("function.minArity", { n });
        }
      },
      maxArity: {
        method(n) {
          assert(Number.isSafeInteger(n) && n >= 0, "n must be a positive integer");
          return this.$_addRule({ name: "maxArity", args: { n } });
        },
        validate(value, helpers, { n }) {
          if (value.length <= n) {
            return value;
          }
          return helpers.error("function.maxArity", { n });
        }
      }
    },
    messages: {
      "function.arity": "{{#label}} must have an arity of {{#n}}",
      "function.class": "{{#label}} must be a class",
      "function.maxArity": "{{#label}} must have an arity lesser or equal to {{#n}}",
      "function.minArity": "{{#label}} must have an arity greater or equal to {{#n}}"
    }
  });
  return _function;
}
var link;
var hasRequiredLink;
function requireLink() {
  if (hasRequiredLink) return link;
  hasRequiredLink = 1;
  const { assert } = require$$0;
  const Any = /* @__PURE__ */ requireAny();
  const Common = /* @__PURE__ */ requireCommon();
  const Compile = /* @__PURE__ */ requireCompile();
  const Errors = /* @__PURE__ */ requireErrors();
  const internals = {};
  link = Any.extend({
    type: "link",
    properties: {
      schemaChain: true
    },
    terms: {
      link: { init: null, manifest: "single", register: false }
    },
    args(schema, ref2) {
      return schema.ref(ref2);
    },
    validate(value, { schema, state: state2, prefs }) {
      assert(schema.$_terms.link, "Uninitialized link schema");
      const linked = internals.generate(schema, value, state2, prefs);
      const ref2 = schema.$_terms.link[0].ref;
      return linked.$_validate(value, state2.nest(linked, `link:${ref2.display}:${linked.type}`), prefs);
    },
    generate(schema, value, state2, prefs) {
      return internals.generate(schema, value, state2, prefs);
    },
    rules: {
      ref: {
        method(ref2) {
          assert(!this.$_terms.link, "Cannot reinitialize schema");
          ref2 = Compile.ref(ref2);
          assert(ref2.type === "value" || ref2.type === "local", "Invalid reference type:", ref2.type);
          assert(ref2.type === "local" || ref2.ancestor === "root" || ref2.ancestor > 0, "Link cannot reference itself");
          const obj = this.clone();
          obj.$_terms.link = [{ ref: ref2 }];
          return obj;
        }
      },
      relative: {
        method(enabled = true) {
          return this.$_setFlag("relative", enabled);
        }
      }
    },
    overrides: {
      concat(source) {
        assert(this.$_terms.link, "Uninitialized link schema");
        assert(Common.isSchema(source), "Invalid schema object");
        assert(source.type !== "link", "Cannot merge type link with another link");
        const obj = this.clone();
        if (!obj.$_terms.whens) {
          obj.$_terms.whens = [];
        }
        obj.$_terms.whens.push({ concat: source });
        return obj.$_mutateRebuild();
      }
    },
    manifest: {
      build(obj, desc) {
        assert(desc.link, "Invalid link description missing link");
        return obj.ref(desc.link);
      }
    }
  });
  internals.generate = function(schema, value, state2, prefs) {
    let linked = state2.mainstay.links.get(schema);
    if (linked) {
      return linked._generate(value, state2, prefs).schema;
    }
    const ref2 = schema.$_terms.link[0].ref;
    const { perspective, path } = internals.perspective(ref2, state2);
    internals.assert(perspective, "which is outside of schema boundaries", ref2, schema, state2, prefs);
    try {
      linked = path.length ? perspective.$_reach(path) : perspective;
    } catch {
      internals.assert(false, "to non-existing schema", ref2, schema, state2, prefs);
    }
    internals.assert(linked.type !== "link", "which is another link", ref2, schema, state2, prefs);
    if (!schema._flags.relative) {
      state2.mainstay.links.set(schema, linked);
    }
    return linked._generate(value, state2, prefs).schema;
  };
  internals.perspective = function(ref2, state2) {
    if (ref2.type === "local") {
      for (const { schema, key } of state2.schemas) {
        const id = schema._flags.id || key;
        if (id === ref2.path[0]) {
          return { perspective: schema, path: ref2.path.slice(1) };
        }
        if (schema.$_terms.shared) {
          for (const shared of schema.$_terms.shared) {
            if (shared._flags.id === ref2.path[0]) {
              return { perspective: shared, path: ref2.path.slice(1) };
            }
          }
        }
      }
      return { perspective: null, path: null };
    }
    if (ref2.ancestor === "root") {
      return { perspective: state2.schemas[state2.schemas.length - 1].schema, path: ref2.path };
    }
    return { perspective: state2.schemas[ref2.ancestor] && state2.schemas[ref2.ancestor].schema, path: ref2.path };
  };
  internals.assert = function(condition, message, ref2, schema, state2, prefs) {
    if (condition) {
      return;
    }
    assert(false, `"${Errors.label(schema._flags, state2, prefs)}" contains link reference "${ref2.display}" ${message}`);
  };
  return link;
}
var number;
var hasRequiredNumber;
function requireNumber() {
  if (hasRequiredNumber) return number;
  hasRequiredNumber = 1;
  const { assert } = require$$0;
  const Any = /* @__PURE__ */ requireAny();
  const Common = /* @__PURE__ */ requireCommon();
  const internals = {
    numberRx: /^\s*[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e([+-]?\d+))?\s*$/i,
    precisionRx: /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/,
    exponentialPartRegex: /[eE][+-]?\d+$/,
    leadingSignAndZerosRegex: /^[+-]?(0*)?/,
    dotRegex: /\./,
    trailingZerosRegex: /0+$/,
    decimalPlaces(value) {
      const str = value.toString();
      const dindex = str.indexOf(".");
      const eindex = str.indexOf("e");
      return (dindex < 0 ? 0 : (eindex < 0 ? str.length : eindex) - dindex - 1) + (eindex < 0 ? 0 : Math.max(0, -parseInt(str.slice(eindex + 1))));
    }
  };
  number = Any.extend({
    type: "number",
    flags: {
      unsafe: { default: false }
    },
    coerce: {
      from: "string",
      method(value, { schema, error }) {
        const matches = value.match(internals.numberRx);
        if (!matches) {
          return;
        }
        value = value.trim();
        const result = { value: parseFloat(value) };
        if (result.value === 0) {
          result.value = 0;
        }
        if (!schema._flags.unsafe) {
          if (value.match(/e/i)) {
            if (internals.extractSignificantDigits(value) !== internals.extractSignificantDigits(String(result.value))) {
              result.errors = error("number.unsafe");
              return result;
            }
          } else {
            const string2 = result.value.toString();
            if (string2.match(/e/i)) {
              return result;
            }
            if (string2 !== internals.normalizeDecimal(value)) {
              result.errors = error("number.unsafe");
              return result;
            }
          }
        }
        return result;
      }
    },
    validate(value, { schema, error, prefs }) {
      if (value === Infinity || value === -Infinity) {
        return { value, errors: error("number.infinity") };
      }
      if (!Common.isNumber(value)) {
        return { value, errors: error("number.base") };
      }
      const result = { value };
      if (prefs.convert) {
        const rule = schema.$_getRule("precision");
        if (rule) {
          const precision = Math.pow(10, rule.args.limit);
          result.value = Math.round(result.value * precision) / precision;
        }
      }
      if (result.value === 0) {
        result.value = 0;
      }
      if (!schema._flags.unsafe && (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER)) {
        result.errors = error("number.unsafe");
      }
      return result;
    },
    rules: {
      compare: {
        method: false,
        validate(value, helpers, { limit }, { name, operator, args }) {
          if (Common.compare(value, limit, operator)) {
            return value;
          }
          return helpers.error("number." + name, { limit: args.limit, value });
        },
        args: [
          {
            name: "limit",
            ref: true,
            assert: Common.isNumber,
            message: "must be a number"
          }
        ]
      },
      greater: {
        method(limit) {
          return this.$_addRule({ name: "greater", method: "compare", args: { limit }, operator: ">" });
        }
      },
      integer: {
        method() {
          return this.$_addRule("integer");
        },
        validate(value, helpers) {
          if (Math.trunc(value) - value === 0) {
            return value;
          }
          return helpers.error("number.integer");
        }
      },
      less: {
        method(limit) {
          return this.$_addRule({ name: "less", method: "compare", args: { limit }, operator: "<" });
        }
      },
      max: {
        method(limit) {
          return this.$_addRule({ name: "max", method: "compare", args: { limit }, operator: "<=" });
        }
      },
      min: {
        method(limit) {
          return this.$_addRule({ name: "min", method: "compare", args: { limit }, operator: ">=" });
        }
      },
      multiple: {
        method(base2) {
          const baseDecimalPlace = typeof base2 === "number" ? internals.decimalPlaces(base2) : null;
          const pfactor = Math.pow(10, baseDecimalPlace);
          return this.$_addRule({
            name: "multiple",
            args: {
              base: base2,
              baseDecimalPlace,
              pfactor
            }
          });
        },
        validate(value, helpers, { base: base2, baseDecimalPlace, pfactor }, options) {
          const valueDecimalPlace = internals.decimalPlaces(value);
          if (valueDecimalPlace > baseDecimalPlace) {
            return helpers.error("number.multiple", { multiple: options.args.base, value });
          }
          return Math.round(pfactor * value) % Math.round(pfactor * base2) === 0 ? value : helpers.error("number.multiple", { multiple: options.args.base, value });
        },
        args: [
          {
            name: "base",
            ref: true,
            assert: (value) => typeof value === "number" && isFinite(value) && value > 0,
            message: "must be a positive number"
          },
          "baseDecimalPlace",
          "pfactor"
        ],
        multi: true
      },
      negative: {
        method() {
          return this.sign("negative");
        }
      },
      port: {
        method() {
          return this.$_addRule("port");
        },
        validate(value, helpers) {
          if (Number.isSafeInteger(value) && value >= 0 && value <= 65535) {
            return value;
          }
          return helpers.error("number.port");
        }
      },
      positive: {
        method() {
          return this.sign("positive");
        }
      },
      precision: {
        method(limit) {
          assert(Number.isSafeInteger(limit), "limit must be an integer");
          return this.$_addRule({ name: "precision", args: { limit } });
        },
        validate(value, helpers, { limit }) {
          const places = value.toString().match(internals.precisionRx);
          const decimals = Math.max((places[1] ? places[1].length : 0) - (places[2] ? parseInt(places[2], 10) : 0), 0);
          if (decimals <= limit) {
            return value;
          }
          return helpers.error("number.precision", { limit, value });
        },
        convert: true
      },
      sign: {
        method(sign) {
          assert(["negative", "positive"].includes(sign), "Invalid sign", sign);
          return this.$_addRule({ name: "sign", args: { sign } });
        },
        validate(value, helpers, { sign }) {
          if (sign === "negative" && value < 0 || sign === "positive" && value > 0) {
            return value;
          }
          return helpers.error(`number.${sign}`);
        }
      },
      unsafe: {
        method(enabled = true) {
          assert(typeof enabled === "boolean", "enabled must be a boolean");
          return this.$_setFlag("unsafe", enabled);
        }
      }
    },
    cast: {
      string: {
        from: (value) => typeof value === "number",
        to(value, helpers) {
          return value.toString();
        }
      }
    },
    messages: {
      "number.base": "{{#label}} must be a number",
      "number.greater": "{{#label}} must be greater than {{#limit}}",
      "number.infinity": "{{#label}} cannot be infinity",
      "number.integer": "{{#label}} must be an integer",
      "number.less": "{{#label}} must be less than {{#limit}}",
      "number.max": "{{#label}} must be less than or equal to {{#limit}}",
      "number.min": "{{#label}} must be greater than or equal to {{#limit}}",
      "number.multiple": "{{#label}} must be a multiple of {{#multiple}}",
      "number.negative": "{{#label}} must be a negative number",
      "number.port": "{{#label}} must be a valid port",
      "number.positive": "{{#label}} must be a positive number",
      "number.precision": "{{#label}} must have no more than {{#limit}} decimal places",
      "number.unsafe": "{{#label}} must be a safe number"
    }
  });
  internals.extractSignificantDigits = function(value) {
    return value.replace(internals.exponentialPartRegex, "").replace(internals.dotRegex, "").replace(internals.trailingZerosRegex, "").replace(internals.leadingSignAndZerosRegex, "");
  };
  internals.normalizeDecimal = function(str) {
    str = str.replace(/^\+/, "").replace(/\.0*$/, "").replace(/^(-?)\.([^\.]*)$/, "$10.$2").replace(/^(-?)0+([0-9])/, "$1$2");
    if (str.includes(".") && str.endsWith("0")) {
      str = str.replace(/0+$/, "");
    }
    if (str === "-0") {
      return "0";
    }
    return str;
  };
  return number;
}
var object;
var hasRequiredObject;
function requireObject() {
  if (hasRequiredObject) return object;
  hasRequiredObject = 1;
  const Keys = /* @__PURE__ */ requireKeys();
  object = Keys.extend({
    type: "object",
    cast: {
      map: {
        from: (value) => value && typeof value === "object",
        to(value, helpers) {
          return new Map(Object.entries(value));
        }
      }
    }
  });
  return object;
}
var string;
var hasRequiredString;
function requireString() {
  if (hasRequiredString) return string;
  hasRequiredString = 1;
  const { assert, escapeRegex } = require$$0;
  const { isDomainValid, isEmailValid, ipRegex, uriRegex } = require$$1$1;
  const Tlds = require$$2;
  const Any = /* @__PURE__ */ requireAny();
  const Common = /* @__PURE__ */ requireCommon();
  const internals = {
    tlds: Tlds.tlds instanceof Set ? { tlds: { allow: Tlds.tlds, deny: null } } : false,
    // $lab:coverage:ignore$
    base64Regex: {
      // paddingRequired
      true: {
        // urlSafe
        true: /^(?:[\w\-]{2}[\w\-]{2})*(?:[\w\-]{2}==|[\w\-]{3}=)?$/,
        false: /^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/
      },
      false: {
        true: /^(?:[\w\-]{2}[\w\-]{2})*(?:[\w\-]{2}(==)?|[\w\-]{3}=?)?$/,
        false: /^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}(==)?|[A-Za-z0-9+\/]{3}=?)?$/
      }
    },
    dataUriRegex: /^data:[\w+.-]+\/[\w+.-]+;((charset=[\w-]+|base64),)?(.*)$/,
    hexRegex: {
      withPrefix: /^0x[0-9a-f]+$/i,
      withOptionalPrefix: /^(?:0x)?[0-9a-f]+$/i,
      withoutPrefix: /^[0-9a-f]+$/i
    },
    ipRegex: ipRegex({ cidr: "forbidden" }).regex,
    isoDurationRegex: /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/,
    guidBrackets: {
      "{": "}",
      "[": "]",
      "(": ")",
      "": ""
    },
    guidVersions: {
      uuidv1: "1",
      uuidv2: "2",
      uuidv3: "3",
      uuidv4: "4",
      uuidv5: "5",
      uuidv6: "6",
      uuidv7: "7",
      uuidv8: "8"
    },
    guidSeparators: /* @__PURE__ */ new Set([void 0, true, false, "-", ":"]),
    normalizationForms: ["NFC", "NFD", "NFKC", "NFKD"]
  };
  string = Any.extend({
    type: "string",
    flags: {
      insensitive: { default: false },
      truncate: { default: false }
    },
    terms: {
      replacements: { init: null }
    },
    coerce: {
      from: "string",
      method(value, { schema, state: state2, prefs }) {
        const normalize = schema.$_getRule("normalize");
        if (normalize) {
          value = value.normalize(normalize.args.form);
        }
        const casing = schema.$_getRule("case");
        if (casing) {
          value = casing.args.direction === "upper" ? value.toLocaleUpperCase() : value.toLocaleLowerCase();
        }
        const trim = schema.$_getRule("trim");
        if (trim && trim.args.enabled) {
          value = value.trim();
        }
        if (schema.$_terms.replacements) {
          for (const replacement of schema.$_terms.replacements) {
            value = value.replace(replacement.pattern, replacement.replacement);
          }
        }
        const hex = schema.$_getRule("hex");
        if (hex && hex.args.options.byteAligned && value.length % 2 !== 0) {
          value = `0${value}`;
        }
        if (schema.$_getRule("isoDate")) {
          const iso = internals.isoDate(value);
          if (iso) {
            value = iso;
          }
        }
        if (schema._flags.truncate) {
          const rule = schema.$_getRule("max");
          if (rule) {
            let limit = rule.args.limit;
            if (Common.isResolvable(limit)) {
              limit = limit.resolve(value, state2, prefs);
              if (!Common.limit(limit)) {
                return { value, errors: schema.$_createError("any.ref", limit, { ref: rule.args.limit, arg: "limit", reason: "must be a positive integer" }, state2, prefs) };
              }
            }
            value = value.slice(0, limit);
          }
        }
        return { value };
      }
    },
    validate(value, { schema, error }) {
      if (typeof value !== "string") {
        return { value, errors: error("string.base") };
      }
      if (value === "") {
        const min = schema.$_getRule("min");
        if (min && min.args.limit === 0) {
          return;
        }
        return { value, errors: error("string.empty") };
      }
    },
    rules: {
      alphanum: {
        method() {
          return this.$_addRule("alphanum");
        },
        validate(value, helpers) {
          if (/^[a-zA-Z0-9]+$/.test(value)) {
            return value;
          }
          return helpers.error("string.alphanum");
        }
      },
      base64: {
        method(options = {}) {
          Common.assertOptions(options, ["paddingRequired", "urlSafe"]);
          options = { urlSafe: false, paddingRequired: true, ...options };
          assert(typeof options.paddingRequired === "boolean", "paddingRequired must be boolean");
          assert(typeof options.urlSafe === "boolean", "urlSafe must be boolean");
          return this.$_addRule({ name: "base64", args: { options } });
        },
        validate(value, helpers, { options }) {
          const regex = internals.base64Regex[options.paddingRequired][options.urlSafe];
          if (regex.test(value)) {
            return value;
          }
          return helpers.error("string.base64");
        }
      },
      case: {
        method(direction) {
          assert(["lower", "upper"].includes(direction), "Invalid case:", direction);
          return this.$_addRule({ name: "case", args: { direction } });
        },
        validate(value, helpers, { direction }) {
          if (direction === "lower" && value === value.toLocaleLowerCase() || direction === "upper" && value === value.toLocaleUpperCase()) {
            return value;
          }
          return helpers.error(`string.${direction}case`);
        },
        convert: true
      },
      creditCard: {
        method() {
          return this.$_addRule("creditCard");
        },
        validate(value, helpers) {
          let i = value.length;
          let sum = 0;
          let mul = 1;
          while (i--) {
            const char = value.charAt(i) * mul;
            sum = sum + (char - (char > 9) * 9);
            mul = mul ^ 3;
          }
          if (sum > 0 && sum % 10 === 0) {
            return value;
          }
          return helpers.error("string.creditCard");
        }
      },
      dataUri: {
        method(options = {}) {
          Common.assertOptions(options, ["paddingRequired"]);
          options = { paddingRequired: true, ...options };
          assert(typeof options.paddingRequired === "boolean", "paddingRequired must be boolean");
          return this.$_addRule({ name: "dataUri", args: { options } });
        },
        validate(value, helpers, { options }) {
          const matches = value.match(internals.dataUriRegex);
          if (matches) {
            if (!matches[2]) {
              return value;
            }
            if (matches[2] !== "base64") {
              return value;
            }
            const base64regex = internals.base64Regex[options.paddingRequired].false;
            if (base64regex.test(matches[3])) {
              return value;
            }
          }
          return helpers.error("string.dataUri");
        }
      },
      domain: {
        method(options) {
          if (options) {
            Common.assertOptions(options, ["allowFullyQualified", "allowUnicode", "allowUnderscore", "maxDomainSegments", "minDomainSegments", "tlds"]);
          }
          const address = internals.addressOptions(options);
          return this.$_addRule({ name: "domain", args: { options }, address });
        },
        validate(value, helpers, args, { address }) {
          if (isDomainValid(value, address)) {
            return value;
          }
          return helpers.error("string.domain");
        }
      },
      email: {
        method(options = {}) {
          Common.assertOptions(options, ["allowFullyQualified", "allowUnicode", "ignoreLength", "maxDomainSegments", "minDomainSegments", "multiple", "separator", "tlds"]);
          assert(options.multiple === void 0 || typeof options.multiple === "boolean", "multiple option must be an boolean");
          const address = internals.addressOptions(options);
          const regex = new RegExp(`\\s*[${options.separator ? escapeRegex(options.separator) : ","}]\\s*`);
          return this.$_addRule({ name: "email", args: { options }, regex, address });
        },
        validate(value, helpers, { options }, { regex, address }) {
          const emails = options.multiple ? value.split(regex) : [value];
          const invalids = [];
          for (const email of emails) {
            if (!isEmailValid(email, address)) {
              invalids.push(email);
            }
          }
          if (!invalids.length) {
            return value;
          }
          return helpers.error("string.email", { value, invalids });
        }
      },
      guid: {
        alias: "uuid",
        method(options = {}) {
          Common.assertOptions(options, ["version", "separator", "wrapper"]);
          assert(
            options.wrapper === void 0 || typeof options.wrapper === "boolean" || typeof options.wrapper === "string" && typeof internals.guidBrackets[options.wrapper] === "string",
            `"wrapper" must be true, false, or one of "${Object.keys(internals.guidBrackets).filter(Boolean).join('", "')}"`
          );
          let versionNumbers = "";
          if (options.version) {
            const versions = [].concat(options.version);
            assert(versions.length >= 1, "version must have at least 1 valid version specified");
            const set = /* @__PURE__ */ new Set();
            for (let i = 0; i < versions.length; ++i) {
              const version2 = versions[i];
              assert(typeof version2 === "string", "version at position " + i + " must be a string");
              const versionNumber = internals.guidVersions[version2.toLowerCase()];
              assert(versionNumber, "version at position " + i + " must be one of " + Object.keys(internals.guidVersions).join(", "));
              assert(!set.has(versionNumber), "version at position " + i + " must not be a duplicate");
              versionNumbers += versionNumber;
              set.add(versionNumber);
            }
          }
          assert(internals.guidSeparators.has(options.separator), 'separator must be one of true, false, "-", or ":"');
          const separator = options.separator === void 0 ? "[:-]?" : options.separator === true ? "[:-]" : options.separator === false ? "[]?" : `\\${options.separator}`;
          let wrapperStart;
          let wrapperEnd;
          if (options.wrapper === void 0) {
            wrapperStart = "[\\[{\\(]?";
            wrapperEnd = "[\\]}\\)]?";
          } else if (options.wrapper === true) {
            wrapperStart = "[\\[{\\(]";
            wrapperEnd = "[\\]}\\)]";
          } else if (options.wrapper === false) {
            wrapperStart = "";
            wrapperEnd = "";
          } else {
            wrapperStart = escapeRegex(options.wrapper);
            wrapperEnd = escapeRegex(internals.guidBrackets[options.wrapper]);
          }
          const regex = new RegExp(
            `^(${wrapperStart})[0-9A-F]{8}(${separator})[0-9A-F]{4}\\2?[${versionNumbers || "0-9A-F"}][0-9A-F]{3}\\2?[${versionNumbers ? "89AB" : "0-9A-F"}][0-9A-F]{3}\\2?[0-9A-F]{12}(${wrapperEnd})$`,
            "i"
          );
          return this.$_addRule({ name: "guid", args: { options }, regex });
        },
        validate(value, helpers, args, { regex }) {
          const results = regex.exec(value);
          if (!results) {
            return helpers.error("string.guid");
          }
          const open = results[1];
          const close = results[results.length - 1];
          if ((open || close) && internals.guidBrackets[open] !== close) {
            return helpers.error("string.guid");
          }
          return value;
        }
      },
      hex: {
        method(options = {}) {
          Common.assertOptions(options, ["byteAligned", "prefix"]);
          options = { byteAligned: false, prefix: false, ...options };
          assert(typeof options.byteAligned === "boolean", "byteAligned must be boolean");
          assert(typeof options.prefix === "boolean" || options.prefix === "optional", 'prefix must be boolean or "optional"');
          return this.$_addRule({ name: "hex", args: { options } });
        },
        validate(value, helpers, { options }) {
          const re = options.prefix === "optional" ? internals.hexRegex.withOptionalPrefix : options.prefix === true ? internals.hexRegex.withPrefix : internals.hexRegex.withoutPrefix;
          if (!re.test(value)) {
            return helpers.error("string.hex");
          }
          if (options.byteAligned && value.length % 2 !== 0) {
            return helpers.error("string.hexAlign");
          }
          return value;
        }
      },
      hostname: {
        method() {
          return this.$_addRule("hostname");
        },
        validate(value, helpers) {
          if (isDomainValid(value, { minDomainSegments: 1 }) || internals.ipRegex.test(value)) {
            return value;
          }
          return helpers.error("string.hostname");
        }
      },
      insensitive: {
        method() {
          return this.$_setFlag("insensitive", true);
        }
      },
      ip: {
        method(options = {}) {
          Common.assertOptions(options, ["cidr", "version"]);
          const { cidr, versions, regex } = ipRegex(options);
          const version2 = options.version ? versions : void 0;
          return this.$_addRule({ name: "ip", args: { options: { cidr, version: version2 } }, regex });
        },
        validate(value, helpers, { options }, { regex }) {
          if (regex.test(value)) {
            return value;
          }
          if (options.version) {
            return helpers.error("string.ipVersion", { value, cidr: options.cidr, version: options.version });
          }
          return helpers.error("string.ip", { value, cidr: options.cidr });
        }
      },
      isoDate: {
        method() {
          return this.$_addRule("isoDate");
        },
        validate(value, { error }) {
          if (internals.isoDate(value)) {
            return value;
          }
          return error("string.isoDate");
        }
      },
      isoDuration: {
        method() {
          return this.$_addRule("isoDuration");
        },
        validate(value, helpers) {
          if (internals.isoDurationRegex.test(value)) {
            return value;
          }
          return helpers.error("string.isoDuration");
        }
      },
      length: {
        method(limit, encoding) {
          return internals.length(this, "length", limit, "=", encoding);
        },
        validate(value, helpers, { limit, encoding }, { name, operator, args }) {
          const length = encoding ? Buffer && Buffer.byteLength(value, encoding) : value.length;
          if (Common.compare(length, limit, operator)) {
            return value;
          }
          return helpers.error("string." + name, { limit: args.limit, value, encoding });
        },
        args: [
          {
            name: "limit",
            ref: true,
            assert: Common.limit,
            message: "must be a positive integer"
          },
          "encoding"
        ]
      },
      lowercase: {
        method() {
          return this.case("lower");
        }
      },
      max: {
        method(limit, encoding) {
          return internals.length(this, "max", limit, "<=", encoding);
        },
        args: ["limit", "encoding"]
      },
      min: {
        method(limit, encoding) {
          return internals.length(this, "min", limit, ">=", encoding);
        },
        args: ["limit", "encoding"]
      },
      normalize: {
        method(form = "NFC") {
          assert(internals.normalizationForms.includes(form), "normalization form must be one of " + internals.normalizationForms.join(", "));
          return this.$_addRule({ name: "normalize", args: { form } });
        },
        validate(value, { error }, { form }) {
          if (value === value.normalize(form)) {
            return value;
          }
          return error("string.normalize", { value, form });
        },
        convert: true
      },
      pattern: {
        alias: "regex",
        method(regex, options = {}) {
          assert(regex instanceof RegExp, "regex must be a RegExp");
          assert(!regex.flags.includes("g") && !regex.flags.includes("y"), "regex should not use global or sticky mode");
          if (typeof options === "string") {
            options = { name: options };
          }
          Common.assertOptions(options, ["invert", "name"]);
          const errorCode = ["string.pattern", options.invert ? ".invert" : "", options.name ? ".name" : ".base"].join("");
          return this.$_addRule({ name: "pattern", args: { regex, options }, errorCode });
        },
        validate(value, helpers, { regex, options }, { errorCode }) {
          const patternMatch = regex.test(value);
          if (patternMatch ^ options.invert) {
            return value;
          }
          return helpers.error(errorCode, { name: options.name, regex, value });
        },
        args: ["regex", "options"],
        multi: true
      },
      replace: {
        method(pattern, replacement) {
          if (typeof pattern === "string") {
            pattern = new RegExp(escapeRegex(pattern), "g");
          }
          assert(pattern instanceof RegExp, "pattern must be a RegExp");
          assert(typeof replacement === "string", "replacement must be a String");
          const obj = this.clone();
          if (!obj.$_terms.replacements) {
            obj.$_terms.replacements = [];
          }
          obj.$_terms.replacements.push({ pattern, replacement });
          return obj;
        }
      },
      token: {
        method() {
          return this.$_addRule("token");
        },
        validate(value, helpers) {
          if (/^\w+$/.test(value)) {
            return value;
          }
          return helpers.error("string.token");
        }
      },
      trim: {
        method(enabled = true) {
          assert(typeof enabled === "boolean", "enabled must be a boolean");
          return this.$_addRule({ name: "trim", args: { enabled } });
        },
        validate(value, helpers, { enabled }) {
          if (!enabled || value === value.trim()) {
            return value;
          }
          return helpers.error("string.trim");
        },
        convert: true
      },
      truncate: {
        method(enabled = true) {
          assert(typeof enabled === "boolean", "enabled must be a boolean");
          return this.$_setFlag("truncate", enabled);
        }
      },
      uppercase: {
        method() {
          return this.case("upper");
        }
      },
      uri: {
        method(options = {}) {
          Common.assertOptions(options, ["allowRelative", "allowQuerySquareBrackets", "domain", "relativeOnly", "scheme", "encodeUri"]);
          if (options.domain) {
            Common.assertOptions(options.domain, ["allowFullyQualified", "allowUnicode", "maxDomainSegments", "minDomainSegments", "tlds"]);
          }
          const { regex, scheme } = uriRegex(options);
          const domain = options.domain ? internals.addressOptions(options.domain) : null;
          return this.$_addRule({ name: "uri", args: { options }, regex, domain, scheme });
        },
        validate(value, helpers, { options }, { regex, domain, scheme }) {
          if (["http:/", "https:/"].includes(value)) {
            return helpers.error("string.uri");
          }
          let match = regex.exec(value);
          if (!match && helpers.prefs.convert && options.encodeUri) {
            const encoded = encodeURI(value);
            match = regex.exec(encoded);
            if (match) {
              value = encoded;
            }
          }
          if (match) {
            const matched = match[1] || match[2];
            if (domain && (!options.allowRelative || matched) && !isDomainValid(matched, domain)) {
              return helpers.error("string.domain", { value: matched });
            }
            return value;
          }
          if (options.relativeOnly) {
            return helpers.error("string.uriRelativeOnly");
          }
          if (options.scheme) {
            return helpers.error("string.uriCustomScheme", { scheme, value });
          }
          return helpers.error("string.uri");
        }
      }
    },
    manifest: {
      build(obj, desc) {
        if (desc.replacements) {
          for (const { pattern, replacement } of desc.replacements) {
            obj = obj.replace(pattern, replacement);
          }
        }
        return obj;
      }
    },
    messages: {
      "string.alphanum": "{{#label}} must only contain alpha-numeric characters",
      "string.base": "{{#label}} must be a string",
      "string.base64": "{{#label}} must be a valid base64 string",
      "string.creditCard": "{{#label}} must be a credit card",
      "string.dataUri": "{{#label}} must be a valid dataUri string",
      "string.domain": "{{#label}} must contain a valid domain name",
      "string.email": "{{#label}} must be a valid email",
      "string.empty": "{{#label}} is not allowed to be empty",
      "string.guid": "{{#label}} must be a valid GUID",
      "string.hex": "{{#label}} must only contain hexadecimal characters",
      "string.hexAlign": "{{#label}} hex decoded representation must be byte aligned",
      "string.hostname": "{{#label}} must be a valid hostname",
      "string.ip": "{{#label}} must be a valid ip address with a {{#cidr}} CIDR",
      "string.ipVersion": "{{#label}} must be a valid ip address of one of the following versions {{#version}} with a {{#cidr}} CIDR",
      "string.isoDate": "{{#label}} must be in iso format",
      "string.isoDuration": "{{#label}} must be a valid ISO 8601 duration",
      "string.length": "{{#label}} length must be {{#limit}} characters long",
      "string.lowercase": "{{#label}} must only contain lowercase characters",
      "string.max": "{{#label}} length must be less than or equal to {{#limit}} characters long",
      "string.min": "{{#label}} length must be at least {{#limit}} characters long",
      "string.normalize": "{{#label}} must be unicode normalized in the {{#form}} form",
      "string.token": "{{#label}} must only contain alpha-numeric and underscore characters",
      "string.pattern.base": "{{#label}} with value {:[.]} fails to match the required pattern: {{#regex}}",
      "string.pattern.name": "{{#label}} with value {:[.]} fails to match the {{#name}} pattern",
      "string.pattern.invert.base": "{{#label}} with value {:[.]} matches the inverted pattern: {{#regex}}",
      "string.pattern.invert.name": "{{#label}} with value {:[.]} matches the inverted {{#name}} pattern",
      "string.trim": "{{#label}} must not have leading or trailing whitespace",
      "string.uri": "{{#label}} must be a valid uri",
      "string.uriCustomScheme": "{{#label}} must be a valid uri with a scheme matching the {{#scheme}} pattern",
      "string.uriRelativeOnly": "{{#label}} must be a valid relative uri",
      "string.uppercase": "{{#label}} must only contain uppercase characters"
    }
  });
  internals.addressOptions = function(options) {
    if (!options) {
      return internals.tlds || options;
    }
    assert(options.minDomainSegments === void 0 || Number.isSafeInteger(options.minDomainSegments) && options.minDomainSegments > 0, "minDomainSegments must be a positive integer");
    assert(options.maxDomainSegments === void 0 || Number.isSafeInteger(options.maxDomainSegments) && options.maxDomainSegments > 0, "maxDomainSegments must be a positive integer");
    if (options.tlds === false) {
      return options;
    }
    if (options.tlds === true || options.tlds === void 0) {
      assert(internals.tlds, "Built-in TLD list disabled");
      return Object.assign({}, options, internals.tlds);
    }
    assert(typeof options.tlds === "object", "tlds must be true, false, or an object");
    const deny = options.tlds.deny;
    if (deny) {
      if (Array.isArray(deny)) {
        options = Object.assign({}, options, { tlds: { deny: new Set(deny) } });
      }
      assert(options.tlds.deny instanceof Set, "tlds.deny must be an array, Set, or boolean");
      assert(!options.tlds.allow, "Cannot specify both tlds.allow and tlds.deny lists");
      internals.validateTlds(options.tlds.deny, "tlds.deny");
      return options;
    }
    const allow = options.tlds.allow;
    if (!allow) {
      return { ...options, tlds: false };
    }
    if (allow === true) {
      assert(internals.tlds, "Built-in TLD list disabled");
      return Object.assign({}, options, internals.tlds);
    }
    if (Array.isArray(allow)) {
      options = Object.assign({}, options, { tlds: { allow: new Set(allow) } });
    }
    assert(options.tlds.allow instanceof Set, "tlds.allow must be an array, Set, or boolean");
    internals.validateTlds(options.tlds.allow, "tlds.allow");
    return options;
  };
  internals.validateTlds = function(set, source) {
    for (const tld of set) {
      assert(isDomainValid(tld, { minDomainSegments: 1, maxDomainSegments: 1 }), `${source} must contain valid top level domain names`);
    }
  };
  internals.isoDate = function(value) {
    if (!Common.isIsoDate(value)) {
      return null;
    }
    if (/.*T.*[+-]\d\d$/.test(value)) {
      value += "00";
    }
    const date2 = new Date(value);
    if (isNaN(date2.getTime())) {
      return null;
    }
    return date2.toISOString();
  };
  internals.length = function(schema, name, limit, operator, encoding) {
    assert(!encoding || Buffer && Buffer.isEncoding(encoding), "Invalid encoding:", encoding);
    return schema.$_addRule({ name, method: "length", args: { limit, encoding }, operator });
  };
  return string;
}
var symbol;
var hasRequiredSymbol;
function requireSymbol() {
  if (hasRequiredSymbol) return symbol;
  hasRequiredSymbol = 1;
  const { assert } = require$$0;
  const Any = /* @__PURE__ */ requireAny();
  const internals = {};
  internals.Map = class extends Map {
    slice() {
      return new internals.Map(this);
    }
  };
  symbol = Any.extend({
    type: "symbol",
    terms: {
      map: { init: new internals.Map() }
    },
    coerce: {
      method(value, { schema, error }) {
        const lookup = schema.$_terms.map.get(value);
        if (lookup) {
          value = lookup;
        }
        if (!schema._flags.only || typeof value === "symbol") {
          return { value };
        }
        return { value, errors: error("symbol.map", { map: schema.$_terms.map }) };
      }
    },
    validate(value, { error }) {
      if (typeof value !== "symbol") {
        return { value, errors: error("symbol.base") };
      }
    },
    rules: {
      map: {
        method(iterable) {
          if (iterable && !iterable[Symbol.iterator] && typeof iterable === "object") {
            iterable = Object.entries(iterable);
          }
          assert(iterable && iterable[Symbol.iterator], "Iterable must be an iterable or object");
          const obj = this.clone();
          const symbols = [];
          for (const entry of iterable) {
            assert(entry && entry[Symbol.iterator], "Entry must be an iterable");
            const [key, value] = entry;
            assert(typeof key !== "object" && typeof key !== "function" && typeof key !== "symbol", "Key must not be of type object, function, or Symbol");
            assert(typeof value === "symbol", "Value must be a Symbol");
            obj.$_terms.map.set(key, value);
            symbols.push(value);
          }
          return obj.valid(...symbols);
        }
      }
    },
    manifest: {
      build(obj, desc) {
        if (desc.map) {
          obj = obj.map(desc.map);
        }
        return obj;
      }
    },
    messages: {
      "symbol.base": "{{#label}} must be a symbol",
      "symbol.map": "{{#label}} must be one of {{#map}}"
    }
  });
  return symbol;
}
var binary;
var hasRequiredBinary;
function requireBinary() {
  if (hasRequiredBinary) return binary;
  hasRequiredBinary = 1;
  const { assert } = require$$0;
  const Any = /* @__PURE__ */ requireAny();
  const Common = /* @__PURE__ */ requireCommon();
  binary = Any.extend({
    type: "binary",
    coerce: {
      from: ["string", "object"],
      method(value, { schema }) {
        if (typeof value === "string" || value !== null && value.type === "Buffer") {
          try {
            return { value: Buffer.from(value, schema._flags.encoding) };
          } catch {
          }
        }
      }
    },
    validate(value, { error }) {
      if (!Buffer.isBuffer(value)) {
        return { value, errors: error("binary.base") };
      }
    },
    rules: {
      encoding: {
        method(encoding) {
          assert(Buffer.isEncoding(encoding), "Invalid encoding:", encoding);
          return this.$_setFlag("encoding", encoding);
        }
      },
      length: {
        method(limit) {
          return this.$_addRule({ name: "length", method: "length", args: { limit }, operator: "=" });
        },
        validate(value, helpers, { limit }, { name, operator, args }) {
          if (Common.compare(value.length, limit, operator)) {
            return value;
          }
          return helpers.error("binary." + name, { limit: args.limit, value });
        },
        args: [
          {
            name: "limit",
            ref: true,
            assert: Common.limit,
            message: "must be a positive integer"
          }
        ]
      },
      max: {
        method(limit) {
          return this.$_addRule({ name: "max", method: "length", args: { limit }, operator: "<=" });
        }
      },
      min: {
        method(limit) {
          return this.$_addRule({ name: "min", method: "length", args: { limit }, operator: ">=" });
        }
      }
    },
    cast: {
      string: {
        from: (value) => Buffer.isBuffer(value),
        to(value, helpers) {
          return value.toString();
        }
      }
    },
    messages: {
      "binary.base": "{{#label}} must be a buffer or a string",
      "binary.length": "{{#label}} must be {{#limit}} bytes",
      "binary.max": "{{#label}} must be less than or equal to {{#limit}} bytes",
      "binary.min": "{{#label}} must be at least {{#limit}} bytes"
    }
  });
  return binary;
}
var lib;
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib;
  hasRequiredLib = 1;
  const { assert, clone } = require$$0;
  const Cache = /* @__PURE__ */ requireCache();
  const Common = /* @__PURE__ */ requireCommon();
  const Compile = /* @__PURE__ */ requireCompile();
  const Errors = /* @__PURE__ */ requireErrors();
  const Extend = /* @__PURE__ */ requireExtend();
  const Manifest = /* @__PURE__ */ requireManifest();
  const Ref = /* @__PURE__ */ requireRef();
  const Template = /* @__PURE__ */ requireTemplate();
  const Trace = /* @__PURE__ */ requireTrace();
  let Schemas;
  const internals = {
    types: {
      alternatives: /* @__PURE__ */ requireAlternatives(),
      any: /* @__PURE__ */ requireAny(),
      array: /* @__PURE__ */ requireArray(),
      boolean: /* @__PURE__ */ requireBoolean(),
      date: /* @__PURE__ */ requireDate(),
      function: /* @__PURE__ */ require_function(),
      link: /* @__PURE__ */ requireLink(),
      number: /* @__PURE__ */ requireNumber(),
      object: /* @__PURE__ */ requireObject(),
      string: /* @__PURE__ */ requireString(),
      symbol: /* @__PURE__ */ requireSymbol()
    },
    aliases: {
      alt: "alternatives",
      bool: "boolean",
      func: "function"
    }
  };
  if (Buffer) {
    internals.types.binary = /* @__PURE__ */ requireBinary();
  }
  internals.root = function() {
    const root = {
      _types: new Set(Object.keys(internals.types))
    };
    for (const type of root._types) {
      root[type] = function(...args) {
        assert(!args.length || ["alternatives", "link", "object"].includes(type), "The", type, "type does not allow arguments");
        return internals.generate(this, internals.types[type], args);
      };
    }
    for (const method of ["allow", "custom", "disallow", "equal", "exist", "forbidden", "invalid", "not", "only", "optional", "options", "prefs", "preferences", "required", "strip", "valid", "when"]) {
      root[method] = function(...args) {
        return this.any()[method](...args);
      };
    }
    Object.assign(root, internals.methods);
    for (const alias in internals.aliases) {
      const target = internals.aliases[alias];
      root[alias] = root[target];
    }
    root.x = root.expression;
    if (Trace.setup) {
      Trace.setup(root);
    }
    return root;
  };
  internals.methods = {
    ValidationError: Errors.ValidationError,
    version: Common.version,
    cache: Cache.provider,
    assert(value, schema, ...args) {
      internals.assert(value, schema, true, args);
    },
    attempt(value, schema, ...args) {
      return internals.assert(value, schema, false, args);
    },
    build(desc) {
      assert(typeof Manifest.build === "function", "Manifest functionality disabled");
      return Manifest.build(this, desc);
    },
    checkPreferences(prefs) {
      Common.checkPreferences(prefs);
    },
    compile(schema, options) {
      return Compile.compile(this, schema, options);
    },
    defaults(modifier) {
      assert(typeof modifier === "function", "modifier must be a function");
      const joi = Object.assign({}, this);
      for (const type of joi._types) {
        const schema = modifier(joi[type]());
        assert(Common.isSchema(schema), "modifier must return a valid schema object");
        joi[type] = function(...args) {
          return internals.generate(this, schema, args);
        };
      }
      return joi;
    },
    expression(...args) {
      return new Template(...args);
    },
    extend(...extensions) {
      Common.verifyFlat(extensions, "extend");
      Schemas = Schemas || /* @__PURE__ */ requireSchemas();
      assert(extensions.length, "You need to provide at least one extension");
      this.assert(extensions, Schemas.extensions);
      const joi = Object.assign({}, this);
      joi._types = new Set(joi._types);
      for (let extension of extensions) {
        if (typeof extension === "function") {
          extension = extension(joi);
        }
        this.assert(extension, Schemas.extension);
        const expanded = internals.expandExtension(extension, joi);
        for (const item of expanded) {
          assert(joi[item.type] === void 0 || joi._types.has(item.type), "Cannot override name", item.type);
          const base2 = item.base || this.any();
          const schema = Extend.type(base2, item);
          joi._types.add(item.type);
          joi[item.type] = function(...args) {
            return internals.generate(this, schema, args);
          };
        }
      }
      return joi;
    },
    isError: Errors.ValidationError.isError,
    isExpression: Template.isTemplate,
    isRef: Ref.isRef,
    isSchema: Common.isSchema,
    in(...args) {
      return Ref.in(...args);
    },
    override: Common.symbols.override,
    ref(...args) {
      return Ref.create(...args);
    },
    types() {
      const types = {};
      for (const type of this._types) {
        types[type] = this[type]();
      }
      for (const target in internals.aliases) {
        types[target] = this[target]();
      }
      return types;
    }
  };
  internals.assert = function(value, schema, annotate2, args) {
    const message = args[0] instanceof Error || typeof args[0] === "string" ? args[0] : null;
    const options = message !== null ? args[1] : args[0];
    const result = schema.validate(value, Common.preferences({ errors: { stack: true } }, options || {}));
    let error = result.error;
    if (!error) {
      return result.value;
    }
    if (message instanceof Error) {
      throw message;
    }
    const display = annotate2 && typeof error.annotate === "function" ? error.annotate() : error.message;
    if (error instanceof Errors.ValidationError === false) {
      error = clone(error);
    }
    error.message = message ? `${message} ${display}` : display;
    throw error;
  };
  internals.generate = function(root, schema, args) {
    assert(root, "Must be invoked on a Joi instance.");
    schema.$_root = root;
    if (!schema._definition.args || !args.length) {
      return schema;
    }
    return schema._definition.args(schema, ...args);
  };
  internals.expandExtension = function(extension, joi) {
    if (typeof extension.type === "string") {
      return [extension];
    }
    const extended = [];
    for (const type of joi._types) {
      if (extension.type.test(type)) {
        const item = Object.assign({}, extension);
        item.type = type;
        item.base = joi[type]();
        extended.push(item);
      }
    }
    return extended;
  };
  lib = internals.root();
  return lib;
}
var libExports = /* @__PURE__ */ requireLib();
const Joi = /* @__PURE__ */ getDefaultExportFromCjs(libExports);
export {
  Joi as J
};
