import { f as setCredentialFeature } from "./core.mjs";
import { C as CredentialsProviderError } from "../@smithy/property-provider.mjs";
import "../@smithy/protocol-http.mjs";
import "../@smithy/core.mjs";
import "../@smithy/util-middleware.mjs";
import "../@smithy/types.mjs";
import "../@smithy/util-stream.mjs";
import "../@smithy/util-base64.mjs";
import "../@smithy/util-buffer-from.mjs";
import "../@smithy/is-array-buffer.mjs";
import "buffer";
import "../@smithy/util-utf8.mjs";
import "stream";
import "node:stream";
import "../@smithy/util-hex-encoding.mjs";
import "../@smithy/fetch-http-handler.mjs";
import "../@smithy/node-http-handler.mjs";
import "../@smithy/querystring-builder.mjs";
import "../@smithy/util-uri-escape.mjs";
import "http";
import "https";
import "../@smithy/uuid.mjs";
import "crypto";
import "../@smithy/signature-v4.mjs";
import "../@smithy/smithy-client.mjs";
import "../@smithy/middleware-stack.mjs";
import "./xml-builder.mjs";
import "../../../_libs/fast-xml-parser.mjs";
import "../../../_libs/strnum.mjs";
const ENV_KEY = "AWS_ACCESS_KEY_ID";
const ENV_SECRET = "AWS_SECRET_ACCESS_KEY";
const ENV_SESSION = "AWS_SESSION_TOKEN";
const ENV_EXPIRATION = "AWS_CREDENTIAL_EXPIRATION";
const ENV_CREDENTIAL_SCOPE = "AWS_CREDENTIAL_SCOPE";
const ENV_ACCOUNT_ID = "AWS_ACCOUNT_ID";
const fromEnv = (init) => async () => {
  init?.logger?.debug("@aws-sdk/credential-provider-env - fromEnv");
  const accessKeyId = process.env[ENV_KEY];
  const secretAccessKey = process.env[ENV_SECRET];
  const sessionToken = process.env[ENV_SESSION];
  const expiry = process.env[ENV_EXPIRATION];
  const credentialScope = process.env[ENV_CREDENTIAL_SCOPE];
  const accountId = process.env[ENV_ACCOUNT_ID];
  if (accessKeyId && secretAccessKey) {
    const credentials = {
      accessKeyId,
      secretAccessKey,
      ...sessionToken && { sessionToken },
      ...expiry && { expiration: new Date(expiry) },
      ...credentialScope && { credentialScope },
      ...accountId && { accountId }
    };
    setCredentialFeature(credentials, "CREDENTIALS_ENV_VARS", "g");
    return credentials;
  }
  throw new CredentialsProviderError("Unable to find environment variable credentials.", { logger: init?.logger });
};
export {
  ENV_ACCOUNT_ID,
  ENV_CREDENTIAL_SCOPE,
  ENV_EXPIRATION,
  ENV_KEY,
  ENV_SECRET,
  ENV_SESSION,
  fromEnv
};
