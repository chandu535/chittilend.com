import { c as createServerRpc, d as db, b as borrowers } from "./index-BN40sTes.mjs";
import { a as getAuthenticatedUser } from "./auth-BKEQ4cPm.mjs";
import { r as requireRole } from "./roleGuard-MoSFikSq.mjs";
import { c as createServerFn } from "./index.mjs";
import { S as S3Client, P as PutObjectCommand } from "../_chunks/_libs/@aws-sdk/client-s3.mjs";
import { g as getSignedUrl } from "../_chunks/_libs/@aws-sdk/s3-request-presigner.mjs";
import { e as eq } from "../_libs/drizzle-orm.mjs";
import "../_chunks/_libs/@neondatabase/serverless.mjs";
import "../_libs/jose.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_chunks/_libs/react.mjs";
import "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
import "../_chunks/_libs/@aws-sdk/middleware-expect-continue.mjs";
import "../_chunks/_libs/@smithy/protocol-http.mjs";
import "../_chunks/_libs/@aws-sdk/middleware-host-header.mjs";
import "../_chunks/_libs/@smithy/middleware-content-length.mjs";
import "../_chunks/_libs/@aws-sdk/util-endpoints.mjs";
import "../_chunks/_libs/@smithy/util-endpoints.mjs";
import "../_chunks/_libs/@smithy/types.mjs";
import "../_chunks/_libs/@aws-sdk/core.mjs";
import "../_chunks/_libs/@smithy/core.mjs";
import "../_chunks/_libs/@smithy/util-middleware.mjs";
import "../_chunks/_libs/@smithy/util-stream.mjs";
import "../_chunks/_libs/@smithy/util-base64.mjs";
import "../_chunks/_libs/@smithy/util-buffer-from.mjs";
import "../_chunks/_libs/@smithy/is-array-buffer.mjs";
import "buffer";
import "../_chunks/_libs/@smithy/util-utf8.mjs";
import "../_chunks/_libs/@smithy/util-hex-encoding.mjs";
import "../_chunks/_libs/@smithy/fetch-http-handler.mjs";
import "../_chunks/_libs/@smithy/node-http-handler.mjs";
import "../_chunks/_libs/@smithy/querystring-builder.mjs";
import "../_chunks/_libs/@smithy/util-uri-escape.mjs";
import "http";
import "https";
import "../_chunks/_libs/@smithy/uuid.mjs";
import "../_chunks/_libs/@smithy/property-provider.mjs";
import "../_chunks/_libs/@smithy/signature-v4.mjs";
import "../_chunks/_libs/@smithy/smithy-client.mjs";
import "../_chunks/_libs/@smithy/middleware-stack.mjs";
import "../_chunks/_libs/@aws-sdk/xml-builder.mjs";
import "../_libs/fast-xml-parser.mjs";
import "../_libs/strnum.mjs";
import "../_chunks/_libs/@aws-sdk/signature-v4-multi-region.mjs";
import "../_chunks/_libs/@aws-sdk/middleware-sdk-s3.mjs";
import "../_chunks/_libs/@smithy/util-config-provider.mjs";
import "../_chunks/_libs/@aws-sdk/util-arn-parser.mjs";
import "../_chunks/_libs/@smithy/middleware-endpoint.mjs";
import "../_chunks/_libs/@smithy/middleware-serde.mjs";
import "../_chunks/_libs/@smithy/shared-ini-file-loader.mjs";
import "path";
import "fs/promises";
import "os";
import "node:fs/promises";
import "../_chunks/_libs/@smithy/node-config-provider.mjs";
import "../_chunks/_libs/@smithy/url-parser.mjs";
import "../_chunks/_libs/@smithy/querystring-parser.mjs";
import "../_chunks/_libs/@smithy/hash-node.mjs";
import "../_chunks/_libs/@smithy/util-defaults-mode-node.mjs";
import "../_chunks/_libs/@smithy/config-resolver.mjs";
import "../_chunks/_libs/@smithy/hash-stream-node.mjs";
import "../_chunks/_libs/@smithy/eventstream-serde-node.mjs";
import "../_chunks/_libs/@smithy/eventstream-serde-universal.mjs";
import "../_chunks/_libs/@smithy/eventstream-codec.mjs";
import "../_chunks/_libs/@aws-crypto/crc32.mjs";
import "../_libs/tslib.mjs";
import "../_chunks/_libs/@aws-crypto/util.mjs";
import "../_chunks/_libs/@aws-sdk/credential-provider-node.mjs";
import "../_chunks/_libs/@aws-sdk/credential-provider-env.mjs";
import "../_chunks/_libs/@smithy/util-body-length-node.mjs";
import "node:fs";
import "../_chunks/_libs/@aws-sdk/util-user-agent-node.mjs";
import "node:os";
import "node:process";
import "node:path";
import "../_chunks/_libs/@aws-sdk/middleware-user-agent.mjs";
import "../_chunks/_libs/@aws-sdk/middleware-bucket-endpoint.mjs";
import "../_chunks/_libs/@smithy/middleware-retry.mjs";
import "../_chunks/_libs/@smithy/util-retry.mjs";
import "../_chunks/_libs/@smithy/service-error-classification.mjs";
import "../_chunks/_libs/@aws-sdk/middleware-flexible-checksums.mjs";
import "../_chunks/_libs/@aws-sdk/crc64-nvme.mjs";
import "node:zlib";
import "../_chunks/_libs/@aws-crypto/crc32c.mjs";
import "../_chunks/_libs/@aws-sdk/region-config-resolver.mjs";
import "../_chunks/_libs/@smithy/eventstream-serde-config-resolver.mjs";
import "../_chunks/_libs/@aws-sdk/middleware-logger.mjs";
import "../_chunks/_libs/@aws-sdk/middleware-recursion-detection.mjs";
import "../_chunks/_libs/@aws/lambda-invoke-store.mjs";
import "../_chunks/_libs/@aws-sdk/middleware-ssec.mjs";
import "../_chunks/_libs/@aws-sdk/util-format-url.mjs";
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});
const R2_BUCKET = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const getPresignedUploadUrl_createServerFn_handler = createServerRpc({
  id: "ee94996390d9a8774cce534dac34e7b94f6571e967cea4cc5d6b717117a2d1cb",
  name: "getPresignedUploadUrl",
  filename: "src/server/functions/upload.ts"
}, (opts) => getPresignedUploadUrl.__executeServer(opts));
const getPresignedUploadUrl = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const input = data;
  if (!input.fileType || !input.contentType || !input.borrowerId) {
    throw new Error("fileType, contentType, and borrowerId are required");
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(input.contentType)) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed");
  }
  return input;
}).handler(getPresignedUploadUrl_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const ext = data.contentType.split("/")[1] === "jpeg" ? "jpg" : data.contentType.split("/")[1];
  const timestamp = Date.now();
  const fileKey = `borrowers/${data.borrowerId}/${data.fileType}/${timestamp}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
    ContentType: data.contentType
  });
  const presignedUrl = await getSignedUrl(r2Client, command, {
    expiresIn: 600
  });
  return {
    uploadUrl: presignedUrl,
    fileKey,
    publicUrl: `${R2_PUBLIC_URL}/${fileKey}`
  };
});
const confirmUpload_createServerFn_handler = createServerRpc({
  id: "cd0db2762451acabf153c2fca29952e46a9a8339e17b4e6000a5be492bda8345",
  name: "confirmUpload",
  filename: "src/server/functions/upload.ts"
}, (opts) => confirmUpload.__executeServer(opts));
const confirmUpload = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const input = data;
  if (!input.fileKey || !input.borrowerId || !input.docType) {
    throw new Error("fileKey, borrowerId, and docType are required");
  }
  return input;
}).handler(confirmUpload_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const publicUrl = `${R2_PUBLIC_URL}/${data.fileKey}`;
  const updateData = data.docType === "profile" ? {
    profilePhotoUrl: publicUrl,
    updatedAt: /* @__PURE__ */ new Date()
  } : {
    aadhaarPhotoUrl: publicUrl,
    updatedAt: /* @__PURE__ */ new Date()
  };
  await db.update(borrowers).set(updateData).where(eq(borrowers.id, data.borrowerId));
  return {
    url: publicUrl
  };
});
export {
  confirmUpload_createServerFn_handler,
  getPresignedUploadUrl_createServerFn_handler
};
