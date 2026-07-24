import { i as isArrayBuffer } from "./is-array-buffer.mjs";
import { Buffer } from "buffer";
const fromArrayBuffer = (input, offset = 0, length = input.byteLength - offset) => {
  if (!isArrayBuffer(input)) {
    throw new TypeError(`The "input" argument must be ArrayBuffer. Received type ${typeof input} (${input})`);
  }
  return Buffer.from(input, offset, length);
};
const fromString$1 = (input, encoding) => {
  if (typeof input !== "string") {
    throw new TypeError(`The "input" argument must be of type string. Received type ${typeof input} (${input})`);
  }
  return encoding ? Buffer.from(input, encoding) : Buffer.from(input);
};
const fromString = (input, encoding) => {
  if (typeof input !== "string") {
    throw new TypeError(`The "input" argument must be of type string. Received type ${typeof input} (${input})`);
  }
  return Buffer.from(input, encoding);
};
export {
  fromArrayBuffer as a,
  fromString as b,
  fromString$1 as f
};
