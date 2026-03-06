import { exec } from "node:child_process";
import { promisify } from "node:util";
import { f as setCredentialFeature } from "./core.mjs";
import { e as externalDataInterceptor, p as parseKnownFiles, g as getProfileName } from "../@smithy/shared-ini-file-loader.mjs";
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
import "path";
import "fs/promises";
import "os";
import "node:fs/promises";
const getValidatedProcessCredentials = (profileName, data, profiles) => {
  if (data.Version !== 1) {
    throw Error(`Profile ${profileName} credential_process did not return Version 1.`);
  }
  if (data.AccessKeyId === void 0 || data.SecretAccessKey === void 0) {
    throw Error(`Profile ${profileName} credential_process returned invalid credentials.`);
  }
  if (data.Expiration) {
    const currentTime = /* @__PURE__ */ new Date();
    const expireTime = new Date(data.Expiration);
    if (expireTime < currentTime) {
      throw Error(`Profile ${profileName} credential_process returned expired credentials.`);
    }
  }
  let accountId = data.AccountId;
  if (!accountId && profiles?.[profileName]?.aws_account_id) {
    accountId = profiles[profileName].aws_account_id;
  }
  const credentials = {
    accessKeyId: data.AccessKeyId,
    secretAccessKey: data.SecretAccessKey,
    ...data.SessionToken && { sessionToken: data.SessionToken },
    ...data.Expiration && { expiration: new Date(data.Expiration) },
    ...data.CredentialScope && { credentialScope: data.CredentialScope },
    ...accountId && { accountId }
  };
  setCredentialFeature(credentials, "CREDENTIALS_PROCESS", "w");
  return credentials;
};
const resolveProcessCredentials = async (profileName, profiles, logger) => {
  const profile = profiles[profileName];
  if (profiles[profileName]) {
    const credentialProcess = profile["credential_process"];
    if (credentialProcess !== void 0) {
      const execPromise = promisify(externalDataInterceptor?.getTokenRecord?.().exec ?? exec);
      try {
        const { stdout } = await execPromise(credentialProcess);
        let data;
        try {
          data = JSON.parse(stdout.trim());
        } catch {
          throw Error(`Profile ${profileName} credential_process returned invalid JSON.`);
        }
        return getValidatedProcessCredentials(profileName, data, profiles);
      } catch (error) {
        throw new CredentialsProviderError(error.message, { logger });
      }
    } else {
      throw new CredentialsProviderError(`Profile ${profileName} did not contain credential_process.`, { logger });
    }
  } else {
    throw new CredentialsProviderError(`Profile ${profileName} could not be found in shared credentials file.`, {
      logger
    });
  }
};
const fromProcess = (init = {}) => async ({ callerClientConfig } = {}) => {
  init.logger?.debug("@aws-sdk/credential-provider-process - fromProcess");
  const profiles = await parseKnownFiles(init);
  return resolveProcessCredentials(getProfileName({
    profile: init.profile ?? callerClientConfig?.profile
  }), profiles, init.logger);
};
export {
  fromProcess
};
