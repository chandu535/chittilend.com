import { a as HttpResponse, H as HttpRequest } from "../@smithy/protocol-http.mjs";
import { n as normalizeProvider, m as memoizeIdentityProvider, d as doesIdentityRequireRefresh, i as isIdentityExpired, T as TypeRegistry, N as NormalizedSchema, a as NumericValue, c as collectBody, L as LazyJsonString, b as determineTimestampFormat, p as parseEpochTimestamp, e as parseRfc7231DateTime, f as parseRfc3339DateTimeWithOffset, g as dateToUtcString, H as HttpBindingProtocol, h as HttpInterceptingShapeSerializer, j as HttpInterceptingShapeDeserializer, F as FromStringShapeDeserializer, k as extendedEncodeURIComponent, R as RpcProtocol, l as deref } from "../@smithy/core.mjs";
import { P as ProviderError } from "../@smithy/property-provider.mjs";
import { S as SignatureV4 } from "../@smithy/signature-v4.mjs";
import { a as toUtf8 } from "../@smithy/util-utf8.mjs";
import { f as fromBase64, t as toBase64 } from "../@smithy/util-base64.mjs";
import { v as v4 } from "../@smithy/uuid.mjs";
import { d as decorateServiceException, g as getValueFromTextNode } from "../@smithy/smithy-client.mjs";
import { p as parseXML, X as XmlNode, a as XmlText } from "./xml-builder.mjs";
const state = {
  warningEmitted: false
};
const emitWarningIfUnsupportedVersion = (version) => {
  if (version && !state.warningEmitted && parseInt(version.substring(1, version.indexOf("."))) < 20) {
    state.warningEmitted = true;
    process.emitWarning(`NodeDeprecationWarning: The AWS SDK for JavaScript (v3) will
no longer support Node.js ${version} in January 2026.

To continue receiving updates to AWS services, bug fixes, and security
updates please upgrade to a supported Node.js LTS version.

More information can be found at: https://a.co/c895JFp`);
  }
};
function setCredentialFeature(credentials, feature, value) {
  if (!credentials.$source) {
    credentials.$source = {};
  }
  credentials.$source[feature] = value;
  return credentials;
}
function setFeature(context, feature, value) {
  if (!context.__aws_sdk_context) {
    context.__aws_sdk_context = {
      features: {}
    };
  } else if (!context.__aws_sdk_context.features) {
    context.__aws_sdk_context.features = {};
  }
  context.__aws_sdk_context.features[feature] = value;
}
const getDateHeader = (response) => HttpResponse.isInstance(response) ? response.headers?.date ?? response.headers?.Date : void 0;
const getSkewCorrectedDate = (systemClockOffset) => new Date(Date.now() + systemClockOffset);
const isClockSkewed = (clockTime, systemClockOffset) => Math.abs(getSkewCorrectedDate(systemClockOffset).getTime() - clockTime) >= 3e5;
const getUpdatedSystemClockOffset = (clockTime, currentSystemClockOffset) => {
  const clockTimeInMs = Date.parse(clockTime);
  if (isClockSkewed(clockTimeInMs, currentSystemClockOffset)) {
    return clockTimeInMs - Date.now();
  }
  return currentSystemClockOffset;
};
const throwSigningPropertyError = (name, property) => {
  if (!property) {
    throw new Error(`Property \`${name}\` is not resolved for AWS SDK SigV4Auth`);
  }
  return property;
};
const validateSigningProperties = async (signingProperties) => {
  const context = throwSigningPropertyError("context", signingProperties.context);
  const config = throwSigningPropertyError("config", signingProperties.config);
  const authScheme = context.endpointV2?.properties?.authSchemes?.[0];
  const signerFunction = throwSigningPropertyError("signer", config.signer);
  const signer = await signerFunction(authScheme);
  const signingRegion = signingProperties?.signingRegion;
  const signingRegionSet = signingProperties?.signingRegionSet;
  const signingName = signingProperties?.signingName;
  return {
    config,
    signer,
    signingRegion,
    signingRegionSet,
    signingName
  };
};
class AwsSdkSigV4Signer {
  async sign(httpRequest, identity, signingProperties) {
    if (!HttpRequest.isInstance(httpRequest)) {
      throw new Error("The request is not an instance of `HttpRequest` and cannot be signed");
    }
    const validatedProps = await validateSigningProperties(signingProperties);
    const { config, signer } = validatedProps;
    let { signingRegion, signingName } = validatedProps;
    const handlerExecutionContext = signingProperties.context;
    if (handlerExecutionContext?.authSchemes?.length ?? 0 > 1) {
      const [first, second] = handlerExecutionContext.authSchemes;
      if (first?.name === "sigv4a" && second?.name === "sigv4") {
        signingRegion = second?.signingRegion ?? signingRegion;
        signingName = second?.signingName ?? signingName;
      }
    }
    const signedRequest = await signer.sign(httpRequest, {
      signingDate: getSkewCorrectedDate(config.systemClockOffset),
      signingRegion,
      signingService: signingName
    });
    return signedRequest;
  }
  errorHandler(signingProperties) {
    return (error) => {
      const serverTime = error.ServerTime ?? getDateHeader(error.$response);
      if (serverTime) {
        const config = throwSigningPropertyError("config", signingProperties.config);
        const initialSystemClockOffset = config.systemClockOffset;
        config.systemClockOffset = getUpdatedSystemClockOffset(serverTime, config.systemClockOffset);
        const clockSkewCorrected = config.systemClockOffset !== initialSystemClockOffset;
        if (clockSkewCorrected && error.$metadata) {
          error.$metadata.clockSkewCorrected = true;
        }
      }
      throw error;
    };
  }
  successHandler(httpResponse, signingProperties) {
    const dateHeader = getDateHeader(httpResponse);
    if (dateHeader) {
      const config = throwSigningPropertyError("config", signingProperties.config);
      config.systemClockOffset = getUpdatedSystemClockOffset(dateHeader, config.systemClockOffset);
    }
  }
}
class AwsSdkSigV4ASigner extends AwsSdkSigV4Signer {
  async sign(httpRequest, identity, signingProperties) {
    if (!HttpRequest.isInstance(httpRequest)) {
      throw new Error("The request is not an instance of `HttpRequest` and cannot be signed");
    }
    const { config, signer, signingRegion, signingRegionSet, signingName } = await validateSigningProperties(signingProperties);
    const configResolvedSigningRegionSet = await config.sigv4aSigningRegionSet?.();
    const multiRegionOverride = (configResolvedSigningRegionSet ?? signingRegionSet ?? [signingRegion]).join(",");
    const signedRequest = await signer.sign(httpRequest, {
      signingDate: getSkewCorrectedDate(config.systemClockOffset),
      signingRegion: multiRegionOverride,
      signingService: signingName
    });
    return signedRequest;
  }
}
const getArrayForCommaSeparatedString = (str) => typeof str === "string" && str.length > 0 ? str.split(",").map((item) => item.trim()) : [];
const getBearerTokenEnvKey = (signingName) => `AWS_BEARER_TOKEN_${signingName.replace(/[\s-]/g, "_").toUpperCase()}`;
const NODE_AUTH_SCHEME_PREFERENCE_ENV_KEY = "AWS_AUTH_SCHEME_PREFERENCE";
const NODE_AUTH_SCHEME_PREFERENCE_CONFIG_KEY = "auth_scheme_preference";
const NODE_AUTH_SCHEME_PREFERENCE_OPTIONS = {
  environmentVariableSelector: (env, options) => {
    if (options?.signingName) {
      const bearerTokenKey = getBearerTokenEnvKey(options.signingName);
      if (bearerTokenKey in env)
        return ["httpBearerAuth"];
    }
    if (!(NODE_AUTH_SCHEME_PREFERENCE_ENV_KEY in env))
      return void 0;
    return getArrayForCommaSeparatedString(env[NODE_AUTH_SCHEME_PREFERENCE_ENV_KEY]);
  },
  configFileSelector: (profile) => {
    if (!(NODE_AUTH_SCHEME_PREFERENCE_CONFIG_KEY in profile))
      return void 0;
    return getArrayForCommaSeparatedString(profile[NODE_AUTH_SCHEME_PREFERENCE_CONFIG_KEY]);
  },
  default: []
};
const resolveAwsSdkSigV4AConfig = (config) => {
  config.sigv4aSigningRegionSet = normalizeProvider(config.sigv4aSigningRegionSet);
  return config;
};
const NODE_SIGV4A_CONFIG_OPTIONS = {
  environmentVariableSelector(env) {
    if (env.AWS_SIGV4A_SIGNING_REGION_SET) {
      return env.AWS_SIGV4A_SIGNING_REGION_SET.split(",").map((_) => _.trim());
    }
    throw new ProviderError("AWS_SIGV4A_SIGNING_REGION_SET not set in env.", {
      tryNextLink: true
    });
  },
  configFileSelector(profile) {
    if (profile.sigv4a_signing_region_set) {
      return (profile.sigv4a_signing_region_set ?? "").split(",").map((_) => _.trim());
    }
    throw new ProviderError("sigv4a_signing_region_set not set in profile.", {
      tryNextLink: true
    });
  },
  default: void 0
};
const resolveAwsSdkSigV4Config = (config) => {
  let inputCredentials = config.credentials;
  let isUserSupplied = !!config.credentials;
  let resolvedCredentials = void 0;
  Object.defineProperty(config, "credentials", {
    set(credentials) {
      if (credentials && credentials !== inputCredentials && credentials !== resolvedCredentials) {
        isUserSupplied = true;
      }
      inputCredentials = credentials;
      const memoizedProvider = normalizeCredentialProvider(config, {
        credentials: inputCredentials,
        credentialDefaultProvider: config.credentialDefaultProvider
      });
      const boundProvider = bindCallerConfig(config, memoizedProvider);
      if (isUserSupplied && !boundProvider.attributed) {
        const isCredentialObject = typeof inputCredentials === "object" && inputCredentials !== null;
        resolvedCredentials = async (options) => {
          const creds = await boundProvider(options);
          const attributedCreds = creds;
          if (isCredentialObject && (!attributedCreds.$source || Object.keys(attributedCreds.$source).length === 0)) {
            return setCredentialFeature(attributedCreds, "CREDENTIALS_CODE", "e");
          }
          return attributedCreds;
        };
        resolvedCredentials.memoized = boundProvider.memoized;
        resolvedCredentials.configBound = boundProvider.configBound;
        resolvedCredentials.attributed = true;
      } else {
        resolvedCredentials = boundProvider;
      }
    },
    get() {
      return resolvedCredentials;
    },
    enumerable: true,
    configurable: true
  });
  config.credentials = inputCredentials;
  const { signingEscapePath = true, systemClockOffset = config.systemClockOffset || 0, sha256 } = config;
  let signer;
  if (config.signer) {
    signer = normalizeProvider(config.signer);
  } else if (config.regionInfoProvider) {
    signer = () => normalizeProvider(config.region)().then(async (region) => [
      await config.regionInfoProvider(region, {
        useFipsEndpoint: await config.useFipsEndpoint(),
        useDualstackEndpoint: await config.useDualstackEndpoint()
      }) || {},
      region
    ]).then(([regionInfo, region]) => {
      const { signingRegion, signingService } = regionInfo;
      config.signingRegion = config.signingRegion || signingRegion || region;
      config.signingName = config.signingName || signingService || config.serviceId;
      const params = {
        ...config,
        credentials: config.credentials,
        region: config.signingRegion,
        service: config.signingName,
        sha256,
        uriEscapePath: signingEscapePath
      };
      const SignerCtor = config.signerConstructor || SignatureV4;
      return new SignerCtor(params);
    });
  } else {
    signer = async (authScheme) => {
      authScheme = Object.assign({}, {
        name: "sigv4",
        signingName: config.signingName || config.defaultSigningName,
        signingRegion: await normalizeProvider(config.region)(),
        properties: {}
      }, authScheme);
      const signingRegion = authScheme.signingRegion;
      const signingService = authScheme.signingName;
      config.signingRegion = config.signingRegion || signingRegion;
      config.signingName = config.signingName || signingService || config.serviceId;
      const params = {
        ...config,
        credentials: config.credentials,
        region: config.signingRegion,
        service: config.signingName,
        sha256,
        uriEscapePath: signingEscapePath
      };
      const SignerCtor = config.signerConstructor || SignatureV4;
      return new SignerCtor(params);
    };
  }
  const resolvedConfig = Object.assign(config, {
    systemClockOffset,
    signingEscapePath,
    signer
  });
  return resolvedConfig;
};
function normalizeCredentialProvider(config, { credentials, credentialDefaultProvider }) {
  let credentialsProvider;
  if (credentials) {
    if (!credentials?.memoized) {
      credentialsProvider = memoizeIdentityProvider(credentials, isIdentityExpired, doesIdentityRequireRefresh);
    } else {
      credentialsProvider = credentials;
    }
  } else {
    if (credentialDefaultProvider) {
      credentialsProvider = normalizeProvider(credentialDefaultProvider(Object.assign({}, config, {
        parentClientConfig: config
      })));
    } else {
      credentialsProvider = async () => {
        throw new Error("@aws-sdk/core::resolveAwsSdkSigV4Config - `credentials` not provided and no credentialDefaultProvider was configured.");
      };
    }
  }
  credentialsProvider.memoized = true;
  return credentialsProvider;
}
function bindCallerConfig(config, credentialsProvider) {
  if (credentialsProvider.configBound) {
    return credentialsProvider;
  }
  const fn = async (options) => credentialsProvider({ ...options, callerClientConfig: config });
  fn.memoized = credentialsProvider.memoized;
  fn.configBound = true;
  return fn;
}
class ProtocolLib {
  queryCompat;
  constructor(queryCompat = false) {
    this.queryCompat = queryCompat;
  }
  resolveRestContentType(defaultContentType, inputSchema) {
    const members = inputSchema.getMemberSchemas();
    const httpPayloadMember = Object.values(members).find((m) => {
      return !!m.getMergedTraits().httpPayload;
    });
    if (httpPayloadMember) {
      const mediaType = httpPayloadMember.getMergedTraits().mediaType;
      if (mediaType) {
        return mediaType;
      } else if (httpPayloadMember.isStringSchema()) {
        return "text/plain";
      } else if (httpPayloadMember.isBlobSchema()) {
        return "application/octet-stream";
      } else {
        return defaultContentType;
      }
    } else if (!inputSchema.isUnitSchema()) {
      const hasBody = Object.values(members).find((m) => {
        const { httpQuery, httpQueryParams, httpHeader, httpLabel, httpPrefixHeaders } = m.getMergedTraits();
        const noPrefixHeaders = httpPrefixHeaders === void 0;
        return !httpQuery && !httpQueryParams && !httpHeader && !httpLabel && noPrefixHeaders;
      });
      if (hasBody) {
        return defaultContentType;
      }
    }
  }
  async getErrorSchemaOrThrowBaseException(errorIdentifier, defaultNamespace, response, dataObject, metadata, getErrorSchema) {
    let namespace = defaultNamespace;
    let errorName = errorIdentifier;
    if (errorIdentifier.includes("#")) {
      [namespace, errorName] = errorIdentifier.split("#");
    }
    const errorMetadata = {
      $metadata: metadata,
      $fault: response.statusCode < 500 ? "client" : "server"
    };
    const registry = TypeRegistry.for(namespace);
    try {
      const errorSchema = getErrorSchema?.(registry, errorName) ?? registry.getSchema(errorIdentifier);
      return { errorSchema, errorMetadata };
    } catch (e) {
      dataObject.message = dataObject.message ?? dataObject.Message ?? "UnknownError";
      const synthetic = TypeRegistry.for("smithy.ts.sdk.synthetic." + namespace);
      const baseExceptionSchema = synthetic.getBaseException();
      if (baseExceptionSchema) {
        const ErrorCtor = synthetic.getErrorCtor(baseExceptionSchema) ?? Error;
        throw this.decorateServiceException(Object.assign(new ErrorCtor({ name: errorName }), errorMetadata), dataObject);
      }
      throw this.decorateServiceException(Object.assign(new Error(errorName), errorMetadata), dataObject);
    }
  }
  decorateServiceException(exception, additions = {}) {
    if (this.queryCompat) {
      const msg = exception.Message ?? additions.Message;
      const error = decorateServiceException(exception, additions);
      if (msg) {
        error.message = msg;
      }
      error.Error = {
        ...error.Error,
        Type: error.Error?.Type,
        Code: error.Error?.Code,
        Message: error.Error?.message ?? error.Error?.Message ?? msg
      };
      const reqId = error.$metadata.requestId;
      if (reqId) {
        error.RequestId = reqId;
      }
      return error;
    }
    return decorateServiceException(exception, additions);
  }
  setQueryCompatError(output, response) {
    const queryErrorHeader = response.headers?.["x-amzn-query-error"];
    if (output !== void 0 && queryErrorHeader != null) {
      const [Code, Type] = queryErrorHeader.split(";");
      const entries = Object.entries(output);
      const Error2 = {
        Code,
        Type
      };
      Object.assign(output, Error2);
      for (const [k, v] of entries) {
        Error2[k === "message" ? "Message" : k] = v;
      }
      delete Error2.__type;
      output.Error = Error2;
    }
  }
  queryCompatOutput(queryCompatErrorData, errorData) {
    if (queryCompatErrorData.Error) {
      errorData.Error = queryCompatErrorData.Error;
    }
    if (queryCompatErrorData.Type) {
      errorData.Type = queryCompatErrorData.Type;
    }
    if (queryCompatErrorData.Code) {
      errorData.Code = queryCompatErrorData.Code;
    }
  }
  findQueryCompatibleError(registry, errorName) {
    try {
      return registry.getSchema(errorName);
    } catch (e) {
      return registry.find((schema) => NormalizedSchema.of(schema).getMergedTraits().awsQueryError?.[0] === errorName);
    }
  }
}
class SerdeContextConfig {
  serdeContext;
  setSerdeContext(serdeContext) {
    this.serdeContext = serdeContext;
  }
}
class UnionSerde {
  from;
  to;
  keys;
  constructor(from, to) {
    this.from = from;
    this.to = to;
    this.keys = new Set(Object.keys(this.from).filter((k) => k !== "__type"));
  }
  mark(key) {
    this.keys.delete(key);
  }
  hasUnknown() {
    return this.keys.size === 1 && Object.keys(this.to).length === 0;
  }
  writeUnknown() {
    if (this.hasUnknown()) {
      const k = this.keys.values().next().value;
      const v = this.from[k];
      this.to.$unknown = [k, v];
    }
  }
}
function jsonReviver(key, value, context) {
  if (context?.source) {
    const numericString = context.source;
    if (typeof value === "number") {
      if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER || numericString !== String(value)) {
        const isFractional = numericString.includes(".");
        if (isFractional) {
          return new NumericValue(numericString, "bigDecimal");
        } else {
          return BigInt(numericString);
        }
      }
    }
  }
  return value;
}
const collectBodyString = (streamBody, context) => collectBody(streamBody, context).then((body) => (context?.utf8Encoder ?? toUtf8)(body));
const parseJsonBody = (streamBody, context) => collectBodyString(streamBody, context).then((encoded) => {
  if (encoded.length) {
    try {
      return JSON.parse(encoded);
    } catch (e) {
      if (e?.name === "SyntaxError") {
        Object.defineProperty(e, "$responseBodyText", {
          value: encoded
        });
      }
      throw e;
    }
  }
  return {};
});
const loadRestJsonErrorCode = (output, data) => {
  const findKey = (object, key) => Object.keys(object).find((k) => k.toLowerCase() === key.toLowerCase());
  const sanitizeErrorCode = (rawValue) => {
    let cleanValue = rawValue;
    if (typeof cleanValue === "number") {
      cleanValue = cleanValue.toString();
    }
    if (cleanValue.indexOf(",") >= 0) {
      cleanValue = cleanValue.split(",")[0];
    }
    if (cleanValue.indexOf(":") >= 0) {
      cleanValue = cleanValue.split(":")[0];
    }
    if (cleanValue.indexOf("#") >= 0) {
      cleanValue = cleanValue.split("#")[1];
    }
    return cleanValue;
  };
  const headerKey = findKey(output.headers, "x-amzn-errortype");
  if (headerKey !== void 0) {
    return sanitizeErrorCode(output.headers[headerKey]);
  }
  if (data && typeof data === "object") {
    const codeKey = findKey(data, "code");
    if (codeKey && data[codeKey] !== void 0) {
      return sanitizeErrorCode(data[codeKey]);
    }
    if (data["__type"] !== void 0) {
      return sanitizeErrorCode(data["__type"]);
    }
  }
};
class JsonShapeDeserializer extends SerdeContextConfig {
  settings;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  async read(schema, data) {
    return this._read(schema, typeof data === "string" ? JSON.parse(data, jsonReviver) : await parseJsonBody(data, this.serdeContext));
  }
  readObject(schema, data) {
    return this._read(schema, data);
  }
  _read(schema, value) {
    const isObject = value !== null && typeof value === "object";
    const ns = NormalizedSchema.of(schema);
    if (isObject) {
      if (ns.isStructSchema()) {
        const record = value;
        const union = ns.isUnionSchema();
        const out = {};
        let nameMap = void 0;
        const { jsonName } = this.settings;
        if (jsonName) {
          nameMap = {};
        }
        let unionSerde;
        if (union) {
          unionSerde = new UnionSerde(record, out);
        }
        for (const [memberName, memberSchema] of ns.structIterator()) {
          let fromKey = memberName;
          if (jsonName) {
            fromKey = memberSchema.getMergedTraits().jsonName ?? fromKey;
            nameMap[fromKey] = memberName;
          }
          if (union) {
            unionSerde.mark(fromKey);
          }
          if (record[fromKey] != null) {
            out[memberName] = this._read(memberSchema, record[fromKey]);
          }
        }
        if (union) {
          unionSerde.writeUnknown();
        } else if (typeof record.__type === "string") {
          for (const [k, v] of Object.entries(record)) {
            const t = jsonName ? nameMap[k] ?? k : k;
            if (!(t in out)) {
              out[t] = v;
            }
          }
        }
        return out;
      }
      if (Array.isArray(value) && ns.isListSchema()) {
        const listMember = ns.getValueSchema();
        const out = [];
        const sparse = !!ns.getMergedTraits().sparse;
        for (const item of value) {
          if (sparse || item != null) {
            out.push(this._read(listMember, item));
          }
        }
        return out;
      }
      if (ns.isMapSchema()) {
        const mapMember = ns.getValueSchema();
        const out = {};
        const sparse = !!ns.getMergedTraits().sparse;
        for (const [_k, _v] of Object.entries(value)) {
          if (sparse || _v != null) {
            out[_k] = this._read(mapMember, _v);
          }
        }
        return out;
      }
    }
    if (ns.isBlobSchema() && typeof value === "string") {
      return fromBase64(value);
    }
    const mediaType = ns.getMergedTraits().mediaType;
    if (ns.isStringSchema() && typeof value === "string" && mediaType) {
      const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
      if (isJson) {
        return LazyJsonString.from(value);
      }
      return value;
    }
    if (ns.isTimestampSchema() && value != null) {
      const format = determineTimestampFormat(ns, this.settings);
      switch (format) {
        case 5:
          return parseRfc3339DateTimeWithOffset(value);
        case 6:
          return parseRfc7231DateTime(value);
        case 7:
          return parseEpochTimestamp(value);
        default:
          console.warn("Missing timestamp format, parsing value with Date constructor:", value);
          return new Date(value);
      }
    }
    if (ns.isBigIntegerSchema() && (typeof value === "number" || typeof value === "string")) {
      return BigInt(value);
    }
    if (ns.isBigDecimalSchema() && value != void 0) {
      if (value instanceof NumericValue) {
        return value;
      }
      const untyped = value;
      if (untyped.type === "bigDecimal" && "string" in untyped) {
        return new NumericValue(untyped.string, untyped.type);
      }
      return new NumericValue(String(value), "bigDecimal");
    }
    if (ns.isNumericSchema() && typeof value === "string") {
      switch (value) {
        case "Infinity":
          return Infinity;
        case "-Infinity":
          return -Infinity;
        case "NaN":
          return NaN;
      }
      return value;
    }
    if (ns.isDocumentSchema()) {
      if (isObject) {
        const out = Array.isArray(value) ? [] : {};
        for (const [k, v] of Object.entries(value)) {
          if (v instanceof NumericValue) {
            out[k] = v;
          } else {
            out[k] = this._read(ns, v);
          }
        }
        return out;
      } else {
        return structuredClone(value);
      }
    }
    return value;
  }
}
const NUMERIC_CONTROL_CHAR = String.fromCharCode(925);
class JsonReplacer {
  values = /* @__PURE__ */ new Map();
  counter = 0;
  stage = 0;
  createReplacer() {
    if (this.stage === 1) {
      throw new Error("@aws-sdk/core/protocols - JsonReplacer already created.");
    }
    if (this.stage === 2) {
      throw new Error("@aws-sdk/core/protocols - JsonReplacer exhausted.");
    }
    this.stage = 1;
    return (key, value) => {
      if (value instanceof NumericValue) {
        const v = `${NUMERIC_CONTROL_CHAR + "nv" + this.counter++}_` + value.string;
        this.values.set(`"${v}"`, value.string);
        return v;
      }
      if (typeof value === "bigint") {
        const s = value.toString();
        const v = `${NUMERIC_CONTROL_CHAR + "b" + this.counter++}_` + s;
        this.values.set(`"${v}"`, s);
        return v;
      }
      return value;
    };
  }
  replaceInJson(json) {
    if (this.stage === 0) {
      throw new Error("@aws-sdk/core/protocols - JsonReplacer not created yet.");
    }
    if (this.stage === 2) {
      throw new Error("@aws-sdk/core/protocols - JsonReplacer exhausted.");
    }
    this.stage = 2;
    if (this.counter === 0) {
      return json;
    }
    for (const [key, value] of this.values) {
      json = json.replace(key, value);
    }
    return json;
  }
}
class JsonShapeSerializer extends SerdeContextConfig {
  settings;
  buffer;
  useReplacer = false;
  rootSchema;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  write(schema, value) {
    this.rootSchema = NormalizedSchema.of(schema);
    this.buffer = this._write(this.rootSchema, value);
  }
  writeDiscriminatedDocument(schema, value) {
    this.write(schema, value);
    if (typeof this.buffer === "object") {
      this.buffer.__type = NormalizedSchema.of(schema).getName(true);
    }
  }
  flush() {
    const { rootSchema, useReplacer } = this;
    this.rootSchema = void 0;
    this.useReplacer = false;
    if (rootSchema?.isStructSchema() || rootSchema?.isDocumentSchema()) {
      if (!useReplacer) {
        return JSON.stringify(this.buffer);
      }
      const replacer = new JsonReplacer();
      return replacer.replaceInJson(JSON.stringify(this.buffer, replacer.createReplacer(), 0));
    }
    return this.buffer;
  }
  _write(schema, value, container) {
    const isObject = value !== null && typeof value === "object";
    const ns = NormalizedSchema.of(schema);
    if (isObject) {
      if (ns.isStructSchema()) {
        const record = value;
        const out = {};
        const { jsonName } = this.settings;
        let nameMap = void 0;
        if (jsonName) {
          nameMap = {};
        }
        for (const [memberName, memberSchema] of ns.structIterator()) {
          const serializableValue = this._write(memberSchema, record[memberName], ns);
          if (serializableValue !== void 0) {
            let targetKey = memberName;
            if (jsonName) {
              targetKey = memberSchema.getMergedTraits().jsonName ?? memberName;
              nameMap[memberName] = targetKey;
            }
            out[targetKey] = serializableValue;
          }
        }
        if (ns.isUnionSchema() && Object.keys(out).length === 0) {
          const { $unknown } = record;
          if (Array.isArray($unknown)) {
            const [k, v] = $unknown;
            out[k] = this._write(15, v);
          }
        } else if (typeof record.__type === "string") {
          for (const [k, v] of Object.entries(record)) {
            const targetKey = jsonName ? nameMap[k] ?? k : k;
            if (!(targetKey in out)) {
              out[targetKey] = this._write(15, v);
            }
          }
        }
        return out;
      }
      if (Array.isArray(value) && ns.isListSchema()) {
        const listMember = ns.getValueSchema();
        const out = [];
        const sparse = !!ns.getMergedTraits().sparse;
        for (const item of value) {
          if (sparse || item != null) {
            out.push(this._write(listMember, item));
          }
        }
        return out;
      }
      if (ns.isMapSchema()) {
        const mapMember = ns.getValueSchema();
        const out = {};
        const sparse = !!ns.getMergedTraits().sparse;
        for (const [_k, _v] of Object.entries(value)) {
          if (sparse || _v != null) {
            out[_k] = this._write(mapMember, _v);
          }
        }
        return out;
      }
      if (value instanceof Uint8Array && (ns.isBlobSchema() || ns.isDocumentSchema())) {
        if (ns === this.rootSchema) {
          return value;
        }
        return (this.serdeContext?.base64Encoder ?? toBase64)(value);
      }
      if (value instanceof Date && (ns.isTimestampSchema() || ns.isDocumentSchema())) {
        const format = determineTimestampFormat(ns, this.settings);
        switch (format) {
          case 5:
            return value.toISOString().replace(".000Z", "Z");
          case 6:
            return dateToUtcString(value);
          case 7:
            return value.getTime() / 1e3;
          default:
            console.warn("Missing timestamp format, using epoch seconds", value);
            return value.getTime() / 1e3;
        }
      }
      if (value instanceof NumericValue) {
        this.useReplacer = true;
      }
    }
    if (value === null && container?.isStructSchema()) {
      return void 0;
    }
    if (ns.isStringSchema()) {
      if (typeof value === "undefined" && ns.isIdempotencyToken()) {
        return v4();
      }
      const mediaType = ns.getMergedTraits().mediaType;
      if (value != null && mediaType) {
        const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
        if (isJson) {
          return LazyJsonString.from(value);
        }
      }
      return value;
    }
    if (typeof value === "number" && ns.isNumericSchema()) {
      if (Math.abs(value) === Infinity || isNaN(value)) {
        return String(value);
      }
      return value;
    }
    if (typeof value === "string" && ns.isBlobSchema()) {
      if (ns === this.rootSchema) {
        return value;
      }
      return (this.serdeContext?.base64Encoder ?? toBase64)(value);
    }
    if (typeof value === "bigint") {
      this.useReplacer = true;
    }
    if (ns.isDocumentSchema()) {
      if (isObject) {
        const out = Array.isArray(value) ? [] : {};
        for (const [k, v] of Object.entries(value)) {
          if (v instanceof NumericValue) {
            this.useReplacer = true;
            out[k] = v;
          } else {
            out[k] = this._write(ns, v);
          }
        }
        return out;
      } else {
        return structuredClone(value);
      }
    }
    return value;
  }
}
class JsonCodec extends SerdeContextConfig {
  settings;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  createSerializer() {
    const serializer = new JsonShapeSerializer(this.settings);
    serializer.setSerdeContext(this.serdeContext);
    return serializer;
  }
  createDeserializer() {
    const deserializer = new JsonShapeDeserializer(this.settings);
    deserializer.setSerdeContext(this.serdeContext);
    return deserializer;
  }
}
class AwsRestJsonProtocol extends HttpBindingProtocol {
  serializer;
  deserializer;
  codec;
  mixin = new ProtocolLib();
  constructor({ defaultNamespace }) {
    super({
      defaultNamespace
    });
    const settings = {
      timestampFormat: {
        useTrait: true,
        default: 7
      },
      httpBindings: true,
      jsonName: true
    };
    this.codec = new JsonCodec(settings);
    this.serializer = new HttpInterceptingShapeSerializer(this.codec.createSerializer(), settings);
    this.deserializer = new HttpInterceptingShapeDeserializer(this.codec.createDeserializer(), settings);
  }
  getShapeId() {
    return "aws.protocols#restJson1";
  }
  getPayloadCodec() {
    return this.codec;
  }
  setSerdeContext(serdeContext) {
    this.codec.setSerdeContext(serdeContext);
    super.setSerdeContext(serdeContext);
  }
  async serializeRequest(operationSchema, input, context) {
    const request = await super.serializeRequest(operationSchema, input, context);
    const inputSchema = NormalizedSchema.of(operationSchema.input);
    if (!request.headers["content-type"]) {
      const contentType = this.mixin.resolveRestContentType(this.getDefaultContentType(), inputSchema);
      if (contentType) {
        request.headers["content-type"] = contentType;
      }
    }
    if (request.body == null && request.headers["content-type"] === this.getDefaultContentType()) {
      request.body = "{}";
    }
    return request;
  }
  async deserializeResponse(operationSchema, context, response) {
    const output = await super.deserializeResponse(operationSchema, context, response);
    const outputSchema = NormalizedSchema.of(operationSchema.output);
    for (const [name, member] of outputSchema.structIterator()) {
      if (member.getMemberTraits().httpPayload && !(name in output)) {
        output[name] = null;
      }
    }
    return output;
  }
  async handleError(operationSchema, context, response, dataObject, metadata) {
    const errorIdentifier = loadRestJsonErrorCode(response, dataObject) ?? "Unknown";
    const { errorSchema, errorMetadata } = await this.mixin.getErrorSchemaOrThrowBaseException(errorIdentifier, this.options.defaultNamespace, response, dataObject, metadata);
    const ns = NormalizedSchema.of(errorSchema);
    const message = dataObject.message ?? dataObject.Message ?? "Unknown";
    const ErrorCtor = TypeRegistry.for(errorSchema[1]).getErrorCtor(errorSchema) ?? Error;
    const exception = new ErrorCtor(message);
    await this.deserializeHttpMessage(errorSchema, context, response, dataObject);
    const output = {};
    for (const [name, member] of ns.structIterator()) {
      const target = member.getMergedTraits().jsonName ?? name;
      output[name] = this.codec.createDeserializer().readObject(member, dataObject[target]);
    }
    throw this.mixin.decorateServiceException(Object.assign(exception, errorMetadata, {
      $fault: ns.getMergedTraits().error,
      message
    }, output), dataObject);
  }
  getDefaultContentType() {
    return "application/json";
  }
}
class XmlShapeDeserializer extends SerdeContextConfig {
  settings;
  stringDeserializer;
  constructor(settings) {
    super();
    this.settings = settings;
    this.stringDeserializer = new FromStringShapeDeserializer(settings);
  }
  setSerdeContext(serdeContext) {
    this.serdeContext = serdeContext;
    this.stringDeserializer.setSerdeContext(serdeContext);
  }
  read(schema, bytes, key) {
    const ns = NormalizedSchema.of(schema);
    const memberSchemas = ns.getMemberSchemas();
    const isEventPayload = ns.isStructSchema() && ns.isMemberSchema() && !!Object.values(memberSchemas).find((memberNs) => {
      return !!memberNs.getMemberTraits().eventPayload;
    });
    if (isEventPayload) {
      const output = {};
      const memberName = Object.keys(memberSchemas)[0];
      const eventMemberSchema = memberSchemas[memberName];
      if (eventMemberSchema.isBlobSchema()) {
        output[memberName] = bytes;
      } else {
        output[memberName] = this.read(memberSchemas[memberName], bytes);
      }
      return output;
    }
    const xmlString = (this.serdeContext?.utf8Encoder ?? toUtf8)(bytes);
    const parsedObject = this.parseXml(xmlString);
    return this.readSchema(schema, key ? parsedObject[key] : parsedObject);
  }
  readSchema(_schema, value) {
    const ns = NormalizedSchema.of(_schema);
    if (ns.isUnitSchema()) {
      return;
    }
    const traits = ns.getMergedTraits();
    if (ns.isListSchema() && !Array.isArray(value)) {
      return this.readSchema(ns, [value]);
    }
    if (value == null) {
      return value;
    }
    if (typeof value === "object") {
      const sparse = !!traits.sparse;
      const flat = !!traits.xmlFlattened;
      if (ns.isListSchema()) {
        const listValue = ns.getValueSchema();
        const buffer2 = [];
        const sourceKey = listValue.getMergedTraits().xmlName ?? "member";
        const source = flat ? value : (value[0] ?? value)[sourceKey];
        const sourceArray = Array.isArray(source) ? source : [source];
        for (const v of sourceArray) {
          if (v != null || sparse) {
            buffer2.push(this.readSchema(listValue, v));
          }
        }
        return buffer2;
      }
      const buffer = {};
      if (ns.isMapSchema()) {
        const keyNs = ns.getKeySchema();
        const memberNs = ns.getValueSchema();
        let entries;
        if (flat) {
          entries = Array.isArray(value) ? value : [value];
        } else {
          entries = Array.isArray(value.entry) ? value.entry : [value.entry];
        }
        const keyProperty = keyNs.getMergedTraits().xmlName ?? "key";
        const valueProperty = memberNs.getMergedTraits().xmlName ?? "value";
        for (const entry of entries) {
          const key = entry[keyProperty];
          const value2 = entry[valueProperty];
          if (value2 != null || sparse) {
            buffer[key] = this.readSchema(memberNs, value2);
          }
        }
        return buffer;
      }
      if (ns.isStructSchema()) {
        const union = ns.isUnionSchema();
        let unionSerde;
        if (union) {
          unionSerde = new UnionSerde(value, buffer);
        }
        for (const [memberName, memberSchema] of ns.structIterator()) {
          const memberTraits = memberSchema.getMergedTraits();
          const xmlObjectKey = !memberTraits.httpPayload ? memberSchema.getMemberTraits().xmlName ?? memberName : memberTraits.xmlName ?? memberSchema.getName();
          if (union) {
            unionSerde.mark(xmlObjectKey);
          }
          if (value[xmlObjectKey] != null) {
            buffer[memberName] = this.readSchema(memberSchema, value[xmlObjectKey]);
          }
        }
        if (union) {
          unionSerde.writeUnknown();
        }
        return buffer;
      }
      if (ns.isDocumentSchema()) {
        return value;
      }
      throw new Error(`@aws-sdk/core/protocols - xml deserializer unhandled schema type for ${ns.getName(true)}`);
    }
    if (ns.isListSchema()) {
      return [];
    }
    if (ns.isMapSchema() || ns.isStructSchema()) {
      return {};
    }
    return this.stringDeserializer.read(ns, value);
  }
  parseXml(xml) {
    if (xml.length) {
      let parsedObj;
      try {
        parsedObj = parseXML(xml);
      } catch (e) {
        if (e && typeof e === "object") {
          Object.defineProperty(e, "$responseBodyText", {
            value: xml
          });
        }
        throw e;
      }
      const textNodeName = "#text";
      const key = Object.keys(parsedObj)[0];
      const parsedObjToReturn = parsedObj[key];
      if (parsedObjToReturn[textNodeName]) {
        parsedObjToReturn[key] = parsedObjToReturn[textNodeName];
        delete parsedObjToReturn[textNodeName];
      }
      return getValueFromTextNode(parsedObjToReturn);
    }
    return {};
  }
}
class QueryShapeSerializer extends SerdeContextConfig {
  settings;
  buffer;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  write(schema, value, prefix = "") {
    if (this.buffer === void 0) {
      this.buffer = "";
    }
    const ns = NormalizedSchema.of(schema);
    if (prefix && !prefix.endsWith(".")) {
      prefix += ".";
    }
    if (ns.isBlobSchema()) {
      if (typeof value === "string" || value instanceof Uint8Array) {
        this.writeKey(prefix);
        this.writeValue((this.serdeContext?.base64Encoder ?? toBase64)(value));
      }
    } else if (ns.isBooleanSchema() || ns.isNumericSchema() || ns.isStringSchema()) {
      if (value != null) {
        this.writeKey(prefix);
        this.writeValue(String(value));
      } else if (ns.isIdempotencyToken()) {
        this.writeKey(prefix);
        this.writeValue(v4());
      }
    } else if (ns.isBigIntegerSchema()) {
      if (value != null) {
        this.writeKey(prefix);
        this.writeValue(String(value));
      }
    } else if (ns.isBigDecimalSchema()) {
      if (value != null) {
        this.writeKey(prefix);
        this.writeValue(value instanceof NumericValue ? value.string : String(value));
      }
    } else if (ns.isTimestampSchema()) {
      if (value instanceof Date) {
        this.writeKey(prefix);
        const format = determineTimestampFormat(ns, this.settings);
        switch (format) {
          case 5:
            this.writeValue(value.toISOString().replace(".000Z", "Z"));
            break;
          case 6:
            this.writeValue(dateToUtcString(value));
            break;
          case 7:
            this.writeValue(String(value.getTime() / 1e3));
            break;
        }
      }
    } else if (ns.isDocumentSchema()) {
      if (Array.isArray(value)) {
        this.write(64 | 15, value, prefix);
      } else if (value instanceof Date) {
        this.write(4, value, prefix);
      } else if (value instanceof Uint8Array) {
        this.write(21, value, prefix);
      } else if (value && typeof value === "object") {
        this.write(128 | 15, value, prefix);
      } else {
        this.writeKey(prefix);
        this.writeValue(String(value));
      }
    } else if (ns.isListSchema()) {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          if (this.settings.serializeEmptyLists) {
            this.writeKey(prefix);
            this.writeValue("");
          }
        } else {
          const member = ns.getValueSchema();
          const flat = this.settings.flattenLists || ns.getMergedTraits().xmlFlattened;
          let i = 1;
          for (const item of value) {
            if (item == null) {
              continue;
            }
            const traits = member.getMergedTraits();
            const suffix = this.getKey("member", traits.xmlName, traits.ec2QueryName);
            const key = flat ? `${prefix}${i}` : `${prefix}${suffix}.${i}`;
            this.write(member, item, key);
            ++i;
          }
        }
      }
    } else if (ns.isMapSchema()) {
      if (value && typeof value === "object") {
        const keySchema = ns.getKeySchema();
        const memberSchema = ns.getValueSchema();
        const flat = ns.getMergedTraits().xmlFlattened;
        let i = 1;
        for (const [k, v] of Object.entries(value)) {
          if (v == null) {
            continue;
          }
          const keyTraits = keySchema.getMergedTraits();
          const keySuffix = this.getKey("key", keyTraits.xmlName, keyTraits.ec2QueryName);
          const key = flat ? `${prefix}${i}.${keySuffix}` : `${prefix}entry.${i}.${keySuffix}`;
          const valTraits = memberSchema.getMergedTraits();
          const valueSuffix = this.getKey("value", valTraits.xmlName, valTraits.ec2QueryName);
          const valueKey = flat ? `${prefix}${i}.${valueSuffix}` : `${prefix}entry.${i}.${valueSuffix}`;
          this.write(keySchema, k, key);
          this.write(memberSchema, v, valueKey);
          ++i;
        }
      }
    } else if (ns.isStructSchema()) {
      if (value && typeof value === "object") {
        let didWriteMember = false;
        for (const [memberName, member] of ns.structIterator()) {
          if (value[memberName] == null && !member.isIdempotencyToken()) {
            continue;
          }
          const traits = member.getMergedTraits();
          const suffix = this.getKey(memberName, traits.xmlName, traits.ec2QueryName, "struct");
          const key = `${prefix}${suffix}`;
          this.write(member, value[memberName], key);
          didWriteMember = true;
        }
        if (!didWriteMember && ns.isUnionSchema()) {
          const { $unknown } = value;
          if (Array.isArray($unknown)) {
            const [k, v] = $unknown;
            const key = `${prefix}${k}`;
            this.write(15, v, key);
          }
        }
      }
    } else if (ns.isUnitSchema()) ;
    else {
      throw new Error(`@aws-sdk/core/protocols - QuerySerializer unrecognized schema type ${ns.getName(true)}`);
    }
  }
  flush() {
    if (this.buffer === void 0) {
      throw new Error("@aws-sdk/core/protocols - QuerySerializer cannot flush with nothing written to buffer.");
    }
    const str = this.buffer;
    delete this.buffer;
    return str;
  }
  getKey(memberName, xmlName, ec2QueryName, keySource) {
    const { ec2, capitalizeKeys } = this.settings;
    if (ec2 && ec2QueryName) {
      return ec2QueryName;
    }
    const key = xmlName ?? memberName;
    if (capitalizeKeys && keySource === "struct") {
      return key[0].toUpperCase() + key.slice(1);
    }
    return key;
  }
  writeKey(key) {
    if (key.endsWith(".")) {
      key = key.slice(0, key.length - 1);
    }
    this.buffer += `&${extendedEncodeURIComponent(key)}=`;
  }
  writeValue(value) {
    this.buffer += extendedEncodeURIComponent(value);
  }
}
class AwsQueryProtocol extends RpcProtocol {
  options;
  serializer;
  deserializer;
  mixin = new ProtocolLib();
  constructor(options) {
    super({
      defaultNamespace: options.defaultNamespace
    });
    this.options = options;
    const settings = {
      timestampFormat: {
        useTrait: true,
        default: 5
      },
      httpBindings: false,
      xmlNamespace: options.xmlNamespace,
      serviceNamespace: options.defaultNamespace,
      serializeEmptyLists: true
    };
    this.serializer = new QueryShapeSerializer(settings);
    this.deserializer = new XmlShapeDeserializer(settings);
  }
  getShapeId() {
    return "aws.protocols#awsQuery";
  }
  setSerdeContext(serdeContext) {
    this.serializer.setSerdeContext(serdeContext);
    this.deserializer.setSerdeContext(serdeContext);
  }
  getPayloadCodec() {
    throw new Error("AWSQuery protocol has no payload codec.");
  }
  async serializeRequest(operationSchema, input, context) {
    const request = await super.serializeRequest(operationSchema, input, context);
    if (!request.path.endsWith("/")) {
      request.path += "/";
    }
    Object.assign(request.headers, {
      "content-type": `application/x-www-form-urlencoded`
    });
    if (deref(operationSchema.input) === "unit" || !request.body) {
      request.body = "";
    }
    const action = operationSchema.name.split("#")[1] ?? operationSchema.name;
    request.body = `Action=${action}&Version=${this.options.version}` + request.body;
    if (request.body.endsWith("&")) {
      request.body = request.body.slice(-1);
    }
    return request;
  }
  async deserializeResponse(operationSchema, context, response) {
    const deserializer = this.deserializer;
    const ns = NormalizedSchema.of(operationSchema.output);
    const dataObject = {};
    if (response.statusCode >= 300) {
      const bytes2 = await collectBody(response.body, context);
      if (bytes2.byteLength > 0) {
        Object.assign(dataObject, await deserializer.read(15, bytes2));
      }
      await this.handleError(operationSchema, context, response, dataObject, this.deserializeMetadata(response));
    }
    for (const header in response.headers) {
      const value = response.headers[header];
      delete response.headers[header];
      response.headers[header.toLowerCase()] = value;
    }
    const shortName = operationSchema.name.split("#")[1] ?? operationSchema.name;
    const awsQueryResultKey = ns.isStructSchema() && this.useNestedResult() ? shortName + "Result" : void 0;
    const bytes = await collectBody(response.body, context);
    if (bytes.byteLength > 0) {
      Object.assign(dataObject, await deserializer.read(ns, bytes, awsQueryResultKey));
    }
    const output = {
      $metadata: this.deserializeMetadata(response),
      ...dataObject
    };
    return output;
  }
  useNestedResult() {
    return true;
  }
  async handleError(operationSchema, context, response, dataObject, metadata) {
    const errorIdentifier = this.loadQueryErrorCode(response, dataObject) ?? "Unknown";
    const errorData = this.loadQueryError(dataObject) ?? {};
    const message = this.loadQueryErrorMessage(dataObject);
    errorData.message = message;
    errorData.Error = {
      Type: errorData.Type,
      Code: errorData.Code,
      Message: message
    };
    const { errorSchema, errorMetadata } = await this.mixin.getErrorSchemaOrThrowBaseException(errorIdentifier, this.options.defaultNamespace, response, errorData, metadata, this.mixin.findQueryCompatibleError);
    const ns = NormalizedSchema.of(errorSchema);
    const ErrorCtor = TypeRegistry.for(errorSchema[1]).getErrorCtor(errorSchema) ?? Error;
    const exception = new ErrorCtor(message);
    const output = {
      Type: errorData.Error.Type,
      Code: errorData.Error.Code,
      Error: errorData.Error
    };
    for (const [name, member] of ns.structIterator()) {
      const target = member.getMergedTraits().xmlName ?? name;
      const value = errorData[target] ?? dataObject[target];
      output[name] = this.deserializer.readSchema(member, value);
    }
    throw this.mixin.decorateServiceException(Object.assign(exception, errorMetadata, {
      $fault: ns.getMergedTraits().error,
      message
    }, output), dataObject);
  }
  loadQueryErrorCode(output, data) {
    const code = (data.Errors?.[0]?.Error ?? data.Errors?.Error ?? data.Error)?.Code;
    if (code !== void 0) {
      return code;
    }
    if (output.statusCode == 404) {
      return "NotFound";
    }
  }
  loadQueryError(data) {
    return data.Errors?.[0]?.Error ?? data.Errors?.Error ?? data.Error;
  }
  loadQueryErrorMessage(data) {
    const errorData = this.loadQueryError(data);
    return errorData?.message ?? errorData?.Message ?? data.message ?? data.Message ?? "Unknown";
  }
  getDefaultContentType() {
    return "application/x-www-form-urlencoded";
  }
}
const loadRestXmlErrorCode = (output, data) => {
  if (data?.Error?.Code !== void 0) {
    return data.Error.Code;
  }
  if (data?.Code !== void 0) {
    return data.Code;
  }
  if (output.statusCode == 404) {
    return "NotFound";
  }
};
class XmlShapeSerializer extends SerdeContextConfig {
  settings;
  stringBuffer;
  byteBuffer;
  buffer;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  write(schema, value) {
    const ns = NormalizedSchema.of(schema);
    if (ns.isStringSchema() && typeof value === "string") {
      this.stringBuffer = value;
    } else if (ns.isBlobSchema()) {
      this.byteBuffer = "byteLength" in value ? value : (this.serdeContext?.base64Decoder ?? fromBase64)(value);
    } else {
      this.buffer = this.writeStruct(ns, value, void 0);
      const traits = ns.getMergedTraits();
      if (traits.httpPayload && !traits.xmlName) {
        this.buffer.withName(ns.getName());
      }
    }
  }
  flush() {
    if (this.byteBuffer !== void 0) {
      const bytes = this.byteBuffer;
      delete this.byteBuffer;
      return bytes;
    }
    if (this.stringBuffer !== void 0) {
      const str = this.stringBuffer;
      delete this.stringBuffer;
      return str;
    }
    const buffer = this.buffer;
    if (this.settings.xmlNamespace) {
      if (!buffer?.attributes?.["xmlns"]) {
        buffer.addAttribute("xmlns", this.settings.xmlNamespace);
      }
    }
    delete this.buffer;
    return buffer.toString();
  }
  writeStruct(ns, value, parentXmlns) {
    const traits = ns.getMergedTraits();
    const name = ns.isMemberSchema() && !traits.httpPayload ? ns.getMemberTraits().xmlName ?? ns.getMemberName() : traits.xmlName ?? ns.getName();
    if (!name || !ns.isStructSchema()) {
      throw new Error(`@aws-sdk/core/protocols - xml serializer, cannot write struct with empty name or non-struct, schema=${ns.getName(true)}.`);
    }
    const structXmlNode = XmlNode.of(name);
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(ns, parentXmlns);
    for (const [memberName, memberSchema] of ns.structIterator()) {
      const val = value[memberName];
      if (val != null || memberSchema.isIdempotencyToken()) {
        if (memberSchema.getMergedTraits().xmlAttribute) {
          structXmlNode.addAttribute(memberSchema.getMergedTraits().xmlName ?? memberName, this.writeSimple(memberSchema, val));
          continue;
        }
        if (memberSchema.isListSchema()) {
          this.writeList(memberSchema, val, structXmlNode, xmlns);
        } else if (memberSchema.isMapSchema()) {
          this.writeMap(memberSchema, val, structXmlNode, xmlns);
        } else if (memberSchema.isStructSchema()) {
          structXmlNode.addChildNode(this.writeStruct(memberSchema, val, xmlns));
        } else {
          const memberNode = XmlNode.of(memberSchema.getMergedTraits().xmlName ?? memberSchema.getMemberName());
          this.writeSimpleInto(memberSchema, val, memberNode, xmlns);
          structXmlNode.addChildNode(memberNode);
        }
      }
    }
    const { $unknown } = value;
    if ($unknown && ns.isUnionSchema() && Array.isArray($unknown) && Object.keys(value).length === 1) {
      const [k, v] = $unknown;
      const node = XmlNode.of(k);
      if (typeof v !== "string") {
        if (value instanceof XmlNode || value instanceof XmlText) {
          structXmlNode.addChildNode(value);
        } else {
          throw new Error(`@aws-sdk - $unknown union member in XML requires value of type string, @aws-sdk/xml-builder::XmlNode or XmlText.`);
        }
      }
      this.writeSimpleInto(0, v, node, xmlns);
      structXmlNode.addChildNode(node);
    }
    if (xmlns) {
      structXmlNode.addAttribute(xmlnsAttr, xmlns);
    }
    return structXmlNode;
  }
  writeList(listMember, array, container, parentXmlns) {
    if (!listMember.isMemberSchema()) {
      throw new Error(`@aws-sdk/core/protocols - xml serializer, cannot write non-member list: ${listMember.getName(true)}`);
    }
    const listTraits = listMember.getMergedTraits();
    const listValueSchema = listMember.getValueSchema();
    const listValueTraits = listValueSchema.getMergedTraits();
    const sparse = !!listValueTraits.sparse;
    const flat = !!listTraits.xmlFlattened;
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(listMember, parentXmlns);
    const writeItem = (container2, value) => {
      if (listValueSchema.isListSchema()) {
        this.writeList(listValueSchema, Array.isArray(value) ? value : [value], container2, xmlns);
      } else if (listValueSchema.isMapSchema()) {
        this.writeMap(listValueSchema, value, container2, xmlns);
      } else if (listValueSchema.isStructSchema()) {
        const struct = this.writeStruct(listValueSchema, value, xmlns);
        container2.addChildNode(struct.withName(flat ? listTraits.xmlName ?? listMember.getMemberName() : listValueTraits.xmlName ?? "member"));
      } else {
        const listItemNode = XmlNode.of(flat ? listTraits.xmlName ?? listMember.getMemberName() : listValueTraits.xmlName ?? "member");
        this.writeSimpleInto(listValueSchema, value, listItemNode, xmlns);
        container2.addChildNode(listItemNode);
      }
    };
    if (flat) {
      for (const value of array) {
        if (sparse || value != null) {
          writeItem(container, value);
        }
      }
    } else {
      const listNode = XmlNode.of(listTraits.xmlName ?? listMember.getMemberName());
      if (xmlns) {
        listNode.addAttribute(xmlnsAttr, xmlns);
      }
      for (const value of array) {
        if (sparse || value != null) {
          writeItem(listNode, value);
        }
      }
      container.addChildNode(listNode);
    }
  }
  writeMap(mapMember, map, container, parentXmlns, containerIsMap = false) {
    if (!mapMember.isMemberSchema()) {
      throw new Error(`@aws-sdk/core/protocols - xml serializer, cannot write non-member map: ${mapMember.getName(true)}`);
    }
    const mapTraits = mapMember.getMergedTraits();
    const mapKeySchema = mapMember.getKeySchema();
    const mapKeyTraits = mapKeySchema.getMergedTraits();
    const keyTag = mapKeyTraits.xmlName ?? "key";
    const mapValueSchema = mapMember.getValueSchema();
    const mapValueTraits = mapValueSchema.getMergedTraits();
    const valueTag = mapValueTraits.xmlName ?? "value";
    const sparse = !!mapValueTraits.sparse;
    const flat = !!mapTraits.xmlFlattened;
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(mapMember, parentXmlns);
    const addKeyValue = (entry, key, val) => {
      const keyNode = XmlNode.of(keyTag, key);
      const [keyXmlnsAttr, keyXmlns] = this.getXmlnsAttribute(mapKeySchema, xmlns);
      if (keyXmlns) {
        keyNode.addAttribute(keyXmlnsAttr, keyXmlns);
      }
      entry.addChildNode(keyNode);
      let valueNode = XmlNode.of(valueTag);
      if (mapValueSchema.isListSchema()) {
        this.writeList(mapValueSchema, val, valueNode, xmlns);
      } else if (mapValueSchema.isMapSchema()) {
        this.writeMap(mapValueSchema, val, valueNode, xmlns, true);
      } else if (mapValueSchema.isStructSchema()) {
        valueNode = this.writeStruct(mapValueSchema, val, xmlns);
      } else {
        this.writeSimpleInto(mapValueSchema, val, valueNode, xmlns);
      }
      entry.addChildNode(valueNode);
    };
    if (flat) {
      for (const [key, val] of Object.entries(map)) {
        if (sparse || val != null) {
          const entry = XmlNode.of(mapTraits.xmlName ?? mapMember.getMemberName());
          addKeyValue(entry, key, val);
          container.addChildNode(entry);
        }
      }
    } else {
      let mapNode;
      if (!containerIsMap) {
        mapNode = XmlNode.of(mapTraits.xmlName ?? mapMember.getMemberName());
        if (xmlns) {
          mapNode.addAttribute(xmlnsAttr, xmlns);
        }
        container.addChildNode(mapNode);
      }
      for (const [key, val] of Object.entries(map)) {
        if (sparse || val != null) {
          const entry = XmlNode.of("entry");
          addKeyValue(entry, key, val);
          (containerIsMap ? container : mapNode).addChildNode(entry);
        }
      }
    }
  }
  writeSimple(_schema, value) {
    if (null === value) {
      throw new Error("@aws-sdk/core/protocols - (XML serializer) cannot write null value.");
    }
    const ns = NormalizedSchema.of(_schema);
    let nodeContents = null;
    if (value && typeof value === "object") {
      if (ns.isBlobSchema()) {
        nodeContents = (this.serdeContext?.base64Encoder ?? toBase64)(value);
      } else if (ns.isTimestampSchema() && value instanceof Date) {
        const format = determineTimestampFormat(ns, this.settings);
        switch (format) {
          case 5:
            nodeContents = value.toISOString().replace(".000Z", "Z");
            break;
          case 6:
            nodeContents = dateToUtcString(value);
            break;
          case 7:
            nodeContents = String(value.getTime() / 1e3);
            break;
          default:
            console.warn("Missing timestamp format, using http date", value);
            nodeContents = dateToUtcString(value);
            break;
        }
      } else if (ns.isBigDecimalSchema() && value) {
        if (value instanceof NumericValue) {
          return value.string;
        }
        return String(value);
      } else if (ns.isMapSchema() || ns.isListSchema()) {
        throw new Error("@aws-sdk/core/protocols - xml serializer, cannot call _write() on List/Map schema, call writeList or writeMap() instead.");
      } else {
        throw new Error(`@aws-sdk/core/protocols - xml serializer, unhandled schema type for object value and schema: ${ns.getName(true)}`);
      }
    }
    if (ns.isBooleanSchema() || ns.isNumericSchema() || ns.isBigIntegerSchema() || ns.isBigDecimalSchema()) {
      nodeContents = String(value);
    }
    if (ns.isStringSchema()) {
      if (value === void 0 && ns.isIdempotencyToken()) {
        nodeContents = v4();
      } else {
        nodeContents = String(value);
      }
    }
    if (nodeContents === null) {
      throw new Error(`Unhandled schema-value pair ${ns.getName(true)}=${value}`);
    }
    return nodeContents;
  }
  writeSimpleInto(_schema, value, into, parentXmlns) {
    const nodeContents = this.writeSimple(_schema, value);
    const ns = NormalizedSchema.of(_schema);
    const content = new XmlText(nodeContents);
    const [xmlnsAttr, xmlns] = this.getXmlnsAttribute(ns, parentXmlns);
    if (xmlns) {
      into.addAttribute(xmlnsAttr, xmlns);
    }
    into.addChildNode(content);
  }
  getXmlnsAttribute(ns, parentXmlns) {
    const traits = ns.getMergedTraits();
    const [prefix, xmlns] = traits.xmlNamespace ?? [];
    if (xmlns && xmlns !== parentXmlns) {
      return [prefix ? `xmlns:${prefix}` : "xmlns", xmlns];
    }
    return [void 0, void 0];
  }
}
class XmlCodec extends SerdeContextConfig {
  settings;
  constructor(settings) {
    super();
    this.settings = settings;
  }
  createSerializer() {
    const serializer = new XmlShapeSerializer(this.settings);
    serializer.setSerdeContext(this.serdeContext);
    return serializer;
  }
  createDeserializer() {
    const deserializer = new XmlShapeDeserializer(this.settings);
    deserializer.setSerdeContext(this.serdeContext);
    return deserializer;
  }
}
class AwsRestXmlProtocol extends HttpBindingProtocol {
  codec;
  serializer;
  deserializer;
  mixin = new ProtocolLib();
  constructor(options) {
    super(options);
    const settings = {
      timestampFormat: {
        useTrait: true,
        default: 5
      },
      httpBindings: true,
      xmlNamespace: options.xmlNamespace,
      serviceNamespace: options.defaultNamespace
    };
    this.codec = new XmlCodec(settings);
    this.serializer = new HttpInterceptingShapeSerializer(this.codec.createSerializer(), settings);
    this.deserializer = new HttpInterceptingShapeDeserializer(this.codec.createDeserializer(), settings);
  }
  getPayloadCodec() {
    return this.codec;
  }
  getShapeId() {
    return "aws.protocols#restXml";
  }
  async serializeRequest(operationSchema, input, context) {
    const request = await super.serializeRequest(operationSchema, input, context);
    const inputSchema = NormalizedSchema.of(operationSchema.input);
    if (!request.headers["content-type"]) {
      const contentType = this.mixin.resolveRestContentType(this.getDefaultContentType(), inputSchema);
      if (contentType) {
        request.headers["content-type"] = contentType;
      }
    }
    if (typeof request.body === "string" && request.headers["content-type"] === this.getDefaultContentType() && !request.body.startsWith("<?xml ") && !this.hasUnstructuredPayloadBinding(inputSchema)) {
      request.body = '<?xml version="1.0" encoding="UTF-8"?>' + request.body;
    }
    return request;
  }
  async deserializeResponse(operationSchema, context, response) {
    return super.deserializeResponse(operationSchema, context, response);
  }
  async handleError(operationSchema, context, response, dataObject, metadata) {
    const errorIdentifier = loadRestXmlErrorCode(response, dataObject) ?? "Unknown";
    if (dataObject.Error && typeof dataObject.Error === "object") {
      for (const key of Object.keys(dataObject.Error)) {
        dataObject[key] = dataObject.Error[key];
        if (key.toLowerCase() === "message") {
          dataObject.message = dataObject.Error[key];
        }
      }
    }
    if (dataObject.RequestId && !metadata.requestId) {
      metadata.requestId = dataObject.RequestId;
    }
    const { errorSchema, errorMetadata } = await this.mixin.getErrorSchemaOrThrowBaseException(errorIdentifier, this.options.defaultNamespace, response, dataObject, metadata);
    const ns = NormalizedSchema.of(errorSchema);
    const message = dataObject.Error?.message ?? dataObject.Error?.Message ?? dataObject.message ?? dataObject.Message ?? "Unknown";
    const ErrorCtor = TypeRegistry.for(errorSchema[1]).getErrorCtor(errorSchema) ?? Error;
    const exception = new ErrorCtor(message);
    await this.deserializeHttpMessage(errorSchema, context, response, dataObject);
    const output = {};
    for (const [name, member] of ns.structIterator()) {
      const target = member.getMergedTraits().xmlName ?? name;
      const value = dataObject.Error?.[target] ?? dataObject[target];
      output[name] = this.codec.createDeserializer().readSchema(member, value);
    }
    throw this.mixin.decorateServiceException(Object.assign(exception, errorMetadata, {
      $fault: ns.getMergedTraits().error,
      message
    }, output), dataObject);
  }
  getDefaultContentType() {
    return "application/xml";
  }
  hasUnstructuredPayloadBinding(ns) {
    for (const [, member] of ns.structIterator()) {
      if (member.getMergedTraits().httpPayload) {
        return !(member.isStructSchema() || member.isMapSchema() || member.isListSchema());
      }
    }
    return false;
  }
}
export {
  AwsRestXmlProtocol as A,
  NODE_SIGV4A_CONFIG_OPTIONS as N,
  resolveAwsSdkSigV4AConfig as a,
  AwsSdkSigV4Signer as b,
  AwsSdkSigV4ASigner as c,
  NODE_AUTH_SCHEME_PREFERENCE_OPTIONS as d,
  emitWarningIfUnsupportedVersion as e,
  setCredentialFeature as f,
  AwsRestJsonProtocol as g,
  AwsQueryProtocol as h,
  resolveAwsSdkSigV4Config as r,
  setFeature as s
};
