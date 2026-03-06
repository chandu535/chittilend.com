import { g as getHostHeaderPlugin, r as resolveHostHeaderConfig } from "./middleware-host-header.mjs";
import { g as getContentLengthPlugin } from "../@smithy/middleware-content-length.mjs";
import { r as resolveAwsSdkSigV4Config, g as AwsRestJsonProtocol, b as AwsSdkSigV4Signer, e as emitWarningIfUnsupportedVersion$1, d as NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, h as AwsQueryProtocol, f as setCredentialFeature } from "./core.mjs";
import { n as normalizeProvider, g as getSmithyContext } from "../@smithy/util-middleware.mjs";
import { H as Hash } from "../@smithy/hash-node.mjs";
import { p as parseUrl } from "../@smithy/url-parser.mjs";
import { a as awsEndpointFunctions } from "./util-endpoints.mjs";
import { E as EndpointCache, r as resolveEndpoint, c as customEndpointFunctions } from "../@smithy/util-endpoints.mjs";
import { S as ServiceException, N as NoOpLogger, e as emitWarningIfUnsupportedVersion, l as loadConfigsForDefaultMode, a as getDefaultExtensionConfiguration, r as resolveDefaultRuntimeConfig, b as Client, C as Command } from "../@smithy/smithy-client.mjs";
import { T as TypeRegistry, v as NoAuthSigner, q as getSchemaSerdePlugin, r as getHttpAuthSchemeEndpointRuleSetPlugin, D as DefaultIdentityProviderConfig, t as getHttpSigningPlugin } from "../@smithy/core.mjs";
import { a as toUtf8, f as fromUtf8 } from "../@smithy/util-utf8.mjs";
import { t as toBase64, f as fromBase64 } from "../@smithy/util-base64.mjs";
import { r as resolveDefaultsModeConfig } from "../@smithy/util-defaults-mode-node.mjs";
import { s as streamCollector, N as NodeHttpHandler } from "../@smithy/node-http-handler.mjs";
import { c as calculateBodyLength } from "../@smithy/util-body-length-node.mjs";
import { l as loadConfig } from "../@smithy/node-config-provider.mjs";
import { N as NODE_APP_ID_CONFIG_OPTIONS, c as createDefaultUserAgentProvider } from "./util-user-agent-node.mjs";
import { N as NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, a as NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, b as NODE_REGION_CONFIG_FILE_OPTIONS, c as NODE_REGION_CONFIG_OPTIONS, r as resolveRegionConfig } from "../@smithy/config-resolver.mjs";
import { N as NODE_RETRY_MODE_CONFIG_OPTIONS, a as NODE_MAX_ATTEMPT_CONFIG_OPTIONS, r as resolveRetryConfig, g as getRetryPlugin } from "../@smithy/middleware-retry.mjs";
import { a as DEFAULT_RETRY_MODE } from "../@smithy/util-retry.mjs";
import { g as getAwsRegionExtensionConfiguration, r as resolveAwsRegionExtensionConfiguration, s as stsRegionDefaultResolver } from "./region-config-resolver.mjs";
import { g as getHttpHandlerExtensionConfiguration, r as resolveHttpHandlerRuntimeConfig } from "../@smithy/protocol-http.mjs";
import { r as resolveUserAgentConfig, g as getUserAgentPlugin } from "./middleware-user-agent.mjs";
import { a as resolveEndpointConfig, g as getEndpointPlugin } from "../@smithy/middleware-endpoint.mjs";
import { g as getLoggerPlugin } from "./middleware-logger.mjs";
import { g as getRecursionDetectionPlugin } from "./middleware-recursion-detection.mjs";
const defaultSSOOIDCHttpAuthSchemeParametersProvider = async (config, context, input) => {
  return {
    operation: getSmithyContext(context).operation,
    region: await normalizeProvider(config.region)() || (() => {
      throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
    })()
  };
};
function createAwsAuthSigv4HttpAuthOption$3(authParameters) {
  return {
    schemeId: "aws.auth#sigv4",
    signingProperties: {
      name: "sso-oauth",
      region: authParameters.region
    },
    propertiesExtractor: (config, context) => ({
      signingProperties: {
        config,
        context
      }
    })
  };
}
function createSmithyApiNoAuthHttpAuthOption$3(authParameters) {
  return {
    schemeId: "smithy.api#noAuth"
  };
}
const defaultSSOOIDCHttpAuthSchemeProvider = (authParameters) => {
  const options = [];
  switch (authParameters.operation) {
    case "CreateToken": {
      options.push(createSmithyApiNoAuthHttpAuthOption$3());
      break;
    }
    default: {
      options.push(createAwsAuthSigv4HttpAuthOption$3(authParameters));
    }
  }
  return options;
};
const resolveHttpAuthSchemeConfig$3 = (config) => {
  const config_0 = resolveAwsSdkSigV4Config(config);
  return Object.assign(config_0, {
    authSchemePreference: normalizeProvider(config.authSchemePreference ?? [])
  });
};
const resolveClientEndpointParameters$3 = (options) => {
  return Object.assign(options, {
    useDualstackEndpoint: options.useDualstackEndpoint ?? false,
    useFipsEndpoint: options.useFipsEndpoint ?? false,
    defaultSigningName: "sso-oauth"
  });
};
const commonParams$3 = {
  UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
  Endpoint: { type: "builtInParams", name: "endpoint" },
  Region: { type: "builtInParams", name: "region" },
  UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
};
const version = "3.996.3";
const packageInfo = {
  version
};
const u$3 = "required", v$3 = "fn", w$3 = "argv", x$3 = "ref";
const a$3 = true, b$3 = "isSet", c$3 = "booleanEquals", d$3 = "error", e$3 = "endpoint", f$3 = "tree", g$3 = "PartitionResult", h$3 = "getAttr", i$3 = { [u$3]: false, type: "string" }, j$3 = { [u$3]: true, default: false, type: "boolean" }, k$3 = { [x$3]: "Endpoint" }, l$3 = { [v$3]: c$3, [w$3]: [{ [x$3]: "UseFIPS" }, true] }, m$3 = { [v$3]: c$3, [w$3]: [{ [x$3]: "UseDualStack" }, true] }, n$3 = {}, o$3 = { [v$3]: h$3, [w$3]: [{ [x$3]: g$3 }, "supportsFIPS"] }, p$3 = { [x$3]: g$3 }, q$3 = { [v$3]: c$3, [w$3]: [true, { [v$3]: h$3, [w$3]: [p$3, "supportsDualStack"] }] }, r$3 = [l$3], s$3 = [m$3], t$3 = [{ [x$3]: "Region" }];
const _data$3 = {
  parameters: { Region: i$3, UseDualStack: j$3, UseFIPS: j$3, Endpoint: i$3 },
  rules: [
    {
      conditions: [{ [v$3]: b$3, [w$3]: [k$3] }],
      rules: [
        { conditions: r$3, error: "Invalid Configuration: FIPS and custom endpoint are not supported", type: d$3 },
        { conditions: s$3, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", type: d$3 },
        { endpoint: { url: k$3, properties: n$3, headers: n$3 }, type: e$3 }
      ],
      type: f$3
    },
    {
      conditions: [{ [v$3]: b$3, [w$3]: t$3 }],
      rules: [
        {
          conditions: [{ [v$3]: "aws.partition", [w$3]: t$3, assign: g$3 }],
          rules: [
            {
              conditions: [l$3, m$3],
              rules: [
                {
                  conditions: [{ [v$3]: c$3, [w$3]: [a$3, o$3] }, q$3],
                  rules: [
                    {
                      endpoint: {
                        url: "https://oidc-fips.{Region}.{PartitionResult#dualStackDnsSuffix}",
                        properties: n$3,
                        headers: n$3
                      },
                      type: e$3
                    }
                  ],
                  type: f$3
                },
                { error: "FIPS and DualStack are enabled, but this partition does not support one or both", type: d$3 }
              ],
              type: f$3
            },
            {
              conditions: r$3,
              rules: [
                {
                  conditions: [{ [v$3]: c$3, [w$3]: [o$3, a$3] }],
                  rules: [
                    {
                      conditions: [{ [v$3]: "stringEquals", [w$3]: [{ [v$3]: h$3, [w$3]: [p$3, "name"] }, "aws-us-gov"] }],
                      endpoint: { url: "https://oidc.{Region}.amazonaws.com", properties: n$3, headers: n$3 },
                      type: e$3
                    },
                    {
                      endpoint: {
                        url: "https://oidc-fips.{Region}.{PartitionResult#dnsSuffix}",
                        properties: n$3,
                        headers: n$3
                      },
                      type: e$3
                    }
                  ],
                  type: f$3
                },
                { error: "FIPS is enabled but this partition does not support FIPS", type: d$3 }
              ],
              type: f$3
            },
            {
              conditions: s$3,
              rules: [
                {
                  conditions: [q$3],
                  rules: [
                    {
                      endpoint: {
                        url: "https://oidc.{Region}.{PartitionResult#dualStackDnsSuffix}",
                        properties: n$3,
                        headers: n$3
                      },
                      type: e$3
                    }
                  ],
                  type: f$3
                },
                { error: "DualStack is enabled but this partition does not support DualStack", type: d$3 }
              ],
              type: f$3
            },
            {
              endpoint: { url: "https://oidc.{Region}.{PartitionResult#dnsSuffix}", properties: n$3, headers: n$3 },
              type: e$3
            }
          ],
          type: f$3
        }
      ],
      type: f$3
    },
    { error: "Invalid Configuration: Missing Region", type: d$3 }
  ]
};
const ruleSet$3 = _data$3;
const cache$3 = new EndpointCache({
  size: 50,
  params: ["Endpoint", "Region", "UseDualStack", "UseFIPS"]
});
const defaultEndpointResolver$3 = (endpointParams, context = {}) => {
  return cache$3.get(endpointParams, () => resolveEndpoint(ruleSet$3, {
    endpointParams,
    logger: context.logger
  }));
};
customEndpointFunctions.aws = awsEndpointFunctions;
class SSOOIDCServiceException extends ServiceException {
  constructor(options) {
    super(options);
    Object.setPrototypeOf(this, SSOOIDCServiceException.prototype);
  }
}
let AccessDeniedException$1 = class AccessDeniedException extends SSOOIDCServiceException {
  name = "AccessDeniedException";
  $fault = "client";
  error;
  reason;
  error_description;
  constructor(opts) {
    super({
      name: "AccessDeniedException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, AccessDeniedException.prototype);
    this.error = opts.error;
    this.reason = opts.reason;
    this.error_description = opts.error_description;
  }
};
class AuthorizationPendingException extends SSOOIDCServiceException {
  name = "AuthorizationPendingException";
  $fault = "client";
  error;
  error_description;
  constructor(opts) {
    super({
      name: "AuthorizationPendingException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, AuthorizationPendingException.prototype);
    this.error = opts.error;
    this.error_description = opts.error_description;
  }
}
let ExpiredTokenException$1 = class ExpiredTokenException extends SSOOIDCServiceException {
  name = "ExpiredTokenException";
  $fault = "client";
  error;
  error_description;
  constructor(opts) {
    super({
      name: "ExpiredTokenException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ExpiredTokenException.prototype);
    this.error = opts.error;
    this.error_description = opts.error_description;
  }
};
let InternalServerException$1 = class InternalServerException extends SSOOIDCServiceException {
  name = "InternalServerException";
  $fault = "server";
  error;
  error_description;
  constructor(opts) {
    super({
      name: "InternalServerException",
      $fault: "server",
      ...opts
    });
    Object.setPrototypeOf(this, InternalServerException.prototype);
    this.error = opts.error;
    this.error_description = opts.error_description;
  }
};
class InvalidClientException extends SSOOIDCServiceException {
  name = "InvalidClientException";
  $fault = "client";
  error;
  error_description;
  constructor(opts) {
    super({
      name: "InvalidClientException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidClientException.prototype);
    this.error = opts.error;
    this.error_description = opts.error_description;
  }
}
class InvalidGrantException extends SSOOIDCServiceException {
  name = "InvalidGrantException";
  $fault = "client";
  error;
  error_description;
  constructor(opts) {
    super({
      name: "InvalidGrantException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidGrantException.prototype);
    this.error = opts.error;
    this.error_description = opts.error_description;
  }
}
let InvalidRequestException$1 = class InvalidRequestException extends SSOOIDCServiceException {
  name = "InvalidRequestException";
  $fault = "client";
  error;
  reason;
  error_description;
  constructor(opts) {
    super({
      name: "InvalidRequestException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidRequestException.prototype);
    this.error = opts.error;
    this.reason = opts.reason;
    this.error_description = opts.error_description;
  }
};
class InvalidScopeException extends SSOOIDCServiceException {
  name = "InvalidScopeException";
  $fault = "client";
  error;
  error_description;
  constructor(opts) {
    super({
      name: "InvalidScopeException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidScopeException.prototype);
    this.error = opts.error;
    this.error_description = opts.error_description;
  }
}
class SlowDownException extends SSOOIDCServiceException {
  name = "SlowDownException";
  $fault = "client";
  error;
  error_description;
  constructor(opts) {
    super({
      name: "SlowDownException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, SlowDownException.prototype);
    this.error = opts.error;
    this.error_description = opts.error_description;
  }
}
class UnauthorizedClientException extends SSOOIDCServiceException {
  name = "UnauthorizedClientException";
  $fault = "client";
  error;
  error_description;
  constructor(opts) {
    super({
      name: "UnauthorizedClientException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, UnauthorizedClientException.prototype);
    this.error = opts.error;
    this.error_description = opts.error_description;
  }
}
class UnsupportedGrantTypeException extends SSOOIDCServiceException {
  name = "UnsupportedGrantTypeException";
  $fault = "client";
  error;
  error_description;
  constructor(opts) {
    super({
      name: "UnsupportedGrantTypeException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, UnsupportedGrantTypeException.prototype);
    this.error = opts.error;
    this.error_description = opts.error_description;
  }
}
const _ADE$1 = "AccessDeniedException";
const _APE = "AuthorizationPendingException";
const _AT$1 = "AccessToken";
const _CS = "ClientSecret";
const _CT = "CreateToken";
const _CTR = "CreateTokenRequest";
const _CTRr = "CreateTokenResponse";
const _CV = "CodeVerifier";
const _ETE$1 = "ExpiredTokenException";
const _ICE = "InvalidClientException";
const _IGE = "InvalidGrantException";
const _IRE$1 = "InvalidRequestException";
const _ISE$1 = "InternalServerException";
const _ISEn = "InvalidScopeException";
const _IT = "IdToken";
const _RT$1 = "RefreshToken";
const _SDE = "SlowDownException";
const _UCE = "UnauthorizedClientException";
const _UGTE = "UnsupportedGrantTypeException";
const _aT$2 = "accessToken";
const _c$3 = "client";
const _cI$1 = "clientId";
const _cS = "clientSecret";
const _cV$1 = "codeVerifier";
const _co$1 = "code";
const _dC = "deviceCode";
const _e$3 = "error";
const _eI$1 = "expiresIn";
const _ed = "error_description";
const _gT$1 = "grantType";
const _h$2 = "http";
const _hE$3 = "httpError";
const _iT$1 = "idToken";
const _r = "reason";
const _rT$1 = "refreshToken";
const _rU$1 = "redirectUri";
const _s$3 = "smithy.ts.sdk.synthetic.com.amazonaws.ssooidc";
const _sc = "scope";
const _se$1 = "server";
const _tT$1 = "tokenType";
const n0$3 = "com.amazonaws.ssooidc";
const _s_registry$3 = TypeRegistry.for(_s$3);
var SSOOIDCServiceException$ = [-3, _s$3, "SSOOIDCServiceException", 0, [], []];
_s_registry$3.registerError(SSOOIDCServiceException$, SSOOIDCServiceException);
const n0_registry$3 = TypeRegistry.for(n0$3);
var AccessDeniedException$$1 = [
  -3,
  n0$3,
  _ADE$1,
  { [_e$3]: _c$3, [_hE$3]: 400 },
  [_e$3, _r, _ed],
  [0, 0, 0]
];
n0_registry$3.registerError(AccessDeniedException$$1, AccessDeniedException$1);
var AuthorizationPendingException$ = [
  -3,
  n0$3,
  _APE,
  { [_e$3]: _c$3, [_hE$3]: 400 },
  [_e$3, _ed],
  [0, 0]
];
n0_registry$3.registerError(AuthorizationPendingException$, AuthorizationPendingException);
var ExpiredTokenException$$1 = [-3, n0$3, _ETE$1, { [_e$3]: _c$3, [_hE$3]: 400 }, [_e$3, _ed], [0, 0]];
n0_registry$3.registerError(ExpiredTokenException$$1, ExpiredTokenException$1);
var InternalServerException$$1 = [-3, n0$3, _ISE$1, { [_e$3]: _se$1, [_hE$3]: 500 }, [_e$3, _ed], [0, 0]];
n0_registry$3.registerError(InternalServerException$$1, InternalServerException$1);
var InvalidClientException$ = [-3, n0$3, _ICE, { [_e$3]: _c$3, [_hE$3]: 401 }, [_e$3, _ed], [0, 0]];
n0_registry$3.registerError(InvalidClientException$, InvalidClientException);
var InvalidGrantException$ = [-3, n0$3, _IGE, { [_e$3]: _c$3, [_hE$3]: 400 }, [_e$3, _ed], [0, 0]];
n0_registry$3.registerError(InvalidGrantException$, InvalidGrantException);
var InvalidRequestException$$1 = [
  -3,
  n0$3,
  _IRE$1,
  { [_e$3]: _c$3, [_hE$3]: 400 },
  [_e$3, _r, _ed],
  [0, 0, 0]
];
n0_registry$3.registerError(InvalidRequestException$$1, InvalidRequestException$1);
var InvalidScopeException$ = [-3, n0$3, _ISEn, { [_e$3]: _c$3, [_hE$3]: 400 }, [_e$3, _ed], [0, 0]];
n0_registry$3.registerError(InvalidScopeException$, InvalidScopeException);
var SlowDownException$ = [-3, n0$3, _SDE, { [_e$3]: _c$3, [_hE$3]: 400 }, [_e$3, _ed], [0, 0]];
n0_registry$3.registerError(SlowDownException$, SlowDownException);
var UnauthorizedClientException$ = [
  -3,
  n0$3,
  _UCE,
  { [_e$3]: _c$3, [_hE$3]: 400 },
  [_e$3, _ed],
  [0, 0]
];
n0_registry$3.registerError(UnauthorizedClientException$, UnauthorizedClientException);
var UnsupportedGrantTypeException$ = [
  -3,
  n0$3,
  _UGTE,
  { [_e$3]: _c$3, [_hE$3]: 400 },
  [_e$3, _ed],
  [0, 0]
];
n0_registry$3.registerError(UnsupportedGrantTypeException$, UnsupportedGrantTypeException);
const errorTypeRegistries$3 = [_s_registry$3, n0_registry$3];
var AccessToken = [0, n0$3, _AT$1, 8, 0];
var ClientSecret = [0, n0$3, _CS, 8, 0];
var CodeVerifier = [0, n0$3, _CV, 8, 0];
var IdToken = [0, n0$3, _IT, 8, 0];
var RefreshToken$1 = [0, n0$3, _RT$1, 8, 0];
var CreateTokenRequest$ = [
  3,
  n0$3,
  _CTR,
  0,
  [_cI$1, _cS, _gT$1, _dC, _co$1, _rT$1, _sc, _rU$1, _cV$1],
  [0, [() => ClientSecret, 0], 0, 0, 0, [() => RefreshToken$1, 0], 64 | 0, 0, [() => CodeVerifier, 0]],
  3
];
var CreateTokenResponse$ = [
  3,
  n0$3,
  _CTRr,
  0,
  [_aT$2, _tT$1, _eI$1, _rT$1, _iT$1],
  [[() => AccessToken, 0], 0, 1, [() => RefreshToken$1, 0], [() => IdToken, 0]]
];
var CreateToken$ = [
  9,
  n0$3,
  _CT,
  { [_h$2]: ["POST", "/token", 200] },
  () => CreateTokenRequest$,
  () => CreateTokenResponse$
];
const getRuntimeConfig$7 = (config) => {
  return {
    apiVersion: "2019-06-10",
    base64Decoder: config?.base64Decoder ?? fromBase64,
    base64Encoder: config?.base64Encoder ?? toBase64,
    disableHostPrefix: config?.disableHostPrefix ?? false,
    endpointProvider: config?.endpointProvider ?? defaultEndpointResolver$3,
    extensions: config?.extensions ?? [],
    httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSSOOIDCHttpAuthSchemeProvider,
    httpAuthSchemes: config?.httpAuthSchemes ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new AwsSdkSigV4Signer()
      },
      {
        schemeId: "smithy.api#noAuth",
        identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
        signer: new NoAuthSigner()
      }
    ],
    logger: config?.logger ?? new NoOpLogger(),
    protocol: config?.protocol ?? AwsRestJsonProtocol,
    protocolSettings: config?.protocolSettings ?? {
      defaultNamespace: "com.amazonaws.ssooidc",
      errorTypeRegistries: errorTypeRegistries$3,
      version: "2019-06-10",
      serviceTarget: "AWSSSOOIDCService"
    },
    serviceId: config?.serviceId ?? "SSO OIDC",
    urlParser: config?.urlParser ?? parseUrl,
    utf8Decoder: config?.utf8Decoder ?? fromUtf8,
    utf8Encoder: config?.utf8Encoder ?? toUtf8
  };
};
const getRuntimeConfig$6 = (config) => {
  emitWarningIfUnsupportedVersion(process.version);
  const defaultsMode = resolveDefaultsModeConfig(config);
  const defaultConfigProvider = () => defaultsMode().then(loadConfigsForDefaultMode);
  const clientSharedValues = getRuntimeConfig$7(config);
  emitWarningIfUnsupportedVersion$1(process.version);
  const loaderConfig = {
    profile: config?.profile,
    logger: clientSharedValues.logger
  };
  return {
    ...clientSharedValues,
    ...config,
    runtime: "node",
    defaultsMode,
    authSchemePreference: config?.authSchemePreference ?? loadConfig(NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, loaderConfig),
    bodyLengthChecker: config?.bodyLengthChecker ?? calculateBodyLength,
    defaultUserAgentProvider: config?.defaultUserAgentProvider ?? createDefaultUserAgentProvider({ serviceId: clientSharedValues.serviceId, clientVersion: packageInfo.version }),
    maxAttempts: config?.maxAttempts ?? loadConfig(NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config),
    region: config?.region ?? loadConfig(NODE_REGION_CONFIG_OPTIONS, { ...NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
    requestHandler: NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
    retryMode: config?.retryMode ?? loadConfig({
      ...NODE_RETRY_MODE_CONFIG_OPTIONS,
      default: async () => (await defaultConfigProvider()).retryMode || DEFAULT_RETRY_MODE
    }, config),
    sha256: config?.sha256 ?? Hash.bind(null, "sha256"),
    streamCollector: config?.streamCollector ?? streamCollector,
    useDualstackEndpoint: config?.useDualstackEndpoint ?? loadConfig(NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
    useFipsEndpoint: config?.useFipsEndpoint ?? loadConfig(NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
    userAgentAppId: config?.userAgentAppId ?? loadConfig(NODE_APP_ID_CONFIG_OPTIONS, loaderConfig)
  };
};
const getHttpAuthExtensionConfiguration$3 = (runtimeConfig) => {
  const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
  let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
  let _credentials = runtimeConfig.credentials;
  return {
    setHttpAuthScheme(httpAuthScheme) {
      const index2 = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
      if (index2 === -1) {
        _httpAuthSchemes.push(httpAuthScheme);
      } else {
        _httpAuthSchemes.splice(index2, 1, httpAuthScheme);
      }
    },
    httpAuthSchemes() {
      return _httpAuthSchemes;
    },
    setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
      _httpAuthSchemeProvider = httpAuthSchemeProvider;
    },
    httpAuthSchemeProvider() {
      return _httpAuthSchemeProvider;
    },
    setCredentials(credentials) {
      _credentials = credentials;
    },
    credentials() {
      return _credentials;
    }
  };
};
const resolveHttpAuthRuntimeConfig$3 = (config) => {
  return {
    httpAuthSchemes: config.httpAuthSchemes(),
    httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
    credentials: config.credentials()
  };
};
const resolveRuntimeExtensions$3 = (runtimeConfig, extensions) => {
  const extensionConfiguration = Object.assign(getAwsRegionExtensionConfiguration(runtimeConfig), getDefaultExtensionConfiguration(runtimeConfig), getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration$3(runtimeConfig));
  extensions.forEach((extension) => extension.configure(extensionConfiguration));
  return Object.assign(runtimeConfig, resolveAwsRegionExtensionConfiguration(extensionConfiguration), resolveDefaultRuntimeConfig(extensionConfiguration), resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig$3(extensionConfiguration));
};
class SSOOIDCClient extends Client {
  config;
  constructor(...[configuration]) {
    const _config_0 = getRuntimeConfig$6(configuration || {});
    super(_config_0);
    this.initConfig = _config_0;
    const _config_1 = resolveClientEndpointParameters$3(_config_0);
    const _config_2 = resolveUserAgentConfig(_config_1);
    const _config_3 = resolveRetryConfig(_config_2);
    const _config_4 = resolveRegionConfig(_config_3);
    const _config_5 = resolveHostHeaderConfig(_config_4);
    const _config_6 = resolveEndpointConfig(_config_5);
    const _config_7 = resolveHttpAuthSchemeConfig$3(_config_6);
    const _config_8 = resolveRuntimeExtensions$3(_config_7, configuration?.extensions || []);
    this.config = _config_8;
    this.middlewareStack.use(getSchemaSerdePlugin(this.config));
    this.middlewareStack.use(getUserAgentPlugin(this.config));
    this.middlewareStack.use(getRetryPlugin(this.config));
    this.middlewareStack.use(getContentLengthPlugin(this.config));
    this.middlewareStack.use(getHostHeaderPlugin(this.config));
    this.middlewareStack.use(getLoggerPlugin(this.config));
    this.middlewareStack.use(getRecursionDetectionPlugin(this.config));
    this.middlewareStack.use(getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
      httpAuthSchemeParametersProvider: defaultSSOOIDCHttpAuthSchemeParametersProvider,
      identityProviderConfigProvider: async (config) => new DefaultIdentityProviderConfig({
        "aws.auth#sigv4": config.credentials
      })
    }));
    this.middlewareStack.use(getHttpSigningPlugin(this.config));
  }
  destroy() {
    super.destroy();
  }
}
class CreateTokenCommand extends Command.classBuilder().ep(commonParams$3).m(function(Command2, cs, config, o2) {
  return [getEndpointPlugin(config, Command2.getEndpointParameterInstructions())];
}).s("AWSSSOOIDCService", "CreateToken", {}).n("SSOOIDCClient", "CreateTokenCommand").sc(CreateToken$).build() {
}
const index$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  $Command: Command,
  AccessDeniedException: AccessDeniedException$1,
  AccessDeniedException$: AccessDeniedException$$1,
  AuthorizationPendingException,
  AuthorizationPendingException$,
  CreateToken$,
  CreateTokenCommand,
  CreateTokenRequest$,
  CreateTokenResponse$,
  ExpiredTokenException: ExpiredTokenException$1,
  ExpiredTokenException$: ExpiredTokenException$$1,
  InternalServerException: InternalServerException$1,
  InternalServerException$: InternalServerException$$1,
  InvalidClientException,
  InvalidClientException$,
  InvalidGrantException,
  InvalidGrantException$,
  InvalidRequestException: InvalidRequestException$1,
  InvalidRequestException$: InvalidRequestException$$1,
  InvalidScopeException,
  InvalidScopeException$,
  SSOOIDCClient,
  SSOOIDCServiceException,
  SSOOIDCServiceException$,
  SlowDownException,
  SlowDownException$,
  UnauthorizedClientException,
  UnauthorizedClientException$,
  UnsupportedGrantTypeException,
  UnsupportedGrantTypeException$,
  __Client: Client,
  errorTypeRegistries: errorTypeRegistries$3
});
const defaultSSOHttpAuthSchemeParametersProvider = async (config, context, input) => {
  return {
    operation: getSmithyContext(context).operation,
    region: await normalizeProvider(config.region)() || (() => {
      throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
    })()
  };
};
function createAwsAuthSigv4HttpAuthOption$2(authParameters) {
  return {
    schemeId: "aws.auth#sigv4",
    signingProperties: {
      name: "awsssoportal",
      region: authParameters.region
    },
    propertiesExtractor: (config, context) => ({
      signingProperties: {
        config,
        context
      }
    })
  };
}
function createSmithyApiNoAuthHttpAuthOption$2(authParameters) {
  return {
    schemeId: "smithy.api#noAuth"
  };
}
const defaultSSOHttpAuthSchemeProvider = (authParameters) => {
  const options = [];
  switch (authParameters.operation) {
    case "GetRoleCredentials": {
      options.push(createSmithyApiNoAuthHttpAuthOption$2());
      break;
    }
    default: {
      options.push(createAwsAuthSigv4HttpAuthOption$2(authParameters));
    }
  }
  return options;
};
const resolveHttpAuthSchemeConfig$2 = (config) => {
  const config_0 = resolveAwsSdkSigV4Config(config);
  return Object.assign(config_0, {
    authSchemePreference: normalizeProvider(config.authSchemePreference ?? [])
  });
};
const resolveClientEndpointParameters$2 = (options) => {
  return Object.assign(options, {
    useDualstackEndpoint: options.useDualstackEndpoint ?? false,
    useFipsEndpoint: options.useFipsEndpoint ?? false,
    defaultSigningName: "awsssoportal"
  });
};
const commonParams$2 = {
  UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
  Endpoint: { type: "builtInParams", name: "endpoint" },
  Region: { type: "builtInParams", name: "region" },
  UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
};
const u$2 = "required", v$2 = "fn", w$2 = "argv", x$2 = "ref";
const a$2 = true, b$2 = "isSet", c$2 = "booleanEquals", d$2 = "error", e$2 = "endpoint", f$2 = "tree", g$2 = "PartitionResult", h$2 = "getAttr", i$2 = { [u$2]: false, type: "string" }, j$2 = { [u$2]: true, default: false, type: "boolean" }, k$2 = { [x$2]: "Endpoint" }, l$2 = { [v$2]: c$2, [w$2]: [{ [x$2]: "UseFIPS" }, true] }, m$2 = { [v$2]: c$2, [w$2]: [{ [x$2]: "UseDualStack" }, true] }, n$2 = {}, o$2 = { [v$2]: h$2, [w$2]: [{ [x$2]: g$2 }, "supportsFIPS"] }, p$2 = { [x$2]: g$2 }, q$2 = { [v$2]: c$2, [w$2]: [true, { [v$2]: h$2, [w$2]: [p$2, "supportsDualStack"] }] }, r$2 = [l$2], s$2 = [m$2], t$2 = [{ [x$2]: "Region" }];
const _data$2 = {
  parameters: { Region: i$2, UseDualStack: j$2, UseFIPS: j$2, Endpoint: i$2 },
  rules: [
    {
      conditions: [{ [v$2]: b$2, [w$2]: [k$2] }],
      rules: [
        { conditions: r$2, error: "Invalid Configuration: FIPS and custom endpoint are not supported", type: d$2 },
        { conditions: s$2, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", type: d$2 },
        { endpoint: { url: k$2, properties: n$2, headers: n$2 }, type: e$2 }
      ],
      type: f$2
    },
    {
      conditions: [{ [v$2]: b$2, [w$2]: t$2 }],
      rules: [
        {
          conditions: [{ [v$2]: "aws.partition", [w$2]: t$2, assign: g$2 }],
          rules: [
            {
              conditions: [l$2, m$2],
              rules: [
                {
                  conditions: [{ [v$2]: c$2, [w$2]: [a$2, o$2] }, q$2],
                  rules: [
                    {
                      endpoint: {
                        url: "https://portal.sso-fips.{Region}.{PartitionResult#dualStackDnsSuffix}",
                        properties: n$2,
                        headers: n$2
                      },
                      type: e$2
                    }
                  ],
                  type: f$2
                },
                { error: "FIPS and DualStack are enabled, but this partition does not support one or both", type: d$2 }
              ],
              type: f$2
            },
            {
              conditions: r$2,
              rules: [
                {
                  conditions: [{ [v$2]: c$2, [w$2]: [o$2, a$2] }],
                  rules: [
                    {
                      conditions: [{ [v$2]: "stringEquals", [w$2]: [{ [v$2]: h$2, [w$2]: [p$2, "name"] }, "aws-us-gov"] }],
                      endpoint: { url: "https://portal.sso.{Region}.amazonaws.com", properties: n$2, headers: n$2 },
                      type: e$2
                    },
                    {
                      endpoint: {
                        url: "https://portal.sso-fips.{Region}.{PartitionResult#dnsSuffix}",
                        properties: n$2,
                        headers: n$2
                      },
                      type: e$2
                    }
                  ],
                  type: f$2
                },
                { error: "FIPS is enabled but this partition does not support FIPS", type: d$2 }
              ],
              type: f$2
            },
            {
              conditions: s$2,
              rules: [
                {
                  conditions: [q$2],
                  rules: [
                    {
                      endpoint: {
                        url: "https://portal.sso.{Region}.{PartitionResult#dualStackDnsSuffix}",
                        properties: n$2,
                        headers: n$2
                      },
                      type: e$2
                    }
                  ],
                  type: f$2
                },
                { error: "DualStack is enabled but this partition does not support DualStack", type: d$2 }
              ],
              type: f$2
            },
            {
              endpoint: { url: "https://portal.sso.{Region}.{PartitionResult#dnsSuffix}", properties: n$2, headers: n$2 },
              type: e$2
            }
          ],
          type: f$2
        }
      ],
      type: f$2
    },
    { error: "Invalid Configuration: Missing Region", type: d$2 }
  ]
};
const ruleSet$2 = _data$2;
const cache$2 = new EndpointCache({
  size: 50,
  params: ["Endpoint", "Region", "UseDualStack", "UseFIPS"]
});
const defaultEndpointResolver$2 = (endpointParams, context = {}) => {
  return cache$2.get(endpointParams, () => resolveEndpoint(ruleSet$2, {
    endpointParams,
    logger: context.logger
  }));
};
customEndpointFunctions.aws = awsEndpointFunctions;
class SSOServiceException extends ServiceException {
  constructor(options) {
    super(options);
    Object.setPrototypeOf(this, SSOServiceException.prototype);
  }
}
class InvalidRequestException2 extends SSOServiceException {
  name = "InvalidRequestException";
  $fault = "client";
  constructor(opts) {
    super({
      name: "InvalidRequestException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidRequestException2.prototype);
  }
}
class ResourceNotFoundException extends SSOServiceException {
  name = "ResourceNotFoundException";
  $fault = "client";
  constructor(opts) {
    super({
      name: "ResourceNotFoundException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
  }
}
class TooManyRequestsException extends SSOServiceException {
  name = "TooManyRequestsException";
  $fault = "client";
  constructor(opts) {
    super({
      name: "TooManyRequestsException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, TooManyRequestsException.prototype);
  }
}
class UnauthorizedException extends SSOServiceException {
  name = "UnauthorizedException";
  $fault = "client";
  constructor(opts) {
    super({
      name: "UnauthorizedException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}
const _ATT = "AccessTokenType";
const _GRC = "GetRoleCredentials";
const _GRCR = "GetRoleCredentialsRequest";
const _GRCRe = "GetRoleCredentialsResponse";
const _IRE = "InvalidRequestException";
const _RC = "RoleCredentials";
const _RNFE = "ResourceNotFoundException";
const _SAKT = "SecretAccessKeyType";
const _STT = "SessionTokenType";
const _TMRE$1 = "TooManyRequestsException";
const _UE = "UnauthorizedException";
const _aI = "accountId";
const _aKI$1 = "accessKeyId";
const _aT$1 = "accessToken";
const _ai = "account_id";
const _c$2 = "client";
const _e$2 = "error";
const _ex = "expiration";
const _h$1 = "http";
const _hE$2 = "httpError";
const _hH = "httpHeader";
const _hQ = "httpQuery";
const _m$2 = "message";
const _rC = "roleCredentials";
const _rN = "roleName";
const _rn = "role_name";
const _s$2 = "smithy.ts.sdk.synthetic.com.amazonaws.sso";
const _sAK$1 = "secretAccessKey";
const _sT$1 = "sessionToken";
const _xasbt = "x-amz-sso_bearer_token";
const n0$2 = "com.amazonaws.sso";
const _s_registry$2 = TypeRegistry.for(_s$2);
var SSOServiceException$ = [-3, _s$2, "SSOServiceException", 0, [], []];
_s_registry$2.registerError(SSOServiceException$, SSOServiceException);
const n0_registry$2 = TypeRegistry.for(n0$2);
var InvalidRequestException$ = [-3, n0$2, _IRE, { [_e$2]: _c$2, [_hE$2]: 400 }, [_m$2], [0]];
n0_registry$2.registerError(InvalidRequestException$, InvalidRequestException2);
var ResourceNotFoundException$ = [-3, n0$2, _RNFE, { [_e$2]: _c$2, [_hE$2]: 404 }, [_m$2], [0]];
n0_registry$2.registerError(ResourceNotFoundException$, ResourceNotFoundException);
var TooManyRequestsException$ = [-3, n0$2, _TMRE$1, { [_e$2]: _c$2, [_hE$2]: 429 }, [_m$2], [0]];
n0_registry$2.registerError(TooManyRequestsException$, TooManyRequestsException);
var UnauthorizedException$ = [-3, n0$2, _UE, { [_e$2]: _c$2, [_hE$2]: 401 }, [_m$2], [0]];
n0_registry$2.registerError(UnauthorizedException$, UnauthorizedException);
const errorTypeRegistries$2 = [_s_registry$2, n0_registry$2];
var AccessTokenType = [0, n0$2, _ATT, 8, 0];
var SecretAccessKeyType = [0, n0$2, _SAKT, 8, 0];
var SessionTokenType = [0, n0$2, _STT, 8, 0];
var GetRoleCredentialsRequest$ = [
  3,
  n0$2,
  _GRCR,
  0,
  [_rN, _aI, _aT$1],
  [
    [0, { [_hQ]: _rn }],
    [0, { [_hQ]: _ai }],
    [() => AccessTokenType, { [_hH]: _xasbt }]
  ],
  3
];
var GetRoleCredentialsResponse$ = [
  3,
  n0$2,
  _GRCRe,
  0,
  [_rC],
  [[() => RoleCredentials$, 0]]
];
var RoleCredentials$ = [
  3,
  n0$2,
  _RC,
  0,
  [_aKI$1, _sAK$1, _sT$1, _ex],
  [0, [() => SecretAccessKeyType, 0], [() => SessionTokenType, 0], 1]
];
var GetRoleCredentials$ = [
  9,
  n0$2,
  _GRC,
  { [_h$1]: ["GET", "/federation/credentials", 200] },
  () => GetRoleCredentialsRequest$,
  () => GetRoleCredentialsResponse$
];
const getRuntimeConfig$5 = (config) => {
  return {
    apiVersion: "2019-06-10",
    base64Decoder: config?.base64Decoder ?? fromBase64,
    base64Encoder: config?.base64Encoder ?? toBase64,
    disableHostPrefix: config?.disableHostPrefix ?? false,
    endpointProvider: config?.endpointProvider ?? defaultEndpointResolver$2,
    extensions: config?.extensions ?? [],
    httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSSOHttpAuthSchemeProvider,
    httpAuthSchemes: config?.httpAuthSchemes ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new AwsSdkSigV4Signer()
      },
      {
        schemeId: "smithy.api#noAuth",
        identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
        signer: new NoAuthSigner()
      }
    ],
    logger: config?.logger ?? new NoOpLogger(),
    protocol: config?.protocol ?? AwsRestJsonProtocol,
    protocolSettings: config?.protocolSettings ?? {
      defaultNamespace: "com.amazonaws.sso",
      errorTypeRegistries: errorTypeRegistries$2,
      version: "2019-06-10",
      serviceTarget: "SWBPortalService"
    },
    serviceId: config?.serviceId ?? "SSO",
    urlParser: config?.urlParser ?? parseUrl,
    utf8Decoder: config?.utf8Decoder ?? fromUtf8,
    utf8Encoder: config?.utf8Encoder ?? toUtf8
  };
};
const getRuntimeConfig$4 = (config) => {
  emitWarningIfUnsupportedVersion(process.version);
  const defaultsMode = resolveDefaultsModeConfig(config);
  const defaultConfigProvider = () => defaultsMode().then(loadConfigsForDefaultMode);
  const clientSharedValues = getRuntimeConfig$5(config);
  emitWarningIfUnsupportedVersion$1(process.version);
  const loaderConfig = {
    profile: config?.profile,
    logger: clientSharedValues.logger
  };
  return {
    ...clientSharedValues,
    ...config,
    runtime: "node",
    defaultsMode,
    authSchemePreference: config?.authSchemePreference ?? loadConfig(NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, loaderConfig),
    bodyLengthChecker: config?.bodyLengthChecker ?? calculateBodyLength,
    defaultUserAgentProvider: config?.defaultUserAgentProvider ?? createDefaultUserAgentProvider({ serviceId: clientSharedValues.serviceId, clientVersion: packageInfo.version }),
    maxAttempts: config?.maxAttempts ?? loadConfig(NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config),
    region: config?.region ?? loadConfig(NODE_REGION_CONFIG_OPTIONS, { ...NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
    requestHandler: NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
    retryMode: config?.retryMode ?? loadConfig({
      ...NODE_RETRY_MODE_CONFIG_OPTIONS,
      default: async () => (await defaultConfigProvider()).retryMode || DEFAULT_RETRY_MODE
    }, config),
    sha256: config?.sha256 ?? Hash.bind(null, "sha256"),
    streamCollector: config?.streamCollector ?? streamCollector,
    useDualstackEndpoint: config?.useDualstackEndpoint ?? loadConfig(NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
    useFipsEndpoint: config?.useFipsEndpoint ?? loadConfig(NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
    userAgentAppId: config?.userAgentAppId ?? loadConfig(NODE_APP_ID_CONFIG_OPTIONS, loaderConfig)
  };
};
const getHttpAuthExtensionConfiguration$2 = (runtimeConfig) => {
  const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
  let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
  let _credentials = runtimeConfig.credentials;
  return {
    setHttpAuthScheme(httpAuthScheme) {
      const index2 = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
      if (index2 === -1) {
        _httpAuthSchemes.push(httpAuthScheme);
      } else {
        _httpAuthSchemes.splice(index2, 1, httpAuthScheme);
      }
    },
    httpAuthSchemes() {
      return _httpAuthSchemes;
    },
    setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
      _httpAuthSchemeProvider = httpAuthSchemeProvider;
    },
    httpAuthSchemeProvider() {
      return _httpAuthSchemeProvider;
    },
    setCredentials(credentials) {
      _credentials = credentials;
    },
    credentials() {
      return _credentials;
    }
  };
};
const resolveHttpAuthRuntimeConfig$2 = (config) => {
  return {
    httpAuthSchemes: config.httpAuthSchemes(),
    httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
    credentials: config.credentials()
  };
};
const resolveRuntimeExtensions$2 = (runtimeConfig, extensions) => {
  const extensionConfiguration = Object.assign(getAwsRegionExtensionConfiguration(runtimeConfig), getDefaultExtensionConfiguration(runtimeConfig), getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration$2(runtimeConfig));
  extensions.forEach((extension) => extension.configure(extensionConfiguration));
  return Object.assign(runtimeConfig, resolveAwsRegionExtensionConfiguration(extensionConfiguration), resolveDefaultRuntimeConfig(extensionConfiguration), resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig$2(extensionConfiguration));
};
class SSOClient extends Client {
  config;
  constructor(...[configuration]) {
    const _config_0 = getRuntimeConfig$4(configuration || {});
    super(_config_0);
    this.initConfig = _config_0;
    const _config_1 = resolveClientEndpointParameters$2(_config_0);
    const _config_2 = resolveUserAgentConfig(_config_1);
    const _config_3 = resolveRetryConfig(_config_2);
    const _config_4 = resolveRegionConfig(_config_3);
    const _config_5 = resolveHostHeaderConfig(_config_4);
    const _config_6 = resolveEndpointConfig(_config_5);
    const _config_7 = resolveHttpAuthSchemeConfig$2(_config_6);
    const _config_8 = resolveRuntimeExtensions$2(_config_7, configuration?.extensions || []);
    this.config = _config_8;
    this.middlewareStack.use(getSchemaSerdePlugin(this.config));
    this.middlewareStack.use(getUserAgentPlugin(this.config));
    this.middlewareStack.use(getRetryPlugin(this.config));
    this.middlewareStack.use(getContentLengthPlugin(this.config));
    this.middlewareStack.use(getHostHeaderPlugin(this.config));
    this.middlewareStack.use(getLoggerPlugin(this.config));
    this.middlewareStack.use(getRecursionDetectionPlugin(this.config));
    this.middlewareStack.use(getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
      httpAuthSchemeParametersProvider: defaultSSOHttpAuthSchemeParametersProvider,
      identityProviderConfigProvider: async (config) => new DefaultIdentityProviderConfig({
        "aws.auth#sigv4": config.credentials
      })
    }));
    this.middlewareStack.use(getHttpSigningPlugin(this.config));
  }
  destroy() {
    super.destroy();
  }
}
class GetRoleCredentialsCommand extends Command.classBuilder().ep(commonParams$2).m(function(Command2, cs, config, o2) {
  return [getEndpointPlugin(config, Command2.getEndpointParameterInstructions())];
}).s("SWBPortalService", "GetRoleCredentials", {}).n("SSOClient", "GetRoleCredentialsCommand").sc(GetRoleCredentials$).build() {
}
const defaultSTSHttpAuthSchemeParametersProvider = async (config, context, input) => {
  return {
    operation: getSmithyContext(context).operation,
    region: await normalizeProvider(config.region)() || (() => {
      throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
    })()
  };
};
function createAwsAuthSigv4HttpAuthOption$1(authParameters) {
  return {
    schemeId: "aws.auth#sigv4",
    signingProperties: {
      name: "sts",
      region: authParameters.region
    },
    propertiesExtractor: (config, context) => ({
      signingProperties: {
        config,
        context
      }
    })
  };
}
function createSmithyApiNoAuthHttpAuthOption$1(authParameters) {
  return {
    schemeId: "smithy.api#noAuth"
  };
}
const defaultSTSHttpAuthSchemeProvider = (authParameters) => {
  const options = [];
  switch (authParameters.operation) {
    case "AssumeRoleWithWebIdentity": {
      options.push(createSmithyApiNoAuthHttpAuthOption$1());
      break;
    }
    default: {
      options.push(createAwsAuthSigv4HttpAuthOption$1(authParameters));
    }
  }
  return options;
};
const resolveStsAuthConfig = (input) => Object.assign(input, {
  stsClientCtor: STSClient
});
const resolveHttpAuthSchemeConfig$1 = (config) => {
  const config_0 = resolveStsAuthConfig(config);
  const config_1 = resolveAwsSdkSigV4Config(config_0);
  return Object.assign(config_1, {
    authSchemePreference: normalizeProvider(config.authSchemePreference ?? [])
  });
};
const resolveClientEndpointParameters$1 = (options) => {
  return Object.assign(options, {
    useDualstackEndpoint: options.useDualstackEndpoint ?? false,
    useFipsEndpoint: options.useFipsEndpoint ?? false,
    useGlobalEndpoint: options.useGlobalEndpoint ?? false,
    defaultSigningName: "sts"
  });
};
const commonParams$1 = {
  UseGlobalEndpoint: { type: "builtInParams", name: "useGlobalEndpoint" },
  UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
  Endpoint: { type: "builtInParams", name: "endpoint" },
  Region: { type: "builtInParams", name: "region" },
  UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
};
const F = "required", G = "type", H = "fn", I = "argv", J = "ref";
const a$1 = false, b$1 = true, c$1 = "booleanEquals", d$1 = "stringEquals", e$1 = "sigv4", f$1 = "sts", g$1 = "us-east-1", h$1 = "endpoint", i$1 = "https://sts.{Region}.{PartitionResult#dnsSuffix}", j$1 = "tree", k$1 = "error", l$1 = "getAttr", m$1 = { [F]: false, [G]: "string" }, n$1 = { [F]: true, default: false, [G]: "boolean" }, o$1 = { [J]: "Endpoint" }, p$1 = { [H]: "isSet", [I]: [{ [J]: "Region" }] }, q$1 = { [J]: "Region" }, r$1 = { [H]: "aws.partition", [I]: [q$1], assign: "PartitionResult" }, s$1 = { [J]: "UseFIPS" }, t$1 = { [J]: "UseDualStack" }, u$1 = {
  url: "https://sts.amazonaws.com",
  properties: { authSchemes: [{ name: e$1, signingName: f$1, signingRegion: g$1 }] },
  headers: {}
}, v$1 = {}, w$1 = { conditions: [{ [H]: d$1, [I]: [q$1, "aws-global"] }], [h$1]: u$1, [G]: h$1 }, x$1 = { [H]: c$1, [I]: [s$1, true] }, y = { [H]: c$1, [I]: [t$1, true] }, z = { [H]: l$1, [I]: [{ [J]: "PartitionResult" }, "supportsFIPS"] }, A = { [J]: "PartitionResult" }, B = { [H]: c$1, [I]: [true, { [H]: l$1, [I]: [A, "supportsDualStack"] }] }, C = [{ [H]: "isSet", [I]: [o$1] }], D = [x$1], E = [y];
const _data$1 = {
  parameters: { Region: m$1, UseDualStack: n$1, UseFIPS: n$1, Endpoint: m$1, UseGlobalEndpoint: n$1 },
  rules: [
    {
      conditions: [
        { [H]: c$1, [I]: [{ [J]: "UseGlobalEndpoint" }, b$1] },
        { [H]: "not", [I]: C },
        p$1,
        r$1,
        { [H]: c$1, [I]: [s$1, a$1] },
        { [H]: c$1, [I]: [t$1, a$1] }
      ],
      rules: [
        { conditions: [{ [H]: d$1, [I]: [q$1, "ap-northeast-1"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "ap-south-1"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "ap-southeast-1"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "ap-southeast-2"] }], endpoint: u$1, [G]: h$1 },
        w$1,
        { conditions: [{ [H]: d$1, [I]: [q$1, "ca-central-1"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "eu-central-1"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "eu-north-1"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "eu-west-1"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "eu-west-2"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "eu-west-3"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "sa-east-1"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, g$1] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "us-east-2"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "us-west-1"] }], endpoint: u$1, [G]: h$1 },
        { conditions: [{ [H]: d$1, [I]: [q$1, "us-west-2"] }], endpoint: u$1, [G]: h$1 },
        {
          endpoint: {
            url: i$1,
            properties: { authSchemes: [{ name: e$1, signingName: f$1, signingRegion: "{Region}" }] },
            headers: v$1
          },
          [G]: h$1
        }
      ],
      [G]: j$1
    },
    {
      conditions: C,
      rules: [
        { conditions: D, error: "Invalid Configuration: FIPS and custom endpoint are not supported", [G]: k$1 },
        { conditions: E, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", [G]: k$1 },
        { endpoint: { url: o$1, properties: v$1, headers: v$1 }, [G]: h$1 }
      ],
      [G]: j$1
    },
    {
      conditions: [p$1],
      rules: [
        {
          conditions: [r$1],
          rules: [
            {
              conditions: [x$1, y],
              rules: [
                {
                  conditions: [{ [H]: c$1, [I]: [b$1, z] }, B],
                  rules: [
                    {
                      endpoint: {
                        url: "https://sts-fips.{Region}.{PartitionResult#dualStackDnsSuffix}",
                        properties: v$1,
                        headers: v$1
                      },
                      [G]: h$1
                    }
                  ],
                  [G]: j$1
                },
                { error: "FIPS and DualStack are enabled, but this partition does not support one or both", [G]: k$1 }
              ],
              [G]: j$1
            },
            {
              conditions: D,
              rules: [
                {
                  conditions: [{ [H]: c$1, [I]: [z, b$1] }],
                  rules: [
                    {
                      conditions: [{ [H]: d$1, [I]: [{ [H]: l$1, [I]: [A, "name"] }, "aws-us-gov"] }],
                      endpoint: { url: "https://sts.{Region}.amazonaws.com", properties: v$1, headers: v$1 },
                      [G]: h$1
                    },
                    {
                      endpoint: {
                        url: "https://sts-fips.{Region}.{PartitionResult#dnsSuffix}",
                        properties: v$1,
                        headers: v$1
                      },
                      [G]: h$1
                    }
                  ],
                  [G]: j$1
                },
                { error: "FIPS is enabled but this partition does not support FIPS", [G]: k$1 }
              ],
              [G]: j$1
            },
            {
              conditions: E,
              rules: [
                {
                  conditions: [B],
                  rules: [
                    {
                      endpoint: {
                        url: "https://sts.{Region}.{PartitionResult#dualStackDnsSuffix}",
                        properties: v$1,
                        headers: v$1
                      },
                      [G]: h$1
                    }
                  ],
                  [G]: j$1
                },
                { error: "DualStack is enabled but this partition does not support DualStack", [G]: k$1 }
              ],
              [G]: j$1
            },
            w$1,
            { endpoint: { url: i$1, properties: v$1, headers: v$1 }, [G]: h$1 }
          ],
          [G]: j$1
        }
      ],
      [G]: j$1
    },
    { error: "Invalid Configuration: Missing Region", [G]: k$1 }
  ]
};
const ruleSet$1 = _data$1;
const cache$1 = new EndpointCache({
  size: 50,
  params: ["Endpoint", "Region", "UseDualStack", "UseFIPS", "UseGlobalEndpoint"]
});
const defaultEndpointResolver$1 = (endpointParams, context = {}) => {
  return cache$1.get(endpointParams, () => resolveEndpoint(ruleSet$1, {
    endpointParams,
    logger: context.logger
  }));
};
customEndpointFunctions.aws = awsEndpointFunctions;
class STSServiceException extends ServiceException {
  constructor(options) {
    super(options);
    Object.setPrototypeOf(this, STSServiceException.prototype);
  }
}
class ExpiredTokenException2 extends STSServiceException {
  name = "ExpiredTokenException";
  $fault = "client";
  constructor(opts) {
    super({
      name: "ExpiredTokenException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ExpiredTokenException2.prototype);
  }
}
class MalformedPolicyDocumentException extends STSServiceException {
  name = "MalformedPolicyDocumentException";
  $fault = "client";
  constructor(opts) {
    super({
      name: "MalformedPolicyDocumentException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, MalformedPolicyDocumentException.prototype);
  }
}
class PackedPolicyTooLargeException extends STSServiceException {
  name = "PackedPolicyTooLargeException";
  $fault = "client";
  constructor(opts) {
    super({
      name: "PackedPolicyTooLargeException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, PackedPolicyTooLargeException.prototype);
  }
}
class RegionDisabledException extends STSServiceException {
  name = "RegionDisabledException";
  $fault = "client";
  constructor(opts) {
    super({
      name: "RegionDisabledException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, RegionDisabledException.prototype);
  }
}
class IDPRejectedClaimException extends STSServiceException {
  name = "IDPRejectedClaimException";
  $fault = "client";
  constructor(opts) {
    super({
      name: "IDPRejectedClaimException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, IDPRejectedClaimException.prototype);
  }
}
class InvalidIdentityTokenException extends STSServiceException {
  name = "InvalidIdentityTokenException";
  $fault = "client";
  constructor(opts) {
    super({
      name: "InvalidIdentityTokenException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidIdentityTokenException.prototype);
  }
}
class IDPCommunicationErrorException extends STSServiceException {
  name = "IDPCommunicationErrorException";
  $fault = "client";
  constructor(opts) {
    super({
      name: "IDPCommunicationErrorException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, IDPCommunicationErrorException.prototype);
  }
}
const _A = "Arn";
const _AKI = "AccessKeyId";
const _AR = "AssumeRole";
const _ARI = "AssumedRoleId";
const _ARR = "AssumeRoleRequest";
const _ARRs = "AssumeRoleResponse";
const _ARU = "AssumedRoleUser";
const _ARWWI = "AssumeRoleWithWebIdentity";
const _ARWWIR = "AssumeRoleWithWebIdentityRequest";
const _ARWWIRs = "AssumeRoleWithWebIdentityResponse";
const _Au = "Audience";
const _C = "Credentials";
const _CA = "ContextAssertion";
const _DS = "DurationSeconds";
const _E = "Expiration";
const _EI = "ExternalId";
const _ETE = "ExpiredTokenException";
const _IDPCEE = "IDPCommunicationErrorException";
const _IDPRCE = "IDPRejectedClaimException";
const _IITE = "InvalidIdentityTokenException";
const _K = "Key";
const _MPDE = "MalformedPolicyDocumentException";
const _P = "Policy";
const _PA = "PolicyArns";
const _PAr = "ProviderArn";
const _PC = "ProvidedContexts";
const _PCLT = "ProvidedContextsListType";
const _PCr = "ProvidedContext";
const _PDT = "PolicyDescriptorType";
const _PI = "ProviderId";
const _PPS = "PackedPolicySize";
const _PPTLE = "PackedPolicyTooLargeException";
const _Pr = "Provider";
const _RA = "RoleArn";
const _RDE = "RegionDisabledException";
const _RSN = "RoleSessionName";
const _SAK = "SecretAccessKey";
const _SFWIT = "SubjectFromWebIdentityToken";
const _SI = "SourceIdentity";
const _SN = "SerialNumber";
const _ST = "SessionToken";
const _T = "Tags";
const _TC = "TokenCode";
const _TTK = "TransitiveTagKeys";
const _Ta = "Tag";
const _V = "Value";
const _WIT = "WebIdentityToken";
const _a = "arn";
const _aKST = "accessKeySecretType";
const _aQE = "awsQueryError";
const _c$1 = "client";
const _cTT = "clientTokenType";
const _e$1 = "error";
const _hE$1 = "httpError";
const _m$1 = "message";
const _pDLT = "policyDescriptorListType";
const _s$1 = "smithy.ts.sdk.synthetic.com.amazonaws.sts";
const _tLT = "tagListType";
const n0$1 = "com.amazonaws.sts";
const _s_registry$1 = TypeRegistry.for(_s$1);
var STSServiceException$ = [-3, _s$1, "STSServiceException", 0, [], []];
_s_registry$1.registerError(STSServiceException$, STSServiceException);
const n0_registry$1 = TypeRegistry.for(n0$1);
var ExpiredTokenException$ = [
  -3,
  n0$1,
  _ETE,
  { [_aQE]: [`ExpiredTokenException`, 400], [_e$1]: _c$1, [_hE$1]: 400 },
  [_m$1],
  [0]
];
n0_registry$1.registerError(ExpiredTokenException$, ExpiredTokenException2);
var IDPCommunicationErrorException$ = [
  -3,
  n0$1,
  _IDPCEE,
  { [_aQE]: [`IDPCommunicationError`, 400], [_e$1]: _c$1, [_hE$1]: 400 },
  [_m$1],
  [0]
];
n0_registry$1.registerError(IDPCommunicationErrorException$, IDPCommunicationErrorException);
var IDPRejectedClaimException$ = [
  -3,
  n0$1,
  _IDPRCE,
  { [_aQE]: [`IDPRejectedClaim`, 403], [_e$1]: _c$1, [_hE$1]: 403 },
  [_m$1],
  [0]
];
n0_registry$1.registerError(IDPRejectedClaimException$, IDPRejectedClaimException);
var InvalidIdentityTokenException$ = [
  -3,
  n0$1,
  _IITE,
  { [_aQE]: [`InvalidIdentityToken`, 400], [_e$1]: _c$1, [_hE$1]: 400 },
  [_m$1],
  [0]
];
n0_registry$1.registerError(InvalidIdentityTokenException$, InvalidIdentityTokenException);
var MalformedPolicyDocumentException$ = [
  -3,
  n0$1,
  _MPDE,
  { [_aQE]: [`MalformedPolicyDocument`, 400], [_e$1]: _c$1, [_hE$1]: 400 },
  [_m$1],
  [0]
];
n0_registry$1.registerError(MalformedPolicyDocumentException$, MalformedPolicyDocumentException);
var PackedPolicyTooLargeException$ = [
  -3,
  n0$1,
  _PPTLE,
  { [_aQE]: [`PackedPolicyTooLarge`, 400], [_e$1]: _c$1, [_hE$1]: 400 },
  [_m$1],
  [0]
];
n0_registry$1.registerError(PackedPolicyTooLargeException$, PackedPolicyTooLargeException);
var RegionDisabledException$ = [
  -3,
  n0$1,
  _RDE,
  { [_aQE]: [`RegionDisabledException`, 403], [_e$1]: _c$1, [_hE$1]: 403 },
  [_m$1],
  [0]
];
n0_registry$1.registerError(RegionDisabledException$, RegionDisabledException);
const errorTypeRegistries$1 = [_s_registry$1, n0_registry$1];
var accessKeySecretType = [0, n0$1, _aKST, 8, 0];
var clientTokenType = [0, n0$1, _cTT, 8, 0];
var AssumedRoleUser$ = [3, n0$1, _ARU, 0, [_ARI, _A], [0, 0], 2];
var AssumeRoleRequest$ = [
  3,
  n0$1,
  _ARR,
  0,
  [_RA, _RSN, _PA, _P, _DS, _T, _TTK, _EI, _SN, _TC, _SI, _PC],
  [0, 0, () => policyDescriptorListType, 0, 1, () => tagListType, 64 | 0, 0, 0, 0, 0, () => ProvidedContextsListType],
  2
];
var AssumeRoleResponse$ = [
  3,
  n0$1,
  _ARRs,
  0,
  [_C, _ARU, _PPS, _SI],
  [[() => Credentials$, 0], () => AssumedRoleUser$, 1, 0]
];
var AssumeRoleWithWebIdentityRequest$ = [
  3,
  n0$1,
  _ARWWIR,
  0,
  [_RA, _RSN, _WIT, _PI, _PA, _P, _DS],
  [0, 0, [() => clientTokenType, 0], 0, () => policyDescriptorListType, 0, 1],
  3
];
var AssumeRoleWithWebIdentityResponse$ = [
  3,
  n0$1,
  _ARWWIRs,
  0,
  [_C, _SFWIT, _ARU, _PPS, _Pr, _Au, _SI],
  [[() => Credentials$, 0], 0, () => AssumedRoleUser$, 1, 0, 0, 0]
];
var Credentials$ = [
  3,
  n0$1,
  _C,
  0,
  [_AKI, _SAK, _ST, _E],
  [0, [() => accessKeySecretType, 0], 0, 4],
  4
];
var PolicyDescriptorType$ = [3, n0$1, _PDT, 0, [_a], [0]];
var ProvidedContext$ = [3, n0$1, _PCr, 0, [_PAr, _CA], [0, 0]];
var Tag$ = [3, n0$1, _Ta, 0, [_K, _V], [0, 0], 2];
var policyDescriptorListType = [1, n0$1, _pDLT, 0, () => PolicyDescriptorType$];
var ProvidedContextsListType = [1, n0$1, _PCLT, 0, () => ProvidedContext$];
var tagListType = [1, n0$1, _tLT, 0, () => Tag$];
var AssumeRole$ = [9, n0$1, _AR, 0, () => AssumeRoleRequest$, () => AssumeRoleResponse$];
var AssumeRoleWithWebIdentity$ = [
  9,
  n0$1,
  _ARWWI,
  0,
  () => AssumeRoleWithWebIdentityRequest$,
  () => AssumeRoleWithWebIdentityResponse$
];
const getRuntimeConfig$3 = (config) => {
  return {
    apiVersion: "2011-06-15",
    base64Decoder: config?.base64Decoder ?? fromBase64,
    base64Encoder: config?.base64Encoder ?? toBase64,
    disableHostPrefix: config?.disableHostPrefix ?? false,
    endpointProvider: config?.endpointProvider ?? defaultEndpointResolver$1,
    extensions: config?.extensions ?? [],
    httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSTSHttpAuthSchemeProvider,
    httpAuthSchemes: config?.httpAuthSchemes ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new AwsSdkSigV4Signer()
      },
      {
        schemeId: "smithy.api#noAuth",
        identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
        signer: new NoAuthSigner()
      }
    ],
    logger: config?.logger ?? new NoOpLogger(),
    protocol: config?.protocol ?? AwsQueryProtocol,
    protocolSettings: config?.protocolSettings ?? {
      defaultNamespace: "com.amazonaws.sts",
      errorTypeRegistries: errorTypeRegistries$1,
      xmlNamespace: "https://sts.amazonaws.com/doc/2011-06-15/",
      version: "2011-06-15",
      serviceTarget: "AWSSecurityTokenServiceV20110615"
    },
    serviceId: config?.serviceId ?? "STS",
    urlParser: config?.urlParser ?? parseUrl,
    utf8Decoder: config?.utf8Decoder ?? fromUtf8,
    utf8Encoder: config?.utf8Encoder ?? toUtf8
  };
};
const getRuntimeConfig$2 = (config) => {
  emitWarningIfUnsupportedVersion(process.version);
  const defaultsMode = resolveDefaultsModeConfig(config);
  const defaultConfigProvider = () => defaultsMode().then(loadConfigsForDefaultMode);
  const clientSharedValues = getRuntimeConfig$3(config);
  emitWarningIfUnsupportedVersion$1(process.version);
  const loaderConfig = {
    profile: config?.profile,
    logger: clientSharedValues.logger
  };
  return {
    ...clientSharedValues,
    ...config,
    runtime: "node",
    defaultsMode,
    authSchemePreference: config?.authSchemePreference ?? loadConfig(NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, loaderConfig),
    bodyLengthChecker: config?.bodyLengthChecker ?? calculateBodyLength,
    defaultUserAgentProvider: config?.defaultUserAgentProvider ?? createDefaultUserAgentProvider({ serviceId: clientSharedValues.serviceId, clientVersion: packageInfo.version }),
    httpAuthSchemes: config?.httpAuthSchemes ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4") || (async (idProps) => await config.credentialDefaultProvider(idProps?.__config || {})()),
        signer: new AwsSdkSigV4Signer()
      },
      {
        schemeId: "smithy.api#noAuth",
        identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
        signer: new NoAuthSigner()
      }
    ],
    maxAttempts: config?.maxAttempts ?? loadConfig(NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config),
    region: config?.region ?? loadConfig(NODE_REGION_CONFIG_OPTIONS, { ...NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
    requestHandler: NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
    retryMode: config?.retryMode ?? loadConfig({
      ...NODE_RETRY_MODE_CONFIG_OPTIONS,
      default: async () => (await defaultConfigProvider()).retryMode || DEFAULT_RETRY_MODE
    }, config),
    sha256: config?.sha256 ?? Hash.bind(null, "sha256"),
    streamCollector: config?.streamCollector ?? streamCollector,
    useDualstackEndpoint: config?.useDualstackEndpoint ?? loadConfig(NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
    useFipsEndpoint: config?.useFipsEndpoint ?? loadConfig(NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
    userAgentAppId: config?.userAgentAppId ?? loadConfig(NODE_APP_ID_CONFIG_OPTIONS, loaderConfig)
  };
};
const getHttpAuthExtensionConfiguration$1 = (runtimeConfig) => {
  const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
  let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
  let _credentials = runtimeConfig.credentials;
  return {
    setHttpAuthScheme(httpAuthScheme) {
      const index2 = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
      if (index2 === -1) {
        _httpAuthSchemes.push(httpAuthScheme);
      } else {
        _httpAuthSchemes.splice(index2, 1, httpAuthScheme);
      }
    },
    httpAuthSchemes() {
      return _httpAuthSchemes;
    },
    setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
      _httpAuthSchemeProvider = httpAuthSchemeProvider;
    },
    httpAuthSchemeProvider() {
      return _httpAuthSchemeProvider;
    },
    setCredentials(credentials) {
      _credentials = credentials;
    },
    credentials() {
      return _credentials;
    }
  };
};
const resolveHttpAuthRuntimeConfig$1 = (config) => {
  return {
    httpAuthSchemes: config.httpAuthSchemes(),
    httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
    credentials: config.credentials()
  };
};
const resolveRuntimeExtensions$1 = (runtimeConfig, extensions) => {
  const extensionConfiguration = Object.assign(getAwsRegionExtensionConfiguration(runtimeConfig), getDefaultExtensionConfiguration(runtimeConfig), getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration$1(runtimeConfig));
  extensions.forEach((extension) => extension.configure(extensionConfiguration));
  return Object.assign(runtimeConfig, resolveAwsRegionExtensionConfiguration(extensionConfiguration), resolveDefaultRuntimeConfig(extensionConfiguration), resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig$1(extensionConfiguration));
};
class STSClient extends Client {
  config;
  constructor(...[configuration]) {
    const _config_0 = getRuntimeConfig$2(configuration || {});
    super(_config_0);
    this.initConfig = _config_0;
    const _config_1 = resolveClientEndpointParameters$1(_config_0);
    const _config_2 = resolveUserAgentConfig(_config_1);
    const _config_3 = resolveRetryConfig(_config_2);
    const _config_4 = resolveRegionConfig(_config_3);
    const _config_5 = resolveHostHeaderConfig(_config_4);
    const _config_6 = resolveEndpointConfig(_config_5);
    const _config_7 = resolveHttpAuthSchemeConfig$1(_config_6);
    const _config_8 = resolveRuntimeExtensions$1(_config_7, configuration?.extensions || []);
    this.config = _config_8;
    this.middlewareStack.use(getSchemaSerdePlugin(this.config));
    this.middlewareStack.use(getUserAgentPlugin(this.config));
    this.middlewareStack.use(getRetryPlugin(this.config));
    this.middlewareStack.use(getContentLengthPlugin(this.config));
    this.middlewareStack.use(getHostHeaderPlugin(this.config));
    this.middlewareStack.use(getLoggerPlugin(this.config));
    this.middlewareStack.use(getRecursionDetectionPlugin(this.config));
    this.middlewareStack.use(getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
      httpAuthSchemeParametersProvider: defaultSTSHttpAuthSchemeParametersProvider,
      identityProviderConfigProvider: async (config) => new DefaultIdentityProviderConfig({
        "aws.auth#sigv4": config.credentials
      })
    }));
    this.middlewareStack.use(getHttpSigningPlugin(this.config));
  }
  destroy() {
    super.destroy();
  }
}
class AssumeRoleCommand extends Command.classBuilder().ep(commonParams$1).m(function(Command2, cs, config, o2) {
  return [getEndpointPlugin(config, Command2.getEndpointParameterInstructions())];
}).s("AWSSecurityTokenServiceV20110615", "AssumeRole", {}).n("STSClient", "AssumeRoleCommand").sc(AssumeRole$).build() {
}
class AssumeRoleWithWebIdentityCommand extends Command.classBuilder().ep(commonParams$1).m(function(Command2, cs, config, o2) {
  return [getEndpointPlugin(config, Command2.getEndpointParameterInstructions())];
}).s("AWSSecurityTokenServiceV20110615", "AssumeRoleWithWebIdentity", {}).n("STSClient", "AssumeRoleWithWebIdentityCommand").sc(AssumeRoleWithWebIdentity$).build() {
}
const getAccountIdFromAssumedRoleUser = (assumedRoleUser) => {
  if (typeof assumedRoleUser?.Arn === "string") {
    const arnComponents = assumedRoleUser.Arn.split(":");
    if (arnComponents.length > 4 && arnComponents[4] !== "") {
      return arnComponents[4];
    }
  }
  return void 0;
};
const resolveRegion = async (_region, _parentRegion, credentialProviderLogger, loaderConfig = {}) => {
  const region = typeof _region === "function" ? await _region() : _region;
  const parentRegion = typeof _parentRegion === "function" ? await _parentRegion() : _parentRegion;
  let stsDefaultRegion = "";
  const resolvedRegion = region ?? parentRegion ?? (stsDefaultRegion = await stsRegionDefaultResolver(loaderConfig)());
  credentialProviderLogger?.debug?.("@aws-sdk/client-sts::resolveRegion", "accepting first of:", `${region} (credential provider clientConfig)`, `${parentRegion} (contextual client)`, `${stsDefaultRegion} (STS default: AWS_REGION, profile region, or us-east-1)`);
  return resolvedRegion;
};
const getDefaultRoleAssumer$1 = (stsOptions, STSClient2) => {
  let stsClient;
  let closureSourceCreds;
  return async (sourceCreds, params) => {
    closureSourceCreds = sourceCreds;
    if (!stsClient) {
      const { logger = stsOptions?.parentClientConfig?.logger, profile = stsOptions?.parentClientConfig?.profile, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger, userAgentAppId = stsOptions?.parentClientConfig?.userAgentAppId } = stsOptions;
      const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger, {
        logger,
        profile
      });
      const isCompatibleRequestHandler = !isH2(requestHandler);
      stsClient = new STSClient2({
        ...stsOptions,
        userAgentAppId,
        profile,
        credentialDefaultProvider: () => async () => closureSourceCreds,
        region: resolvedRegion,
        requestHandler: isCompatibleRequestHandler ? requestHandler : void 0,
        logger
      });
    }
    const { Credentials, AssumedRoleUser } = await stsClient.send(new AssumeRoleCommand(params));
    if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) {
      throw new Error(`Invalid response from STS.assumeRole call with role ${params.RoleArn}`);
    }
    const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser);
    const credentials = {
      accessKeyId: Credentials.AccessKeyId,
      secretAccessKey: Credentials.SecretAccessKey,
      sessionToken: Credentials.SessionToken,
      expiration: Credentials.Expiration,
      ...Credentials.CredentialScope && { credentialScope: Credentials.CredentialScope },
      ...accountId && { accountId }
    };
    setCredentialFeature(credentials, "CREDENTIALS_STS_ASSUME_ROLE", "i");
    return credentials;
  };
};
const getDefaultRoleAssumerWithWebIdentity$1 = (stsOptions, STSClient2) => {
  let stsClient;
  return async (params) => {
    if (!stsClient) {
      const { logger = stsOptions?.parentClientConfig?.logger, profile = stsOptions?.parentClientConfig?.profile, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger, userAgentAppId = stsOptions?.parentClientConfig?.userAgentAppId } = stsOptions;
      const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger, {
        logger,
        profile
      });
      const isCompatibleRequestHandler = !isH2(requestHandler);
      stsClient = new STSClient2({
        ...stsOptions,
        userAgentAppId,
        profile,
        region: resolvedRegion,
        requestHandler: isCompatibleRequestHandler ? requestHandler : void 0,
        logger
      });
    }
    const { Credentials, AssumedRoleUser } = await stsClient.send(new AssumeRoleWithWebIdentityCommand(params));
    if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) {
      throw new Error(`Invalid response from STS.assumeRoleWithWebIdentity call with role ${params.RoleArn}`);
    }
    const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser);
    const credentials = {
      accessKeyId: Credentials.AccessKeyId,
      secretAccessKey: Credentials.SecretAccessKey,
      sessionToken: Credentials.SessionToken,
      expiration: Credentials.Expiration,
      ...Credentials.CredentialScope && { credentialScope: Credentials.CredentialScope },
      ...accountId && { accountId }
    };
    if (accountId) {
      setCredentialFeature(credentials, "RESOLVED_ACCOUNT_ID", "T");
    }
    setCredentialFeature(credentials, "CREDENTIALS_STS_ASSUME_ROLE_WEB_ID", "k");
    return credentials;
  };
};
const isH2 = (requestHandler) => {
  return requestHandler?.metadata?.handlerProtocol === "h2";
};
const getCustomizableStsClientCtor = (baseCtor, customizations) => {
  if (!customizations)
    return baseCtor;
  else
    return class CustomizableSTSClient extends baseCtor {
      constructor(config) {
        super(config);
        for (const customization of customizations) {
          this.middlewareStack.use(customization);
        }
      }
    };
};
const getDefaultRoleAssumer = (stsOptions = {}, stsPlugins) => getDefaultRoleAssumer$1(stsOptions, getCustomizableStsClientCtor(STSClient, stsPlugins));
const getDefaultRoleAssumerWithWebIdentity = (stsOptions = {}, stsPlugins) => getDefaultRoleAssumerWithWebIdentity$1(stsOptions, getCustomizableStsClientCtor(STSClient, stsPlugins));
const index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  $Command: Command,
  AssumeRole$,
  AssumeRoleCommand,
  AssumeRoleRequest$,
  AssumeRoleResponse$,
  AssumeRoleWithWebIdentity$,
  AssumeRoleWithWebIdentityCommand,
  AssumeRoleWithWebIdentityRequest$,
  AssumeRoleWithWebIdentityResponse$,
  AssumedRoleUser$,
  Credentials$,
  ExpiredTokenException: ExpiredTokenException2,
  ExpiredTokenException$,
  IDPCommunicationErrorException,
  IDPCommunicationErrorException$,
  IDPRejectedClaimException,
  IDPRejectedClaimException$,
  InvalidIdentityTokenException,
  InvalidIdentityTokenException$,
  MalformedPolicyDocumentException,
  MalformedPolicyDocumentException$,
  PackedPolicyTooLargeException,
  PackedPolicyTooLargeException$,
  PolicyDescriptorType$,
  ProvidedContext$,
  RegionDisabledException,
  RegionDisabledException$,
  STSClient,
  STSServiceException,
  STSServiceException$,
  Tag$,
  __Client: Client,
  errorTypeRegistries: errorTypeRegistries$1,
  getDefaultRoleAssumer,
  getDefaultRoleAssumerWithWebIdentity
});
const defaultSigninHttpAuthSchemeParametersProvider = async (config, context, input) => {
  return {
    operation: getSmithyContext(context).operation,
    region: await normalizeProvider(config.region)() || (() => {
      throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
    })()
  };
};
function createAwsAuthSigv4HttpAuthOption(authParameters) {
  return {
    schemeId: "aws.auth#sigv4",
    signingProperties: {
      name: "signin",
      region: authParameters.region
    },
    propertiesExtractor: (config, context) => ({
      signingProperties: {
        config,
        context
      }
    })
  };
}
function createSmithyApiNoAuthHttpAuthOption(authParameters) {
  return {
    schemeId: "smithy.api#noAuth"
  };
}
const defaultSigninHttpAuthSchemeProvider = (authParameters) => {
  const options = [];
  switch (authParameters.operation) {
    case "CreateOAuth2Token": {
      options.push(createSmithyApiNoAuthHttpAuthOption());
      break;
    }
    default: {
      options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
    }
  }
  return options;
};
const resolveHttpAuthSchemeConfig = (config) => {
  const config_0 = resolveAwsSdkSigV4Config(config);
  return Object.assign(config_0, {
    authSchemePreference: normalizeProvider(config.authSchemePreference ?? [])
  });
};
const resolveClientEndpointParameters = (options) => {
  return Object.assign(options, {
    useDualstackEndpoint: options.useDualstackEndpoint ?? false,
    useFipsEndpoint: options.useFipsEndpoint ?? false,
    defaultSigningName: "signin"
  });
};
const commonParams = {
  UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
  Endpoint: { type: "builtInParams", name: "endpoint" },
  Region: { type: "builtInParams", name: "region" },
  UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
};
const u = "required", v = "fn", w = "argv", x = "ref";
const a = true, b = "isSet", c = "booleanEquals", d = "error", e = "endpoint", f = "tree", g = "PartitionResult", h = "stringEquals", i = { [u]: true, default: false, type: "boolean" }, j = { [u]: false, type: "string" }, k = { [x]: "Endpoint" }, l = { [v]: c, [w]: [{ [x]: "UseFIPS" }, true] }, m = { [v]: c, [w]: [{ [x]: "UseDualStack" }, true] }, n = {}, o = { [v]: "getAttr", [w]: [{ [x]: g }, "name"] }, p = { [v]: c, [w]: [{ [x]: "UseFIPS" }, false] }, q = { [v]: c, [w]: [{ [x]: "UseDualStack" }, false] }, r = { [v]: "getAttr", [w]: [{ [x]: g }, "supportsFIPS"] }, s = { [v]: c, [w]: [true, { [v]: "getAttr", [w]: [{ [x]: g }, "supportsDualStack"] }] }, t = [{ [x]: "Region" }];
const _data = {
  parameters: { UseDualStack: i, UseFIPS: i, Endpoint: j, Region: j },
  rules: [
    {
      conditions: [{ [v]: b, [w]: [k] }],
      rules: [
        { conditions: [l], error: "Invalid Configuration: FIPS and custom endpoint are not supported", type: d },
        {
          rules: [
            {
              conditions: [m],
              error: "Invalid Configuration: Dualstack and custom endpoint are not supported",
              type: d
            },
            { endpoint: { url: k, properties: n, headers: n }, type: e }
          ],
          type: f
        }
      ],
      type: f
    },
    {
      rules: [
        {
          conditions: [{ [v]: b, [w]: t }],
          rules: [
            {
              conditions: [{ [v]: "aws.partition", [w]: t, assign: g }],
              rules: [
                {
                  conditions: [{ [v]: h, [w]: [o, "aws"] }, p, q],
                  endpoint: { url: "https://{Region}.signin.aws.amazon.com", properties: n, headers: n },
                  type: e
                },
                {
                  conditions: [{ [v]: h, [w]: [o, "aws-cn"] }, p, q],
                  endpoint: { url: "https://{Region}.signin.amazonaws.cn", properties: n, headers: n },
                  type: e
                },
                {
                  conditions: [{ [v]: h, [w]: [o, "aws-us-gov"] }, p, q],
                  endpoint: { url: "https://{Region}.signin.amazonaws-us-gov.com", properties: n, headers: n },
                  type: e
                },
                {
                  conditions: [l, m],
                  rules: [
                    {
                      conditions: [{ [v]: c, [w]: [a, r] }, s],
                      rules: [
                        {
                          endpoint: {
                            url: "https://signin-fips.{Region}.{PartitionResult#dualStackDnsSuffix}",
                            properties: n,
                            headers: n
                          },
                          type: e
                        }
                      ],
                      type: f
                    },
                    {
                      error: "FIPS and DualStack are enabled, but this partition does not support one or both",
                      type: d
                    }
                  ],
                  type: f
                },
                {
                  conditions: [l, q],
                  rules: [
                    {
                      conditions: [{ [v]: c, [w]: [r, a] }],
                      rules: [
                        {
                          endpoint: {
                            url: "https://signin-fips.{Region}.{PartitionResult#dnsSuffix}",
                            properties: n,
                            headers: n
                          },
                          type: e
                        }
                      ],
                      type: f
                    },
                    { error: "FIPS is enabled but this partition does not support FIPS", type: d }
                  ],
                  type: f
                },
                {
                  conditions: [p, m],
                  rules: [
                    {
                      conditions: [s],
                      rules: [
                        {
                          endpoint: {
                            url: "https://signin.{Region}.{PartitionResult#dualStackDnsSuffix}",
                            properties: n,
                            headers: n
                          },
                          type: e
                        }
                      ],
                      type: f
                    },
                    { error: "DualStack is enabled but this partition does not support DualStack", type: d }
                  ],
                  type: f
                },
                {
                  endpoint: { url: "https://signin.{Region}.{PartitionResult#dnsSuffix}", properties: n, headers: n },
                  type: e
                }
              ],
              type: f
            }
          ],
          type: f
        },
        { error: "Invalid Configuration: Missing Region", type: d }
      ],
      type: f
    }
  ]
};
const ruleSet = _data;
const cache = new EndpointCache({
  size: 50,
  params: ["Endpoint", "Region", "UseDualStack", "UseFIPS"]
});
const defaultEndpointResolver = (endpointParams, context = {}) => {
  return cache.get(endpointParams, () => resolveEndpoint(ruleSet, {
    endpointParams,
    logger: context.logger
  }));
};
customEndpointFunctions.aws = awsEndpointFunctions;
class SigninServiceException extends ServiceException {
  constructor(options) {
    super(options);
    Object.setPrototypeOf(this, SigninServiceException.prototype);
  }
}
class AccessDeniedException2 extends SigninServiceException {
  name = "AccessDeniedException";
  $fault = "client";
  error;
  constructor(opts) {
    super({
      name: "AccessDeniedException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, AccessDeniedException2.prototype);
    this.error = opts.error;
  }
}
class InternalServerException2 extends SigninServiceException {
  name = "InternalServerException";
  $fault = "server";
  error;
  constructor(opts) {
    super({
      name: "InternalServerException",
      $fault: "server",
      ...opts
    });
    Object.setPrototypeOf(this, InternalServerException2.prototype);
    this.error = opts.error;
  }
}
class TooManyRequestsError extends SigninServiceException {
  name = "TooManyRequestsError";
  $fault = "client";
  error;
  constructor(opts) {
    super({
      name: "TooManyRequestsError",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
    this.error = opts.error;
  }
}
class ValidationException extends SigninServiceException {
  name = "ValidationException";
  $fault = "client";
  error;
  constructor(opts) {
    super({
      name: "ValidationException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ValidationException.prototype);
    this.error = opts.error;
  }
}
const _ADE = "AccessDeniedException";
const _AT = "AccessToken";
const _COAT = "CreateOAuth2Token";
const _COATR = "CreateOAuth2TokenRequest";
const _COATRB = "CreateOAuth2TokenRequestBody";
const _COATRBr = "CreateOAuth2TokenResponseBody";
const _COATRr = "CreateOAuth2TokenResponse";
const _ISE = "InternalServerException";
const _RT = "RefreshToken";
const _TMRE = "TooManyRequestsError";
const _VE = "ValidationException";
const _aKI = "accessKeyId";
const _aT = "accessToken";
const _c = "client";
const _cI = "clientId";
const _cV = "codeVerifier";
const _co = "code";
const _e = "error";
const _eI = "expiresIn";
const _gT = "grantType";
const _h = "http";
const _hE = "httpError";
const _iT = "idToken";
const _jN = "jsonName";
const _m = "message";
const _rT = "refreshToken";
const _rU = "redirectUri";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.signin";
const _sAK = "secretAccessKey";
const _sT = "sessionToken";
const _se = "server";
const _tI = "tokenInput";
const _tO = "tokenOutput";
const _tT = "tokenType";
const n0 = "com.amazonaws.signin";
const _s_registry = TypeRegistry.for(_s);
var SigninServiceException$ = [-3, _s, "SigninServiceException", 0, [], []];
_s_registry.registerError(SigninServiceException$, SigninServiceException);
const n0_registry = TypeRegistry.for(n0);
var AccessDeniedException$ = [-3, n0, _ADE, { [_e]: _c }, [_e, _m], [0, 0], 2];
n0_registry.registerError(AccessDeniedException$, AccessDeniedException2);
var InternalServerException$ = [-3, n0, _ISE, { [_e]: _se, [_hE]: 500 }, [_e, _m], [0, 0], 2];
n0_registry.registerError(InternalServerException$, InternalServerException2);
var TooManyRequestsError$ = [-3, n0, _TMRE, { [_e]: _c, [_hE]: 429 }, [_e, _m], [0, 0], 2];
n0_registry.registerError(TooManyRequestsError$, TooManyRequestsError);
var ValidationException$ = [-3, n0, _VE, { [_e]: _c, [_hE]: 400 }, [_e, _m], [0, 0], 2];
n0_registry.registerError(ValidationException$, ValidationException);
const errorTypeRegistries = [_s_registry, n0_registry];
var RefreshToken = [0, n0, _RT, 8, 0];
var AccessToken$ = [
  3,
  n0,
  _AT,
  8,
  [_aKI, _sAK, _sT],
  [
    [0, { [_jN]: _aKI }],
    [0, { [_jN]: _sAK }],
    [0, { [_jN]: _sT }]
  ],
  3
];
var CreateOAuth2TokenRequest$ = [
  3,
  n0,
  _COATR,
  0,
  [_tI],
  [[() => CreateOAuth2TokenRequestBody$, 16]],
  1
];
var CreateOAuth2TokenRequestBody$ = [
  3,
  n0,
  _COATRB,
  0,
  [_cI, _gT, _co, _rU, _cV, _rT],
  [
    [0, { [_jN]: _cI }],
    [0, { [_jN]: _gT }],
    0,
    [0, { [_jN]: _rU }],
    [0, { [_jN]: _cV }],
    [() => RefreshToken, { [_jN]: _rT }]
  ],
  2
];
var CreateOAuth2TokenResponse$ = [
  3,
  n0,
  _COATRr,
  0,
  [_tO],
  [[() => CreateOAuth2TokenResponseBody$, 16]],
  1
];
var CreateOAuth2TokenResponseBody$ = [
  3,
  n0,
  _COATRBr,
  0,
  [_aT, _tT, _eI, _rT, _iT],
  [
    [() => AccessToken$, { [_jN]: _aT }],
    [0, { [_jN]: _tT }],
    [1, { [_jN]: _eI }],
    [() => RefreshToken, { [_jN]: _rT }],
    [0, { [_jN]: _iT }]
  ],
  4
];
var CreateOAuth2Token$ = [
  9,
  n0,
  _COAT,
  { [_h]: ["POST", "/v1/token", 200] },
  () => CreateOAuth2TokenRequest$,
  () => CreateOAuth2TokenResponse$
];
const getRuntimeConfig$1 = (config) => {
  return {
    apiVersion: "2023-01-01",
    base64Decoder: config?.base64Decoder ?? fromBase64,
    base64Encoder: config?.base64Encoder ?? toBase64,
    disableHostPrefix: config?.disableHostPrefix ?? false,
    endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
    extensions: config?.extensions ?? [],
    httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSigninHttpAuthSchemeProvider,
    httpAuthSchemes: config?.httpAuthSchemes ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new AwsSdkSigV4Signer()
      },
      {
        schemeId: "smithy.api#noAuth",
        identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
        signer: new NoAuthSigner()
      }
    ],
    logger: config?.logger ?? new NoOpLogger(),
    protocol: config?.protocol ?? AwsRestJsonProtocol,
    protocolSettings: config?.protocolSettings ?? {
      defaultNamespace: "com.amazonaws.signin",
      errorTypeRegistries,
      version: "2023-01-01",
      serviceTarget: "Signin"
    },
    serviceId: config?.serviceId ?? "Signin",
    urlParser: config?.urlParser ?? parseUrl,
    utf8Decoder: config?.utf8Decoder ?? fromUtf8,
    utf8Encoder: config?.utf8Encoder ?? toUtf8
  };
};
const getRuntimeConfig = (config) => {
  emitWarningIfUnsupportedVersion(process.version);
  const defaultsMode = resolveDefaultsModeConfig(config);
  const defaultConfigProvider = () => defaultsMode().then(loadConfigsForDefaultMode);
  const clientSharedValues = getRuntimeConfig$1(config);
  emitWarningIfUnsupportedVersion$1(process.version);
  const loaderConfig = {
    profile: config?.profile,
    logger: clientSharedValues.logger
  };
  return {
    ...clientSharedValues,
    ...config,
    runtime: "node",
    defaultsMode,
    authSchemePreference: config?.authSchemePreference ?? loadConfig(NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, loaderConfig),
    bodyLengthChecker: config?.bodyLengthChecker ?? calculateBodyLength,
    defaultUserAgentProvider: config?.defaultUserAgentProvider ?? createDefaultUserAgentProvider({ serviceId: clientSharedValues.serviceId, clientVersion: packageInfo.version }),
    maxAttempts: config?.maxAttempts ?? loadConfig(NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config),
    region: config?.region ?? loadConfig(NODE_REGION_CONFIG_OPTIONS, { ...NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
    requestHandler: NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
    retryMode: config?.retryMode ?? loadConfig({
      ...NODE_RETRY_MODE_CONFIG_OPTIONS,
      default: async () => (await defaultConfigProvider()).retryMode || DEFAULT_RETRY_MODE
    }, config),
    sha256: config?.sha256 ?? Hash.bind(null, "sha256"),
    streamCollector: config?.streamCollector ?? streamCollector,
    useDualstackEndpoint: config?.useDualstackEndpoint ?? loadConfig(NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
    useFipsEndpoint: config?.useFipsEndpoint ?? loadConfig(NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
    userAgentAppId: config?.userAgentAppId ?? loadConfig(NODE_APP_ID_CONFIG_OPTIONS, loaderConfig)
  };
};
const getHttpAuthExtensionConfiguration = (runtimeConfig) => {
  const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
  let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
  let _credentials = runtimeConfig.credentials;
  return {
    setHttpAuthScheme(httpAuthScheme) {
      const index2 = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
      if (index2 === -1) {
        _httpAuthSchemes.push(httpAuthScheme);
      } else {
        _httpAuthSchemes.splice(index2, 1, httpAuthScheme);
      }
    },
    httpAuthSchemes() {
      return _httpAuthSchemes;
    },
    setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
      _httpAuthSchemeProvider = httpAuthSchemeProvider;
    },
    httpAuthSchemeProvider() {
      return _httpAuthSchemeProvider;
    },
    setCredentials(credentials) {
      _credentials = credentials;
    },
    credentials() {
      return _credentials;
    }
  };
};
const resolveHttpAuthRuntimeConfig = (config) => {
  return {
    httpAuthSchemes: config.httpAuthSchemes(),
    httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
    credentials: config.credentials()
  };
};
const resolveRuntimeExtensions = (runtimeConfig, extensions) => {
  const extensionConfiguration = Object.assign(getAwsRegionExtensionConfiguration(runtimeConfig), getDefaultExtensionConfiguration(runtimeConfig), getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
  extensions.forEach((extension) => extension.configure(extensionConfiguration));
  return Object.assign(runtimeConfig, resolveAwsRegionExtensionConfiguration(extensionConfiguration), resolveDefaultRuntimeConfig(extensionConfiguration), resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
};
class SigninClient extends Client {
  config;
  constructor(...[configuration]) {
    const _config_0 = getRuntimeConfig(configuration || {});
    super(_config_0);
    this.initConfig = _config_0;
    const _config_1 = resolveClientEndpointParameters(_config_0);
    const _config_2 = resolveUserAgentConfig(_config_1);
    const _config_3 = resolveRetryConfig(_config_2);
    const _config_4 = resolveRegionConfig(_config_3);
    const _config_5 = resolveHostHeaderConfig(_config_4);
    const _config_6 = resolveEndpointConfig(_config_5);
    const _config_7 = resolveHttpAuthSchemeConfig(_config_6);
    const _config_8 = resolveRuntimeExtensions(_config_7, configuration?.extensions || []);
    this.config = _config_8;
    this.middlewareStack.use(getSchemaSerdePlugin(this.config));
    this.middlewareStack.use(getUserAgentPlugin(this.config));
    this.middlewareStack.use(getRetryPlugin(this.config));
    this.middlewareStack.use(getContentLengthPlugin(this.config));
    this.middlewareStack.use(getHostHeaderPlugin(this.config));
    this.middlewareStack.use(getLoggerPlugin(this.config));
    this.middlewareStack.use(getRecursionDetectionPlugin(this.config));
    this.middlewareStack.use(getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
      httpAuthSchemeParametersProvider: defaultSigninHttpAuthSchemeParametersProvider,
      identityProviderConfigProvider: async (config) => new DefaultIdentityProviderConfig({
        "aws.auth#sigv4": config.credentials
      })
    }));
    this.middlewareStack.use(getHttpSigningPlugin(this.config));
  }
  destroy() {
    super.destroy();
  }
}
class CreateOAuth2TokenCommand extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [getEndpointPlugin(config, Command2.getEndpointParameterInstructions())];
}).s("Signin", "CreateOAuth2Token", {}).n("SigninClient", "CreateOAuth2TokenCommand").sc(CreateOAuth2Token$).build() {
}
const index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  $Command: Command,
  AccessDeniedException: AccessDeniedException2,
  AccessDeniedException$,
  AccessToken$,
  CreateOAuth2Token$,
  CreateOAuth2TokenCommand,
  CreateOAuth2TokenRequest$,
  CreateOAuth2TokenRequestBody$,
  CreateOAuth2TokenResponse$,
  CreateOAuth2TokenResponseBody$,
  InternalServerException: InternalServerException2,
  InternalServerException$,
  SigninClient,
  SigninServiceException,
  SigninServiceException$,
  TooManyRequestsError,
  TooManyRequestsError$,
  ValidationException,
  ValidationException$,
  __Client: Client,
  errorTypeRegistries
});
export {
  GetRoleCredentialsCommand as G,
  SSOClient as S,
  index$1 as a,
  index as b,
  index$2 as i
};
