import { c as getAugmentedNamespace } from "../react.mjs";
import * as Url from "url";
import * as require$$0 from "util";
import { a as assert, e as escapeRegex } from "./hoek.mjs";
const errorCodes = {
  EMPTY_STRING: "Address must be a non-empty string",
  FORBIDDEN_UNICODE: "Address contains forbidden Unicode characters",
  MULTIPLE_AT_CHAR: "Address cannot contain more than one @ character",
  MISSING_AT_CHAR: "Address must contain one @ character",
  EMPTY_LOCAL: "Address local part cannot be empty",
  ADDRESS_TOO_LONG: "Address too long",
  LOCAL_TOO_LONG: "Address local part too long",
  EMPTY_LOCAL_SEGMENT: "Address local part contains empty dot-separated segment",
  INVALID_LOCAL_CHARS: "Address local part contains invalid character",
  DOMAIN_NON_EMPTY_STRING: "Domain must be a non-empty string",
  DOMAIN_TOO_LONG: "Domain too long",
  DOMAIN_INVALID_UNICODE_CHARS: "Domain contains forbidden Unicode characters",
  DOMAIN_INVALID_CHARS: "Domain contains invalid character",
  DOMAIN_INVALID_TLDS_CHARS: "Domain contains invalid tld character",
  DOMAIN_SEGMENTS_COUNT: "Domain lacks the minimum required number of segments",
  DOMAIN_SEGMENTS_COUNT_MAX: "Domain contains too many segments",
  DOMAIN_FORBIDDEN_TLDS: "Domain uses forbidden TLD",
  DOMAIN_EMPTY_SEGMENT: "Domain contains empty dot-separated segment",
  DOMAIN_LONG_SEGMENT: "Domain contains dot-separated segment that is too long"
};
function errorCode(code) {
  return { code, error: errorCodes[code] };
}
const MIN_DOMAIN_SEGMENTS = 2;
const NON_ASCII_RX$1 = /[^\x00-\x7f]/;
const DOMAIN_CONTROL_RX = /[\x00-\x20@\:\/\\#!\$&\'\(\)\*\+,;=\?]/;
const TLD_SEGMENT_RX = /^[a-zA-Z](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?$/;
const DOMAIN_SEGMENT_RX = /^[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?$/;
const DOMAIN_UNDERSCORE_SEGMENT_RX = /^[a-zA-Z0-9_](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?$/;
const URL_IMPL = Url.URL || URL;
function isTldsAllow(tlds) {
  return !!tlds.allow;
}
function analyzeDomain(domain, options = {}) {
  if (!domain) {
    return errorCode("DOMAIN_NON_EMPTY_STRING");
  }
  if (typeof domain !== "string") {
    throw new Error("Invalid input: domain must be a string");
  }
  if (domain.length > 256) {
    return errorCode("DOMAIN_TOO_LONG");
  }
  const ascii = !NON_ASCII_RX$1.test(domain);
  if (!ascii) {
    if (options.allowUnicode === false) {
      return errorCode("DOMAIN_INVALID_UNICODE_CHARS");
    }
    domain = domain.normalize("NFC");
  }
  if (DOMAIN_CONTROL_RX.test(domain)) {
    return errorCode("DOMAIN_INVALID_CHARS");
  }
  domain = punycode(domain);
  if (options.allowFullyQualified && domain[domain.length - 1] === ".") {
    domain = domain.slice(0, -1);
  }
  const minDomainSegments = options.minDomainSegments || MIN_DOMAIN_SEGMENTS;
  const segments = domain.split(".");
  if (segments.length < minDomainSegments) {
    return errorCode("DOMAIN_SEGMENTS_COUNT");
  }
  if (options.maxDomainSegments) {
    if (segments.length > options.maxDomainSegments) {
      return errorCode("DOMAIN_SEGMENTS_COUNT_MAX");
    }
  }
  const tlds = options.tlds;
  if (tlds) {
    const tld = segments[segments.length - 1].toLowerCase();
    if (isTldsAllow(tlds)) {
      if (!tlds.allow.has(tld)) {
        return errorCode("DOMAIN_FORBIDDEN_TLDS");
      }
    } else if (tlds.deny.has(tld)) {
      return errorCode("DOMAIN_FORBIDDEN_TLDS");
    }
  }
  for (let i = 0; i < segments.length; ++i) {
    const segment = segments[i];
    if (!segment.length) {
      return errorCode("DOMAIN_EMPTY_SEGMENT");
    }
    if (segment.length > 63) {
      return errorCode("DOMAIN_LONG_SEGMENT");
    }
    if (i < segments.length - 1) {
      if (options.allowUnderscore) {
        if (!DOMAIN_UNDERSCORE_SEGMENT_RX.test(segment)) {
          return errorCode("DOMAIN_INVALID_CHARS");
        }
      } else {
        if (!DOMAIN_SEGMENT_RX.test(segment)) {
          return errorCode("DOMAIN_INVALID_CHARS");
        }
      }
    } else {
      if (!TLD_SEGMENT_RX.test(segment)) {
        return errorCode("DOMAIN_INVALID_TLDS_CHARS");
      }
    }
  }
  return null;
}
function isDomainValid(domain, options) {
  return !analyzeDomain(domain, options);
}
function punycode(domain) {
  if (domain.includes("%")) {
    domain = domain.replace(/%/g, "%25");
  }
  try {
    return new URL_IMPL(`http://${domain}`).host;
  } catch (err) {
    return domain;
  }
}
function validateDomainOptions(options) {
  if (!options) {
    return;
  }
  if (typeof options.tlds !== "object") {
    throw new Error("Invalid options: tlds must be a boolean or an object");
  }
  if (isTldsAllow(options.tlds)) {
    if (options.tlds.allow instanceof Set === false) {
      throw new Error("Invalid options: tlds.allow must be a Set object or true");
    }
    if (options.tlds.deny) {
      throw new Error("Invalid options: cannot specify both tlds.allow and tlds.deny lists");
    }
  } else {
    if (options.tlds.deny instanceof Set === false) {
      throw new Error("Invalid options: tlds.deny must be a Set object");
    }
  }
}
const NON_ASCII_RX = /[^\x00-\x7f]/;
const ENCODER_IMPL = new (require$$0.TextEncoder || TextEncoder)();
function analyzeEmail(email, options) {
  return validateEmail(email, options);
}
function isEmailValid(email, options) {
  return !validateEmail(email, options);
}
function validateEmail(email, options = {}) {
  if (typeof email !== "string") {
    throw new Error("Invalid input: email must be a string");
  }
  if (!email) {
    return errorCode("EMPTY_STRING");
  }
  const ascii = !NON_ASCII_RX.test(email);
  if (!ascii) {
    if (options.allowUnicode === false) {
      return errorCode("FORBIDDEN_UNICODE");
    }
    email = email.normalize("NFC");
  }
  const parts = email.split("@");
  if (parts.length !== 2) {
    return parts.length > 2 ? errorCode("MULTIPLE_AT_CHAR") : errorCode("MISSING_AT_CHAR");
  }
  const [local, domain] = parts;
  if (!local) {
    return errorCode("EMPTY_LOCAL");
  }
  if (!options.ignoreLength) {
    if (email.length > 254) {
      return errorCode("ADDRESS_TOO_LONG");
    }
    if (ENCODER_IMPL.encode(local).length > 64) {
      return errorCode("LOCAL_TOO_LONG");
    }
  }
  return validateLocal(local, ascii) || analyzeDomain(domain, options);
}
function validateLocal(local, ascii) {
  const segments = local.split(".");
  for (const segment of segments) {
    if (!segment.length) {
      return errorCode("EMPTY_LOCAL_SEGMENT");
    }
    if (ascii) {
      if (!ATEXT_RX.test(segment)) {
        return errorCode("INVALID_LOCAL_CHARS");
      }
      continue;
    }
    for (const char of segment) {
      if (ATEXT_RX.test(char)) {
        continue;
      }
      const binary = toBinary(char);
      if (!ATOM_RX.test(binary)) {
        return errorCode("INVALID_LOCAL_CHARS");
      }
    }
  }
  return null;
}
function toBinary(char) {
  return Array.from(ENCODER_IMPL.encode(char), (v) => String.fromCharCode(v)).join("");
}
const ATEXT_RX = /^[\w!#\$%&'\*\+\-/=\?\^`\{\|\}~]+$/;
const ATOM_RX = new RegExp([
  //  %xC2-DF UTF8-tail
  "(?:[\\xc2-\\xdf][\\x80-\\xbf])",
  //  %xE0 %xA0-BF UTF8-tail              %xE1-EC 2( UTF8-tail )            %xED %x80-9F UTF8-tail              %xEE-EF 2( UTF8-tail )
  "(?:\\xe0[\\xa0-\\xbf][\\x80-\\xbf])|(?:[\\xe1-\\xec][\\x80-\\xbf]{2})|(?:\\xed[\\x80-\\x9f][\\x80-\\xbf])|(?:[\\xee-\\xef][\\x80-\\xbf]{2})",
  //  %xF0 %x90-BF 2( UTF8-tail )            %xF1-F3 3( UTF8-tail )            %xF4 %x80-8F 2( UTF8-tail )
  "(?:\\xf0[\\x90-\\xbf][\\x80-\\xbf]{2})|(?:[\\xf1-\\xf3][\\x80-\\xbf]{3})|(?:\\xf4[\\x80-\\x8f][\\x80-\\xbf]{2})"
].join("|"));
function generate() {
  const rfc39862 = {};
  const hexDigit = "\\dA-Fa-f";
  const hexDigitOnly = "[" + hexDigit + "]";
  const unreserved = "\\w-\\.~";
  const subDelims = "!\\$&'\\(\\)\\*\\+,;=";
  const pctEncoded = "%" + hexDigit;
  const pchar = unreserved + pctEncoded + subDelims + ":@";
  const pcharOnly = "[" + pchar + "]";
  const decOctect = "(?:0{0,2}\\d|0?[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])";
  rfc39862.ipv4address = "(?:" + decOctect + "\\.){3}" + decOctect;
  const h16 = hexDigitOnly + "{1,4}";
  const ls32 = "(?:" + h16 + ":" + h16 + "|" + rfc39862.ipv4address + ")";
  const IPv6SixHex = "(?:" + h16 + ":){6}" + ls32;
  const IPv6FiveHex = "::(?:" + h16 + ":){5}" + ls32;
  const IPv6FourHex = "(?:" + h16 + ")?::(?:" + h16 + ":){4}" + ls32;
  const IPv6ThreeHex = "(?:(?:" + h16 + ":){0,1}" + h16 + ")?::(?:" + h16 + ":){3}" + ls32;
  const IPv6TwoHex = "(?:(?:" + h16 + ":){0,2}" + h16 + ")?::(?:" + h16 + ":){2}" + ls32;
  const IPv6OneHex = "(?:(?:" + h16 + ":){0,3}" + h16 + ")?::" + h16 + ":" + ls32;
  const IPv6NoneHex = "(?:(?:" + h16 + ":){0,4}" + h16 + ")?::" + ls32;
  const IPv6NoneHex2 = "(?:(?:" + h16 + ":){0,5}" + h16 + ")?::" + h16;
  const IPv6NoneHex3 = "(?:(?:" + h16 + ":){0,6}" + h16 + ")?::";
  rfc39862.ipv4Cidr = "(?:\\d|[1-2]\\d|3[0-2])";
  rfc39862.ipv6Cidr = "(?:0{0,2}\\d|0?[1-9]\\d|1[01]\\d|12[0-8])";
  rfc39862.ipv6address = "(?:" + IPv6SixHex + "|" + IPv6FiveHex + "|" + IPv6FourHex + "|" + IPv6ThreeHex + "|" + IPv6TwoHex + "|" + IPv6OneHex + "|" + IPv6NoneHex + "|" + IPv6NoneHex2 + "|" + IPv6NoneHex3 + ")";
  rfc39862.ipvFuture = "v" + hexDigitOnly + "+\\.[" + unreserved + subDelims + ":]+";
  rfc39862.scheme = "[a-zA-Z][a-zA-Z\\d+-\\.]*";
  rfc39862.schemeRegex = new RegExp(rfc39862.scheme);
  const userinfo = "[" + unreserved + pctEncoded + subDelims + ":]*";
  const IPLiteral = "\\[(?:" + rfc39862.ipv6address + "|" + rfc39862.ipvFuture + ")\\]";
  const regName = "[" + unreserved + pctEncoded + subDelims + "]{1,255}";
  const host = "(?:" + IPLiteral + "|" + rfc39862.ipv4address + "|" + regName + ")";
  const port = "\\d*";
  const authority = "(?:" + userinfo + "@)?" + host + "(?::" + port + ")?";
  const authorityCapture = "(?:" + userinfo + "@)?(" + host + ")(?::" + port + ")?";
  const segment = pcharOnly + "*";
  const segmentNz = pcharOnly + "+";
  const segmentNzNc = "[" + unreserved + pctEncoded + subDelims + "@]+";
  const pathEmpty = "";
  const pathAbEmpty = "(?:\\/" + segment + ")*";
  const pathAbsolute = "\\/(?:" + segmentNz + pathAbEmpty + ")?";
  const pathRootless = segmentNz + pathAbEmpty;
  const pathNoScheme = segmentNzNc + pathAbEmpty;
  const pathAbNoAuthority = "(?:\\/\\/\\/" + segment + pathAbEmpty + ")";
  rfc39862.hierPart = "(?:(?:\\/\\/" + authority + pathAbEmpty + ")|" + pathAbsolute + "|" + pathRootless + "|" + pathAbNoAuthority + ")";
  rfc39862.hierPartCapture = "(?:(?:\\/\\/" + authorityCapture + pathAbEmpty + ")|" + pathAbsolute + "|" + pathRootless + ")";
  rfc39862.relativeRef = "(?:(?:\\/\\/" + authority + pathAbEmpty + ")|" + pathAbsolute + "|" + pathNoScheme + "|" + pathEmpty + ")";
  rfc39862.relativeRefCapture = "(?:(?:\\/\\/" + authorityCapture + pathAbEmpty + ")|" + pathAbsolute + "|" + pathNoScheme + "|" + pathEmpty + ")";
  rfc39862.query = "[" + pchar + "\\/\\?]*(?=#|$)";
  rfc39862.queryWithSquareBrackets = "[" + pchar + "\\[\\]\\/\\?]*(?=#|$)";
  rfc39862.fragment = "[" + pchar + "\\/\\?]*";
  return rfc39862;
}
const rfc3986 = generate();
const ipVersions = {
  v4Cidr: rfc3986.ipv4Cidr,
  v6Cidr: rfc3986.ipv6Cidr,
  ipv4: rfc3986.ipv4address,
  ipv6: rfc3986.ipv6address,
  ipvfuture: rfc3986.ipvFuture
};
function createRegex(options) {
  const rfc = rfc3986;
  const query = options.allowQuerySquareBrackets ? rfc.queryWithSquareBrackets : rfc.query;
  const suffix = "(?:\\?" + query + ")?(?:#" + rfc.fragment + ")?";
  const relative = options.domain ? rfc.relativeRefCapture : rfc.relativeRef;
  if (options.relativeOnly) {
    return wrap(relative + suffix);
  }
  let customScheme = "";
  if (options.scheme) {
    assert(options.scheme instanceof RegExp || typeof options.scheme === "string" || Array.isArray(options.scheme), "scheme must be a RegExp, String, or Array");
    const schemes = [].concat(options.scheme);
    assert(schemes.length >= 1, "scheme must have at least 1 scheme specified");
    const selections = [];
    for (let i = 0; i < schemes.length; ++i) {
      const scheme2 = schemes[i];
      assert(scheme2 instanceof RegExp || typeof scheme2 === "string", "scheme at position " + i + " must be a RegExp or String");
      if (scheme2 instanceof RegExp) {
        selections.push(scheme2.source.toString());
      } else {
        assert(rfc.schemeRegex.test(scheme2), "scheme at position " + i + " must be a valid scheme");
        selections.push(escapeRegex(scheme2));
      }
    }
    customScheme = selections.join("|");
  }
  const scheme = customScheme ? "(?:" + customScheme + ")" : rfc.scheme;
  const absolute = "(?:" + scheme + ":" + (options.domain ? rfc.hierPartCapture : rfc.hierPart) + ")";
  const prefix = options.allowRelative ? "(?:" + absolute + "|" + relative + ")" : absolute;
  return wrap(prefix + suffix, customScheme);
}
function wrap(raw, scheme = null) {
  raw = `(?=.)(?!https?:/(?:$|[^/]))(?!https?:///)(?!https?:[^/])${raw}`;
  return {
    raw,
    regex: new RegExp(`^${raw}$`),
    scheme
  };
}
const genericUriRegex = createRegex({});
function uriRegex(options = {}) {
  if (options.scheme || options.allowRelative || options.relativeOnly || options.allowQuerySquareBrackets || options.domain) {
    return createRegex(options);
  }
  return genericUriRegex;
}
function ipRegex(options = {}) {
  const cidr = options.cidr || "optional";
  assert(["required", "optional", "forbidden"].includes(cidr), "options.cidr must be one of required, optional, forbidden");
  assert(options.version === void 0 || typeof options.version === "string" || Array.isArray(options.version), "options.version must be a string or an array of string");
  let versions = options.version || ["ipv4", "ipv6", "ipvfuture"];
  if (!Array.isArray(versions)) {
    versions = [versions];
  }
  assert(versions.length >= 1, "options.version must have at least 1 version specified");
  for (const version of versions) {
    assert(typeof version === "string" && version === version.toLowerCase(), "Invalid options.version value");
    assert(["ipv4", "ipv6", "ipvfuture"].includes(version), "options.version contains unknown version " + version + " - must be one of ipv4, ipv6, ipvfuture");
  }
  versions = Array.from(new Set(versions));
  const parts = versions.map((version) => {
    if (cidr === "forbidden") {
      return ipVersions[version];
    }
    const cidrpart = `\\/${version === "ipv4" ? ipVersions.v4Cidr : ipVersions.v6Cidr}`;
    if (cidr === "required") {
      return `${ipVersions[version]}${cidrpart}`;
    }
    return `${ipVersions[version]}(?:${cidrpart})?`;
  });
  const raw = `(?:${parts.join("|")})`;
  const regex = new RegExp(`^${raw}$`);
  return { cidr, versions, regex, raw };
}
const HEX = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  a: 10,
  A: 10,
  b: 11,
  B: 11,
  c: 12,
  C: 12,
  d: 13,
  D: 13,
  e: 14,
  E: 14,
  f: 15,
  F: 15
};
const UTF8 = {
  accept: 12,
  reject: 0,
  data: [
    // Maps bytes to character to a transition
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    4,
    4,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    6,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    8,
    7,
    7,
    10,
    9,
    9,
    9,
    11,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    // Maps a state to a new state when adding a transition
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    0,
    24,
    36,
    48,
    60,
    72,
    84,
    96,
    0,
    12,
    12,
    12,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    24,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    24,
    24,
    24,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    24,
    24,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    48,
    48,
    48,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    48,
    48,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    48,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // Maps the current transition to a mask that needs to apply to the byte
    127,
    63,
    63,
    63,
    0,
    31,
    15,
    15,
    15,
    7,
    7,
    7
  ]
};
function uriDecode(string) {
  let percentPos = string.indexOf("%");
  if (percentPos === -1) {
    return string;
  }
  let decoded = "";
  let last = 0;
  let codepoint = 0;
  let startOfOctets = percentPos;
  let state = UTF8.accept;
  while (percentPos > -1 && percentPos < string.length) {
    const high = resolveHex(string[percentPos + 1], 4);
    const low = resolveHex(string[percentPos + 2], 0);
    const byte = high | low;
    const type = UTF8.data[byte];
    state = UTF8.data[256 + state + type];
    codepoint = codepoint << 6 | byte & UTF8.data[364 + type];
    if (state === UTF8.accept) {
      decoded += string.slice(last, startOfOctets);
      decoded += codepoint <= 65535 ? String.fromCharCode(codepoint) : String.fromCharCode(55232 + (codepoint >> 10), 56320 + (codepoint & 1023));
      codepoint = 0;
      last = percentPos + 3;
      percentPos = string.indexOf("%", last);
      startOfOctets = percentPos;
      continue;
    }
    if (state === UTF8.reject) {
      return null;
    }
    percentPos += 3;
    if (percentPos >= string.length || string[percentPos] !== "%") {
      return null;
    }
  }
  return decoded + string.slice(last);
}
function resolveHex(char, shift) {
  const i = HEX[char];
  return i === void 0 ? 255 : i << shift;
}
const esm = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  analyzeDomain,
  analyzeEmail,
  errorCodes,
  ipRegex,
  isDomainValid,
  isEmailValid,
  uriDecode,
  uriRegex,
  validateDomainOptions
});
const require$$1 = /* @__PURE__ */ getAugmentedNamespace(esm);
export {
  require$$1 as r
};
