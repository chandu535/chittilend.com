import { f as fromBase64, t as toBase64 } from "./util-base64.mjs";
import { f as fromUtf8, a as toUtf8 } from "./util-utf8.mjs";
import { Duplex, Writable, Readable as Readable$1, PassThrough } from "stream";
import { Readable } from "node:stream";
import { a as fromArrayBuffer } from "./util-buffer-from.mjs";
import { t as toHex } from "./util-hex-encoding.mjs";
import { s as streamCollector } from "./fetch-http-handler.mjs";
import { s as streamCollector$1 } from "./node-http-handler.mjs";
class Uint8ArrayBlobAdapter extends Uint8Array {
  static fromString(source, encoding = "utf-8") {
    if (typeof source === "string") {
      if (encoding === "base64") {
        return Uint8ArrayBlobAdapter.mutate(fromBase64(source));
      }
      return Uint8ArrayBlobAdapter.mutate(fromUtf8(source));
    }
    throw new Error(`Unsupported conversion from ${typeof source} to Uint8ArrayBlobAdapter.`);
  }
  static mutate(source) {
    Object.setPrototypeOf(source, Uint8ArrayBlobAdapter.prototype);
    return source;
  }
  transformToString(encoding = "utf-8") {
    if (encoding === "base64") {
      return toBase64(this);
    }
    return toUtf8(this);
  }
}
let ChecksumStream$1 = class ChecksumStream extends Duplex {
  expectedChecksum;
  checksumSourceLocation;
  checksum;
  source;
  base64Encoder;
  pendingCallback = null;
  constructor({ expectedChecksum, checksum, source, checksumSourceLocation, base64Encoder }) {
    super();
    if (typeof source.pipe === "function") {
      this.source = source;
    } else {
      throw new Error(`@smithy/util-stream: unsupported source type ${source?.constructor?.name ?? source} in ChecksumStream.`);
    }
    this.base64Encoder = base64Encoder ?? toBase64;
    this.expectedChecksum = expectedChecksum;
    this.checksum = checksum;
    this.checksumSourceLocation = checksumSourceLocation;
    this.source.pipe(this);
  }
  _read(size) {
    if (this.pendingCallback) {
      const callback = this.pendingCallback;
      this.pendingCallback = null;
      callback();
    }
  }
  _write(chunk, encoding, callback) {
    try {
      this.checksum.update(chunk);
      const canPushMore = this.push(chunk);
      if (!canPushMore) {
        this.pendingCallback = callback;
        return;
      }
    } catch (e) {
      return callback(e);
    }
    return callback();
  }
  async _final(callback) {
    try {
      const digest = await this.checksum.digest();
      const received = this.base64Encoder(digest);
      if (this.expectedChecksum !== received) {
        return callback(new Error(`Checksum mismatch: expected "${this.expectedChecksum}" but received "${received}" in response header "${this.checksumSourceLocation}".`));
      }
    } catch (e) {
      return callback(e);
    }
    this.push(null);
    return callback();
  }
};
const isReadableStream = (stream) => typeof ReadableStream === "function" && (stream?.constructor?.name === ReadableStream.name || stream instanceof ReadableStream);
const isBlob = (blob) => {
  return typeof Blob === "function" && (blob?.constructor?.name === Blob.name || blob instanceof Blob);
};
const ReadableStreamRef = typeof ReadableStream === "function" ? ReadableStream : function() {
};
class ChecksumStream2 extends ReadableStreamRef {
}
const createChecksumStream$1 = ({ expectedChecksum, checksum, source, checksumSourceLocation, base64Encoder }) => {
  if (!isReadableStream(source)) {
    throw new Error(`@smithy/util-stream: unsupported source type ${source?.constructor?.name ?? source} in ChecksumStream.`);
  }
  const encoder = base64Encoder ?? toBase64;
  if (typeof TransformStream !== "function") {
    throw new Error("@smithy/util-stream: unable to instantiate ChecksumStream because API unavailable: ReadableStream/TransformStream.");
  }
  const transform = new TransformStream({
    start() {
    },
    async transform(chunk, controller) {
      checksum.update(chunk);
      controller.enqueue(chunk);
    },
    async flush(controller) {
      const digest = await checksum.digest();
      const received = encoder(digest);
      if (expectedChecksum !== received) {
        const error = new Error(`Checksum mismatch: expected "${expectedChecksum}" but received "${received}" in response header "${checksumSourceLocation}".`);
        controller.error(error);
      } else {
        controller.terminate();
      }
    }
  });
  source.pipeThrough(transform);
  const readable = transform.readable;
  Object.setPrototypeOf(readable, ChecksumStream2.prototype);
  return readable;
};
function createChecksumStream(init) {
  if (typeof ReadableStream === "function" && isReadableStream(init.source)) {
    return createChecksumStream$1(init);
  }
  return new ChecksumStream$1(init);
}
class ByteArrayCollector {
  allocByteArray;
  byteLength = 0;
  byteArrays = [];
  constructor(allocByteArray) {
    this.allocByteArray = allocByteArray;
  }
  push(byteArray) {
    this.byteArrays.push(byteArray);
    this.byteLength += byteArray.byteLength;
  }
  flush() {
    if (this.byteArrays.length === 1) {
      const bytes = this.byteArrays[0];
      this.reset();
      return bytes;
    }
    const aggregation = this.allocByteArray(this.byteLength);
    let cursor = 0;
    for (let i = 0; i < this.byteArrays.length; ++i) {
      const bytes = this.byteArrays[i];
      aggregation.set(bytes, cursor);
      cursor += bytes.byteLength;
    }
    this.reset();
    return aggregation;
  }
  reset() {
    this.byteArrays = [];
    this.byteLength = 0;
  }
}
function createBufferedReadableStream(upstream, size, logger) {
  const reader = upstream.getReader();
  let streamBufferingLoggedWarning = false;
  let bytesSeen = 0;
  const buffers = ["", new ByteArrayCollector((size2) => new Uint8Array(size2))];
  let mode = -1;
  const pull = async (controller) => {
    const { value, done } = await reader.read();
    const chunk = value;
    if (done) {
      if (mode !== -1) {
        const remainder = flush(buffers, mode);
        if (sizeOf(remainder) > 0) {
          controller.enqueue(remainder);
        }
      }
      controller.close();
    } else {
      const chunkMode = modeOf(chunk, false);
      if (mode !== chunkMode) {
        if (mode >= 0) {
          controller.enqueue(flush(buffers, mode));
        }
        mode = chunkMode;
      }
      if (mode === -1) {
        controller.enqueue(chunk);
        return;
      }
      const chunkSize = sizeOf(chunk);
      bytesSeen += chunkSize;
      const bufferSize = sizeOf(buffers[mode]);
      if (chunkSize >= size && bufferSize === 0) {
        controller.enqueue(chunk);
      } else {
        const newSize = merge(buffers, mode, chunk);
        if (!streamBufferingLoggedWarning && bytesSeen > size * 2) {
          streamBufferingLoggedWarning = true;
          logger?.warn(`@smithy/util-stream - stream chunk size ${chunkSize} is below threshold of ${size}, automatically buffering.`);
        }
        if (newSize >= size) {
          controller.enqueue(flush(buffers, mode));
        } else {
          await pull(controller);
        }
      }
    }
  };
  return new ReadableStream({
    pull
  });
}
function merge(buffers, mode, chunk) {
  switch (mode) {
    case 0:
      buffers[0] += chunk;
      return sizeOf(buffers[0]);
    case 1:
    case 2:
      buffers[mode].push(chunk);
      return sizeOf(buffers[mode]);
  }
}
function flush(buffers, mode) {
  switch (mode) {
    case 0:
      const s = buffers[0];
      buffers[0] = "";
      return s;
    case 1:
    case 2:
      return buffers[mode].flush();
  }
  throw new Error(`@smithy/util-stream - invalid index ${mode} given to flush()`);
}
function sizeOf(chunk) {
  return chunk?.byteLength ?? chunk?.length ?? 0;
}
function modeOf(chunk, allowBuffer = true) {
  if (allowBuffer && typeof Buffer !== "undefined" && chunk instanceof Buffer) {
    return 2;
  }
  if (chunk instanceof Uint8Array) {
    return 1;
  }
  if (typeof chunk === "string") {
    return 0;
  }
  return -1;
}
function createBufferedReadable(upstream, size, logger) {
  if (isReadableStream(upstream)) {
    return createBufferedReadableStream(upstream, size, logger);
  }
  const downstream = new Readable({ read() {
  } });
  let streamBufferingLoggedWarning = false;
  let bytesSeen = 0;
  const buffers = [
    "",
    new ByteArrayCollector((size2) => new Uint8Array(size2)),
    new ByteArrayCollector((size2) => Buffer.from(new Uint8Array(size2)))
  ];
  let mode = -1;
  upstream.on("data", (chunk) => {
    const chunkMode = modeOf(chunk, true);
    if (mode !== chunkMode) {
      if (mode >= 0) {
        downstream.push(flush(buffers, mode));
      }
      mode = chunkMode;
    }
    if (mode === -1) {
      downstream.push(chunk);
      return;
    }
    const chunkSize = sizeOf(chunk);
    bytesSeen += chunkSize;
    const bufferSize = sizeOf(buffers[mode]);
    if (chunkSize >= size && bufferSize === 0) {
      downstream.push(chunk);
    } else {
      const newSize = merge(buffers, mode, chunk);
      if (!streamBufferingLoggedWarning && bytesSeen > size * 2) {
        streamBufferingLoggedWarning = true;
        logger?.warn(`@smithy/util-stream - stream chunk size ${chunkSize} is below threshold of ${size}, automatically buffering.`);
      }
      if (newSize >= size) {
        downstream.push(flush(buffers, mode));
      }
    }
  });
  upstream.on("end", () => {
    if (mode !== -1) {
      const remainder = flush(buffers, mode);
      if (sizeOf(remainder) > 0) {
        downstream.push(remainder);
      }
    }
    downstream.push(null);
  });
  return downstream;
}
const getAwsChunkedEncodingStream$1 = (readableStream, options) => {
  const { base64Encoder, bodyLengthChecker, checksumAlgorithmFn, checksumLocationName, streamHasher } = options;
  const checksumRequired = base64Encoder !== void 0 && bodyLengthChecker !== void 0 && checksumAlgorithmFn !== void 0 && checksumLocationName !== void 0 && streamHasher !== void 0;
  const digest = checksumRequired ? streamHasher(checksumAlgorithmFn, readableStream) : void 0;
  const reader = readableStream.getReader();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.enqueue(`0\r
`);
        if (checksumRequired) {
          const checksum = base64Encoder(await digest);
          controller.enqueue(`${checksumLocationName}:${checksum}\r
`);
          controller.enqueue(`\r
`);
        }
        controller.close();
      } else {
        controller.enqueue(`${(bodyLengthChecker(value) || 0).toString(16)}\r
${value}\r
`);
      }
    }
  });
};
function getAwsChunkedEncodingStream(stream, options) {
  const readable = stream;
  const readableStream = stream;
  if (isReadableStream(readableStream)) {
    return getAwsChunkedEncodingStream$1(readableStream, options);
  }
  const { base64Encoder, bodyLengthChecker, checksumAlgorithmFn, checksumLocationName, streamHasher } = options;
  const checksumRequired = base64Encoder !== void 0 && checksumAlgorithmFn !== void 0 && checksumLocationName !== void 0 && streamHasher !== void 0;
  const digest = checksumRequired ? streamHasher(checksumAlgorithmFn, readable) : void 0;
  const awsChunkedEncodingStream = new Readable({
    read: () => {
    }
  });
  readable.on("data", (data) => {
    const length = bodyLengthChecker(data) || 0;
    if (length === 0) {
      return;
    }
    awsChunkedEncodingStream.push(`${length.toString(16)}\r
`);
    awsChunkedEncodingStream.push(data);
    awsChunkedEncodingStream.push("\r\n");
  });
  readable.on("end", async () => {
    awsChunkedEncodingStream.push(`0\r
`);
    if (checksumRequired) {
      const checksum = base64Encoder(await digest);
      awsChunkedEncodingStream.push(`${checksumLocationName}:${checksum}\r
`);
      awsChunkedEncodingStream.push(`\r
`);
    }
    awsChunkedEncodingStream.push(null);
  });
  return awsChunkedEncodingStream;
}
async function headStream$1(stream, bytes) {
  let byteLengthCounter = 0;
  const chunks = [];
  const reader = stream.getReader();
  let isDone = false;
  while (!isDone) {
    const { done, value } = await reader.read();
    if (value) {
      chunks.push(value);
      byteLengthCounter += value?.byteLength ?? 0;
    }
    if (byteLengthCounter >= bytes) {
      break;
    }
    isDone = done;
  }
  reader.releaseLock();
  const collected = new Uint8Array(Math.min(bytes, byteLengthCounter));
  let offset = 0;
  for (const chunk of chunks) {
    if (chunk.byteLength > collected.byteLength - offset) {
      collected.set(chunk.subarray(0, collected.byteLength - offset), offset);
      break;
    } else {
      collected.set(chunk, offset);
    }
    offset += chunk.length;
  }
  return collected;
}
const headStream = (stream, bytes) => {
  if (isReadableStream(stream)) {
    return headStream$1(stream, bytes);
  }
  return new Promise((resolve, reject) => {
    const collector = new Collector();
    collector.limit = bytes;
    stream.pipe(collector);
    stream.on("error", (err) => {
      collector.end();
      reject(err);
    });
    collector.on("error", reject);
    collector.on("finish", function() {
      const bytes2 = new Uint8Array(Buffer.concat(this.buffers));
      resolve(bytes2);
    });
  });
};
class Collector extends Writable {
  buffers = [];
  limit = Infinity;
  bytesBuffered = 0;
  _write(chunk, encoding, callback) {
    this.buffers.push(chunk);
    this.bytesBuffered += chunk.byteLength ?? 0;
    if (this.bytesBuffered >= this.limit) {
      const excess = this.bytesBuffered - this.limit;
      const tailBuffer = this.buffers[this.buffers.length - 1];
      this.buffers[this.buffers.length - 1] = tailBuffer.subarray(0, tailBuffer.byteLength - excess);
      this.emit("finish");
    }
    callback();
  }
}
const ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED$1 = "The stream has already been transformed.";
const sdkStreamMixin$1 = (stream) => {
  if (!isBlobInstance(stream) && !isReadableStream(stream)) {
    const name = stream?.__proto__?.constructor?.name || stream;
    throw new Error(`Unexpected stream implementation, expect Blob or ReadableStream, got ${name}`);
  }
  let transformed = false;
  const transformToByteArray = async () => {
    if (transformed) {
      throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED$1);
    }
    transformed = true;
    return await streamCollector(stream);
  };
  const blobToWebStream = (blob) => {
    if (typeof blob.stream !== "function") {
      throw new Error("Cannot transform payload Blob to web stream. Please make sure the Blob.stream() is polyfilled.\nIf you are using React Native, this API is not yet supported, see: https://react-native.canny.io/feature-requests/p/fetch-streaming-body");
    }
    return blob.stream();
  };
  return Object.assign(stream, {
    transformToByteArray,
    transformToString: async (encoding) => {
      const buf = await transformToByteArray();
      if (encoding === "base64") {
        return toBase64(buf);
      } else if (encoding === "hex") {
        return toHex(buf);
      } else if (encoding === void 0 || encoding === "utf8" || encoding === "utf-8") {
        return toUtf8(buf);
      } else if (typeof TextDecoder === "function") {
        return new TextDecoder(encoding).decode(buf);
      } else {
        throw new Error("TextDecoder is not available, please make sure polyfill is provided.");
      }
    },
    transformToWebStream: () => {
      if (transformed) {
        throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED$1);
      }
      transformed = true;
      if (isBlobInstance(stream)) {
        return blobToWebStream(stream);
      } else if (isReadableStream(stream)) {
        return stream;
      } else {
        throw new Error(`Cannot transform payload to web stream, got ${stream}`);
      }
    }
  });
};
const isBlobInstance = (stream) => typeof Blob === "function" && stream instanceof Blob;
const ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED = "The stream has already been transformed.";
const sdkStreamMixin = (stream) => {
  if (!(stream instanceof Readable$1)) {
    try {
      return sdkStreamMixin$1(stream);
    } catch (e) {
      const name = stream?.__proto__?.constructor?.name || stream;
      throw new Error(`Unexpected stream implementation, expect Stream.Readable instance, got ${name}`);
    }
  }
  let transformed = false;
  const transformToByteArray = async () => {
    if (transformed) {
      throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
    }
    transformed = true;
    return await streamCollector$1(stream);
  };
  return Object.assign(stream, {
    transformToByteArray,
    transformToString: async (encoding) => {
      const buf = await transformToByteArray();
      if (encoding === void 0 || Buffer.isEncoding(encoding)) {
        return fromArrayBuffer(buf.buffer, buf.byteOffset, buf.byteLength).toString(encoding);
      } else {
        const decoder = new TextDecoder(encoding);
        return decoder.decode(buf);
      }
    },
    transformToWebStream: () => {
      if (transformed) {
        throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
      }
      if (stream.readableFlowing !== null) {
        throw new Error("The stream has been consumed by other callbacks.");
      }
      if (typeof Readable$1.toWeb !== "function") {
        throw new Error("Readable.toWeb() is not supported. Please ensure a polyfill is available.");
      }
      transformed = true;
      return Readable$1.toWeb(stream);
    }
  });
};
async function splitStream$1(stream) {
  if (typeof stream.stream === "function") {
    stream = stream.stream();
  }
  const readableStream = stream;
  return readableStream.tee();
}
async function splitStream(stream) {
  if (isReadableStream(stream) || isBlob(stream)) {
    return splitStream$1(stream);
  }
  const stream1 = new PassThrough();
  const stream2 = new PassThrough();
  stream.pipe(stream1);
  stream.pipe(stream2);
  return [stream1, stream2];
}
export {
  Uint8ArrayBlobAdapter as U,
  createChecksumStream as a,
  splitStream as b,
  createBufferedReadable as c,
  getAwsChunkedEncodingStream as g,
  headStream as h,
  sdkStreamMixin as s
};
