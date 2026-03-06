import { f as fromSso } from "./token-providers.mjs";
import { a as getSSOTokenFromFile, g as getProfileName, p as parseKnownFiles, b as loadSsoSessionData } from "../@smithy/shared-ini-file-loader.mjs";
import { C as CredentialsProviderError } from "../@smithy/property-provider.mjs";
import { f as setCredentialFeature } from "./core.mjs";
import { G as GetRoleCredentialsCommand, S as SSOClient } from "./nested-clients.mjs";
import "node:fs";
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
import "./middleware-host-header.mjs";
import "../@smithy/middleware-content-length.mjs";
import "../@smithy/hash-node.mjs";
import "../@smithy/url-parser.mjs";
import "../@smithy/querystring-parser.mjs";
import "./util-endpoints.mjs";
import "../@smithy/util-endpoints.mjs";
import "../@smithy/util-defaults-mode-node.mjs";
import "../@smithy/config-resolver.mjs";
import "../@smithy/util-config-provider.mjs";
import "../@smithy/node-config-provider.mjs";
import "../@smithy/util-body-length-node.mjs";
import "./util-user-agent-node.mjs";
import "node:os";
import "node:process";
import "node:path";
import "./middleware-user-agent.mjs";
import "../@smithy/middleware-retry.mjs";
import "../@smithy/util-retry.mjs";
import "../@smithy/service-error-classification.mjs";
import "./region-config-resolver.mjs";
import "../@smithy/middleware-endpoint.mjs";
import "../@smithy/middleware-serde.mjs";
import "./middleware-logger.mjs";
import "./middleware-recursion-detection.mjs";
import "../@aws/lambda-invoke-store.mjs";
const isSsoProfile = (arg) => arg && (typeof arg.sso_start_url === "string" || typeof arg.sso_account_id === "string" || typeof arg.sso_session === "string" || typeof arg.sso_region === "string" || typeof arg.sso_role_name === "string");
const SHOULD_FAIL_CREDENTIAL_CHAIN = false;
const resolveSSOCredentials = async ({ ssoStartUrl, ssoSession, ssoAccountId, ssoRegion, ssoRoleName, ssoClient, clientConfig, parentClientConfig, callerClientConfig, profile, filepath, configFilepath, ignoreCache, logger }) => {
  let token;
  const refreshMessage = `To refresh this SSO session run aws sso login with the corresponding profile.`;
  if (ssoSession) {
    try {
      const _token = await fromSso({
        profile,
        filepath,
        configFilepath,
        ignoreCache
      })();
      token = {
        accessToken: _token.token,
        expiresAt: new Date(_token.expiration).toISOString()
      };
    } catch (e) {
      throw new CredentialsProviderError(e.message, {
        tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
        logger
      });
    }
  } else {
    try {
      token = await getSSOTokenFromFile(ssoStartUrl);
    } catch (e) {
      throw new CredentialsProviderError(`The SSO session associated with this profile is invalid. ${refreshMessage}`, {
        tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
        logger
      });
    }
  }
  if (new Date(token.expiresAt).getTime() - Date.now() <= 0) {
    throw new CredentialsProviderError(`The SSO session associated with this profile has expired. ${refreshMessage}`, {
      tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
      logger
    });
  }
  const { accessToken } = token;
  const { SSOClient: SSOClient2, GetRoleCredentialsCommand: GetRoleCredentialsCommand2 } = await Promise.resolve().then(function() {
    return loadSso;
  });
  const sso = ssoClient || new SSOClient2(Object.assign({}, clientConfig ?? {}, {
    logger: clientConfig?.logger ?? callerClientConfig?.logger ?? parentClientConfig?.logger,
    region: clientConfig?.region ?? ssoRegion,
    userAgentAppId: clientConfig?.userAgentAppId ?? callerClientConfig?.userAgentAppId ?? parentClientConfig?.userAgentAppId
  }));
  let ssoResp;
  try {
    ssoResp = await sso.send(new GetRoleCredentialsCommand2({
      accountId: ssoAccountId,
      roleName: ssoRoleName,
      accessToken
    }));
  } catch (e) {
    throw new CredentialsProviderError(e, {
      tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
      logger
    });
  }
  const { roleCredentials: { accessKeyId, secretAccessKey, sessionToken, expiration, credentialScope, accountId } = {} } = ssoResp;
  if (!accessKeyId || !secretAccessKey || !sessionToken || !expiration) {
    throw new CredentialsProviderError("SSO returns an invalid temporary credential.", {
      tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
      logger
    });
  }
  const credentials = {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    expiration: new Date(expiration),
    ...credentialScope && { credentialScope },
    ...accountId && { accountId }
  };
  if (ssoSession) {
    setCredentialFeature(credentials, "CREDENTIALS_SSO", "s");
  } else {
    setCredentialFeature(credentials, "CREDENTIALS_SSO_LEGACY", "u");
  }
  return credentials;
};
const validateSsoProfile = (profile, logger) => {
  const { sso_start_url, sso_account_id, sso_region, sso_role_name } = profile;
  if (!sso_start_url || !sso_account_id || !sso_region || !sso_role_name) {
    throw new CredentialsProviderError(`Profile is configured with invalid SSO credentials. Required parameters "sso_account_id", "sso_region", "sso_role_name", "sso_start_url". Got ${Object.keys(profile).join(", ")}
Reference: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html`, { tryNextLink: false, logger });
  }
  return profile;
};
const fromSSO = (init = {}) => async ({ callerClientConfig } = {}) => {
  init.logger?.debug("@aws-sdk/credential-provider-sso - fromSSO");
  const { ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoSession } = init;
  const { ssoClient } = init;
  const profileName = getProfileName({
    profile: init.profile ?? callerClientConfig?.profile
  });
  if (!ssoStartUrl && !ssoAccountId && !ssoRegion && !ssoRoleName && !ssoSession) {
    const profiles = await parseKnownFiles(init);
    const profile = profiles[profileName];
    if (!profile) {
      throw new CredentialsProviderError(`Profile ${profileName} was not found.`, { logger: init.logger });
    }
    if (!isSsoProfile(profile)) {
      throw new CredentialsProviderError(`Profile ${profileName} is not configured with SSO credentials.`, {
        logger: init.logger
      });
    }
    if (profile?.sso_session) {
      const ssoSessions = await loadSsoSessionData(init);
      const session = ssoSessions[profile.sso_session];
      const conflictMsg = ` configurations in profile ${profileName} and sso-session ${profile.sso_session}`;
      if (ssoRegion && ssoRegion !== session.sso_region) {
        throw new CredentialsProviderError(`Conflicting SSO region` + conflictMsg, {
          tryNextLink: false,
          logger: init.logger
        });
      }
      if (ssoStartUrl && ssoStartUrl !== session.sso_start_url) {
        throw new CredentialsProviderError(`Conflicting SSO start_url` + conflictMsg, {
          tryNextLink: false,
          logger: init.logger
        });
      }
      profile.sso_region = session.sso_region;
      profile.sso_start_url = session.sso_start_url;
    }
    const { sso_start_url, sso_account_id, sso_region, sso_role_name, sso_session } = validateSsoProfile(profile, init.logger);
    return resolveSSOCredentials({
      ssoStartUrl: sso_start_url,
      ssoSession: sso_session,
      ssoAccountId: sso_account_id,
      ssoRegion: sso_region,
      ssoRoleName: sso_role_name,
      ssoClient,
      clientConfig: init.clientConfig,
      parentClientConfig: init.parentClientConfig,
      callerClientConfig: init.callerClientConfig,
      profile: profileName,
      filepath: init.filepath,
      configFilepath: init.configFilepath,
      ignoreCache: init.ignoreCache,
      logger: init.logger
    });
  } else if (!ssoStartUrl || !ssoAccountId || !ssoRegion || !ssoRoleName) {
    throw new CredentialsProviderError('Incomplete configuration. The fromSSO() argument hash must include "ssoStartUrl", "ssoAccountId", "ssoRegion", "ssoRoleName"', { tryNextLink: false, logger: init.logger });
  } else {
    return resolveSSOCredentials({
      ssoStartUrl,
      ssoSession,
      ssoAccountId,
      ssoRegion,
      ssoRoleName,
      ssoClient,
      clientConfig: init.clientConfig,
      parentClientConfig: init.parentClientConfig,
      callerClientConfig: init.callerClientConfig,
      profile: profileName,
      filepath: init.filepath,
      configFilepath: init.configFilepath,
      ignoreCache: init.ignoreCache,
      logger: init.logger
    });
  }
};
const loadSso = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  GetRoleCredentialsCommand,
  SSOClient
});
export {
  fromSSO,
  isSsoProfile,
  validateSsoProfile
};
