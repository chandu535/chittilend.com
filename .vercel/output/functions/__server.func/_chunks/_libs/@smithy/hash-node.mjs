import { f as fromString, a as fromArrayBuffer } from "./util-buffer-from.mjs";
import { Buffer } from "buffer";
import { createHmac, createHash } from "crypto";
import { t as toUint8Array } from "./util-utf8.mjs";
class Hash {
  algorithmIdentifier;
  secret;
  hash;
  constructor(algorithmIdentifier, secret) {
    this.algorithmIdentifier = algorithmIdentifier;
    this.secret = secret;
    this.reset();
  }
  update(toHash, encoding) {
    this.hash.update(toUint8Array(castSourceData(toHash, encoding)));
  }
  digest() {
    return Promise.resolve(this.hash.digest());
  }
  reset() {
    this.hash = this.secret ? createHmac(this.algorithmIdentifier, castSourceData(this.secret)) : createHash(this.algorithmIdentifier);
  }
}
function castSourceData(toCast, encoding) {
  if (Buffer.isBuffer(toCast)) {
    return toCast;
  }
  if (typeof toCast === "string") {
    return fromString(toCast, encoding);
  }
  if (ArrayBuffer.isView(toCast)) {
    return fromArrayBuffer(toCast.buffer, toCast.byteOffset, toCast.byteLength);
  }
  return fromArrayBuffer(toCast);
}
export {
  Hash as H
};
