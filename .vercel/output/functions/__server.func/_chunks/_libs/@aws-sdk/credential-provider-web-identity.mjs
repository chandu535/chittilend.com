import { readFileSync } from "node:fs";
import { e as externalDataInterceptor } from "../@smithy/shared-ini-file-loader.mjs";
import { C as CredentialsProviderError } from "../@smithy/property-provider.mjs";
import { f as setCredentialFeature } from "./core.mjs";
import "../@smithy/types.mjs";
import "path";
import "fs/promises";
import "crypto";
import "os";
import "node:fs/promises";
import "../@smithy/protocol-http.mjs";
import "../@smithy/core.mjs";
import "../@smithy/util-middleware.mjs";
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
import "../@smithy/signature-v4.mjs";
import "../@smithy/smithy-client.mjs";
import "../@smithy/middleware-stack.mjs";
import "./xml-builder.mjs";
import "../../../_libs/fast-xml-parser.mjs";
import "../../../_libs/strnum.mjs";
const fromWebToken = (init) => async (awsIdentityProperties) => {
  init.logger?.debug("@aws-sdk/credential-provider-web-identity - fromWebToken");
  const { roleArn, roleSessionName, webIdentityToken, providerId, policyArns, policy, durationSeconds } = init;
  let { roleAssumerWithWebIdentity } = init;
  if (!roleAssumerWithWebIdentity) {
    const { getDefaultRoleAssumerWithWebIdentity } = await import("./nested-clients.mjs").then(function(n) {
      return n.a;
    });
    roleAssumerWithWebIdentity = getDefaultRoleAssumerWithWebIdentity({
      ...init.clientConfig,
      credentialProviderLogger: init.logger,
      parentClientConfig: {
        ...awsIdentityProperties?.callerClientConfig,
        ...init.parentClientConfig
      }
    }, init.clientPlugins);
  }
  return roleAssumerWithWebIdentity({
    RoleArn: roleArn,
    RoleSessionName: roleSessionName ?? `aws-sdk-js-session-${Date.now()}`,
    WebIdentityToken: webIdentityToken,
    ProviderId: providerId,
    PolicyArns: policyArns,
    Policy: policy,
    DurationSeconds: durationSeconds
  });
};
const ENV_TOKEN_FILE = "AWS_WEB_IDENTITY_TOKEN_FILE";
const ENV_ROLE_ARN = "AWS_ROLE_ARN";
const ENV_ROLE_SESSION_NAME = "AWS_ROLE_SESSION_NAME";
const fromTokenFile = (init = {}) => async (awsIdentityProperties) => {
  init.logger?.debug("@aws-sdk/credential-provider-web-identity - fromTokenFile");
  const webIdentityTokenFile = init?.webIdentityTokenFile ?? process.env[ENV_TOKEN_FILE];
  const roleArn = init?.roleArn ?? process.env[ENV_ROLE_ARN];
  const roleSessionName = init?.roleSessionName ?? process.env[ENV_ROLE_SESSION_NAME];
  if (!webIdentityTokenFile || !roleArn) {
    throw new CredentialsProviderError("Web identity configuration not specified", {
      logger: init.logger
    });
  }
  const credentials = await fromWebToken({
    ...init,
    webIdentityToken: externalDataInterceptor?.getTokenRecord?.()[webIdentityTokenFile] ?? readFileSync(webIdentityTokenFile, { encoding: "ascii" }),
    roleArn,
    roleSessionName
  })(awsIdentityProperties);
  if (webIdentityTokenFile === process.env[ENV_TOKEN_FILE]) {
    setCredentialFeature(credentials, "CREDENTIALS_ENV_VARS_STS_WEB_ID_TOKEN", "h");
  }
  return credentials;
};
export {
  fromTokenFile,
  fromWebToken
};
