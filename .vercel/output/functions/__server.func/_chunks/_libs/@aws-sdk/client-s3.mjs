import { g as getAddExpectContinuePlugin } from "./middleware-expect-continue.mjs";
import { g as getHostHeaderPlugin, r as resolveHostHeaderConfig } from "./middleware-host-header.mjs";
import { g as getContentLengthPlugin } from "../@smithy/middleware-content-length.mjs";
import { a as awsEndpointFunctions } from "./util-endpoints.mjs";
import { E as EndpointCache, r as resolveEndpoint, c as customEndpointFunctions } from "../@smithy/util-endpoints.mjs";
import { r as resolveAwsSdkSigV4Config, a as resolveAwsSdkSigV4AConfig, A as AwsRestXmlProtocol, b as AwsSdkSigV4Signer, c as AwsSdkSigV4ASigner, e as emitWarningIfUnsupportedVersion$1, N as NODE_SIGV4A_CONFIG_OPTIONS, d as NODE_AUTH_SCHEME_PREFERENCE_OPTIONS } from "./core.mjs";
import { S as SignatureV4MultiRegion } from "./signature-v4-multi-region.mjs";
import { r as resolveParams, g as getEndpointPlugin, a as resolveEndpointConfig } from "../@smithy/middleware-endpoint.mjs";
import { n as normalizeProvider, g as getSmithyContext } from "../@smithy/util-middleware.mjs";
import { S as ServiceException, C as Command, N as NoOpLogger, e as emitWarningIfUnsupportedVersion, l as loadConfigsForDefaultMode, a as getDefaultExtensionConfiguration, r as resolveDefaultRuntimeConfig, b as Client } from "../@smithy/smithy-client.mjs";
import { g as getThrow200ExceptionsPlugin, N as NODE_DISABLE_S3_EXPRESS_SESSION_AUTH_OPTIONS, r as resolveS3Config, a as getValidateBucketNamePlugin, b as getRegionRedirectMiddlewarePlugin, c as getS3ExpressPlugin, d as getS3ExpressHttpSigningPlugin, e as getCheckContentLengthHeaderPlugin } from "./middleware-sdk-s3.mjs";
import { H as Hash } from "../@smithy/hash-node.mjs";
import { p as parseUrl } from "../@smithy/url-parser.mjs";
import { s as sdkStreamMixin, g as getAwsChunkedEncodingStream } from "../@smithy/util-stream.mjs";
import { a as toUtf8, f as fromUtf8 } from "../@smithy/util-utf8.mjs";
import { t as toBase64, f as fromBase64 } from "../@smithy/util-base64.mjs";
import { r as resolveDefaultsModeConfig } from "../@smithy/util-defaults-mode-node.mjs";
import { r as readableStreamHasher } from "../@smithy/hash-stream-node.mjs";
import { e as eventStreamSerdeProvider } from "../@smithy/eventstream-serde-node.mjs";
import { d as defaultProvider } from "./credential-provider-node.mjs";
import { c as calculateBodyLength } from "../@smithy/util-body-length-node.mjs";
import { s as streamCollector, N as NodeHttpHandler } from "../@smithy/node-http-handler.mjs";
import { c as createDefaultUserAgentProvider, N as NODE_APP_ID_CONFIG_OPTIONS } from "./util-user-agent-node.mjs";
import { N as NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, a as NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, b as NODE_REGION_CONFIG_FILE_OPTIONS, c as NODE_REGION_CONFIG_OPTIONS, r as resolveRegionConfig } from "../@smithy/config-resolver.mjs";
import { N as NODE_USE_ARN_REGION_CONFIG_OPTIONS } from "./middleware-bucket-endpoint.mjs";
import { N as NODE_RETRY_MODE_CONFIG_OPTIONS, a as NODE_MAX_ATTEMPT_CONFIG_OPTIONS, r as resolveRetryConfig, g as getRetryPlugin } from "../@smithy/middleware-retry.mjs";
import { N as NODE_RESPONSE_CHECKSUM_VALIDATION_CONFIG_OPTIONS, a as NODE_REQUEST_CHECKSUM_CALCULATION_CONFIG_OPTIONS, r as resolveFlexibleChecksumsConfig, g as getFlexibleChecksumsPlugin } from "./middleware-flexible-checksums.mjs";
import { l as loadConfig } from "../@smithy/node-config-provider.mjs";
import { a as DEFAULT_RETRY_MODE } from "../@smithy/util-retry.mjs";
import { g as getAwsRegionExtensionConfiguration, r as resolveAwsRegionExtensionConfiguration } from "./region-config-resolver.mjs";
import { g as getHttpHandlerExtensionConfiguration, r as resolveHttpHandlerRuntimeConfig } from "../@smithy/protocol-http.mjs";
import { r as resolveUserAgentConfig, g as getUserAgentPlugin } from "./middleware-user-agent.mjs";
import { r as resolveEventStreamSerdeConfig } from "../@smithy/eventstream-serde-config-resolver.mjs";
import { T as TypeRegistry, q as getSchemaSerdePlugin, r as getHttpAuthSchemeEndpointRuleSetPlugin, t as getHttpSigningPlugin, D as DefaultIdentityProviderConfig } from "../@smithy/core.mjs";
import { g as getLoggerPlugin } from "./middleware-logger.mjs";
import { g as getRecursionDetectionPlugin } from "./middleware-recursion-detection.mjs";
import { g as getSsecPlugin } from "./middleware-ssec.mjs";
const cs = "required", ct = "type", cu = "rules", cv = "conditions", cw = "fn", cx = "argv", cy = "ref", cz = "assign", cA = "url", cB = "properties", cC = "backend", cD = "authSchemes", cE = "disableDoubleEncoding", cF = "signingName", cG = "signingRegion", cH = "headers", cI = "signingRegionSet";
const a = 6, b = false, c = true, d = "isSet", e = "booleanEquals", f = "error", g = "aws.partition", h = "stringEquals", i = "getAttr", j = "name", k = "substring", l = "bucketSuffix", m = "parseURL", n = "endpoint", o = "tree", p = "aws.isVirtualHostableS3Bucket", q = "{url#scheme}://{Bucket}.{url#authority}{url#path}", r = "not", s = "accessPointSuffix", t = "{url#scheme}://{url#authority}{url#path}", u = "hardwareType", v = "regionPrefix", w = "bucketAliasSuffix", x = "outpostId", y = "isValidHostLabel", z = "sigv4a", A = "s3-outposts", B = "s3", C = "{url#scheme}://{url#authority}{url#normalizedPath}{Bucket}", D = "https://{Bucket}.s3-accelerate.{partitionResult#dnsSuffix}", E = "https://{Bucket}.s3.{partitionResult#dnsSuffix}", F = "aws.parseArn", G = "bucketArn", H = "arnType", I = "", J = "s3-object-lambda", K = "accesspoint", L = "accessPointName", M = "{url#scheme}://{accessPointName}-{bucketArn#accountId}.{url#authority}{url#path}", N = "mrapPartition", O = "outpostType", P = "arnPrefix", Q = "{url#scheme}://{url#authority}{url#normalizedPath}{uri_encoded_bucket}", R = "https://s3.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", S = "https://s3.{partitionResult#dnsSuffix}", T = { [cs]: false, [ct]: "string" }, U = { [cs]: true, "default": false, [ct]: "boolean" }, V = { [cs]: false, [ct]: "boolean" }, W = { [cw]: e, [cx]: [{ [cy]: "Accelerate" }, true] }, X = { [cw]: e, [cx]: [{ [cy]: "UseFIPS" }, true] }, Y = { [cw]: e, [cx]: [{ [cy]: "UseDualStack" }, true] }, Z = { [cw]: d, [cx]: [{ [cy]: "Endpoint" }] }, aa = { [cw]: g, [cx]: [{ [cy]: "Region" }], [cz]: "partitionResult" }, ab = { [cw]: h, [cx]: [{ [cw]: i, [cx]: [{ [cy]: "partitionResult" }, j] }, "aws-cn"] }, ac = { [cw]: d, [cx]: [{ [cy]: "Bucket" }] }, ad = { [cy]: "Bucket" }, ae = { [cv]: [W], [f]: "S3Express does not support S3 Accelerate.", [ct]: f }, af = { [cv]: [Z, { [cw]: m, [cx]: [{ [cy]: "Endpoint" }], [cz]: "url" }], [cu]: [{ [cv]: [{ [cw]: d, [cx]: [{ [cy]: "DisableS3ExpressSessionAuth" }] }, { [cw]: e, [cx]: [{ [cy]: "DisableS3ExpressSessionAuth" }, true] }], [cu]: [{ [cv]: [{ [cw]: e, [cx]: [{ [cw]: i, [cx]: [{ [cy]: "url" }, "isIp"] }, true] }], [cu]: [{ [cv]: [{ [cw]: "uriEncode", [cx]: [ad], [cz]: "uri_encoded_bucket" }], [cu]: [{ [n]: { [cA]: "{url#scheme}://{url#authority}/{uri_encoded_bucket}{url#path}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }], [ct]: o }], [ct]: o }, { [cv]: [{ [cw]: p, [cx]: [ad, false] }], [cu]: [{ [n]: { [cA]: q, [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }], [ct]: o }, { [f]: "S3Express bucket name is not a valid virtual hostable name.", [ct]: f }], [ct]: o }, { [cv]: [{ [cw]: e, [cx]: [{ [cw]: i, [cx]: [{ [cy]: "url" }, "isIp"] }, true] }], [cu]: [{ [cv]: [{ [cw]: "uriEncode", [cx]: [ad], [cz]: "uri_encoded_bucket" }], [cu]: [{ [n]: { [cA]: "{url#scheme}://{url#authority}/{uri_encoded_bucket}{url#path}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }], [ct]: o }], [ct]: o }, { [cv]: [{ [cw]: p, [cx]: [ad, false] }], [cu]: [{ [n]: { [cA]: q, [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }], [ct]: o }, { [f]: "S3Express bucket name is not a valid virtual hostable name.", [ct]: f }], [ct]: o }, ag = { [cw]: m, [cx]: [{ [cy]: "Endpoint" }], [cz]: "url" }, ah = { [cw]: e, [cx]: [{ [cw]: i, [cx]: [{ [cy]: "url" }, "isIp"] }, true] }, ai = { [cy]: "url" }, aj = { [cw]: "uriEncode", [cx]: [ad], [cz]: "uri_encoded_bucket" }, ak = { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: "s3express", [cG]: "{Region}" }] }, al = {}, am = { [cw]: p, [cx]: [ad, false] }, an = { [f]: "S3Express bucket name is not a valid virtual hostable name.", [ct]: f }, ao = { [cw]: d, [cx]: [{ [cy]: "UseS3ExpressControlEndpoint" }] }, ap = { [cw]: e, [cx]: [{ [cy]: "UseS3ExpressControlEndpoint" }, true] }, aq = { [cw]: r, [cx]: [Z] }, ar = { [cw]: e, [cx]: [{ [cy]: "UseDualStack" }, false] }, as = { [cw]: e, [cx]: [{ [cy]: "UseFIPS" }, false] }, at = { [f]: "Unrecognized S3Express bucket name format.", [ct]: f }, au = { [cw]: r, [cx]: [ac] }, av = { [cy]: u }, aw = { [cv]: [aq], [f]: "Expected a endpoint to be specified but no endpoint was found", [ct]: f }, ax = { [cD]: [{ [cE]: true, [j]: z, [cF]: A, [cI]: ["*"] }, { [cE]: true, [j]: "sigv4", [cF]: A, [cG]: "{Region}" }] }, ay = { [cw]: e, [cx]: [{ [cy]: "ForcePathStyle" }, false] }, az = { [cy]: "ForcePathStyle" }, aA = { [cw]: e, [cx]: [{ [cy]: "Accelerate" }, false] }, aB = { [cw]: h, [cx]: [{ [cy]: "Region" }, "aws-global"] }, aC = { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: B, [cG]: "us-east-1" }] }, aD = { [cw]: r, [cx]: [aB] }, aE = { [cw]: e, [cx]: [{ [cy]: "UseGlobalEndpoint" }, true] }, aF = { [cA]: "https://{Bucket}.s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: B, [cG]: "{Region}" }] }, [cH]: {} }, aG = { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: B, [cG]: "{Region}" }] }, aH = { [cw]: e, [cx]: [{ [cy]: "UseGlobalEndpoint" }, false] }, aI = { [cA]: "https://{Bucket}.s3-fips.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} }, aJ = { [cA]: "https://{Bucket}.s3-accelerate.dualstack.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} }, aK = { [cA]: "https://{Bucket}.s3.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} }, aL = { [cw]: e, [cx]: [{ [cw]: i, [cx]: [ai, "isIp"] }, false] }, aM = { [cA]: C, [cB]: aG, [cH]: {} }, aN = { [cA]: q, [cB]: aG, [cH]: {} }, aO = { [n]: aN, [ct]: n }, aP = { [cA]: D, [cB]: aG, [cH]: {} }, aQ = { [cA]: "https://{Bucket}.s3.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} }, aR = { [f]: "Invalid region: region was not a valid DNS name.", [ct]: f }, aS = { [cy]: G }, aT = { [cy]: H }, aU = { [cw]: i, [cx]: [aS, "service"] }, aV = { [cy]: L }, aW = { [cv]: [Y], [f]: "S3 Object Lambda does not support Dual-stack", [ct]: f }, aX = { [cv]: [W], [f]: "S3 Object Lambda does not support S3 Accelerate", [ct]: f }, aY = { [cv]: [{ [cw]: d, [cx]: [{ [cy]: "DisableAccessPoints" }] }, { [cw]: e, [cx]: [{ [cy]: "DisableAccessPoints" }, true] }], [f]: "Access points are not supported for this operation", [ct]: f }, aZ = { [cv]: [{ [cw]: d, [cx]: [{ [cy]: "UseArnRegion" }] }, { [cw]: e, [cx]: [{ [cy]: "UseArnRegion" }, false] }, { [cw]: r, [cx]: [{ [cw]: h, [cx]: [{ [cw]: i, [cx]: [aS, "region"] }, "{Region}"] }] }], [f]: "Invalid configuration: region from ARN `{bucketArn#region}` does not match client region `{Region}` and UseArnRegion is `false`", [ct]: f }, ba = { [cw]: i, [cx]: [{ [cy]: "bucketPartition" }, j] }, bb = { [cw]: i, [cx]: [aS, "accountId"] }, bc = { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: J, [cG]: "{bucketArn#region}" }] }, bd = { [f]: "Invalid ARN: The access point name may only contain a-z, A-Z, 0-9 and `-`. Found: `{accessPointName}`", [ct]: f }, be = { [f]: "Invalid ARN: The account id may only contain a-z, A-Z, 0-9 and `-`. Found: `{bucketArn#accountId}`", [ct]: f }, bf = { [f]: "Invalid region in ARN: `{bucketArn#region}` (invalid DNS name)", [ct]: f }, bg = { [f]: "Client was configured for partition `{partitionResult#name}` but ARN (`{Bucket}`) has `{bucketPartition#name}`", [ct]: f }, bh = { [f]: "Invalid ARN: The ARN may only contain a single resource component after `accesspoint`.", [ct]: f }, bi = { [f]: "Invalid ARN: Expected a resource of the format `accesspoint:<accesspoint name>` but no name was provided", [ct]: f }, bj = { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: B, [cG]: "{bucketArn#region}" }] }, bk = { [cD]: [{ [cE]: true, [j]: z, [cF]: A, [cI]: ["*"] }, { [cE]: true, [j]: "sigv4", [cF]: A, [cG]: "{bucketArn#region}" }] }, bl = { [cw]: F, [cx]: [ad] }, bm = { [cA]: "https://s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aG, [cH]: {} }, bn = { [cA]: "https://s3-fips.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aG, [cH]: {} }, bo = { [cA]: "https://s3.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aG, [cH]: {} }, bp = { [cA]: Q, [cB]: aG, [cH]: {} }, bq = { [cA]: "https://s3.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aG, [cH]: {} }, br = { [cy]: "UseObjectLambdaEndpoint" }, bs = { [cD]: [{ [cE]: true, [j]: "sigv4", [cF]: J, [cG]: "{Region}" }] }, bt = { [cA]: "https://s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} }, bu = { [cA]: "https://s3-fips.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} }, bv = { [cA]: "https://s3.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} }, bw = { [cA]: t, [cB]: aG, [cH]: {} }, bx = { [cA]: "https://s3.{Region}.{partitionResult#dnsSuffix}", [cB]: aG, [cH]: {} }, by = [{ [cy]: "Region" }], bz = [{ [cy]: "Endpoint" }], bA = [ad], bB = [W], bC = [Z, ag], bD = [{ [cw]: d, [cx]: [{ [cy]: "DisableS3ExpressSessionAuth" }] }, { [cw]: e, [cx]: [{ [cy]: "DisableS3ExpressSessionAuth" }, true] }], bE = [aj], bF = [am], bG = [aa], bH = [X, Y], bI = [X, ar], bJ = [as, Y], bK = [as, ar], bL = [{ [cw]: k, [cx]: [ad, 6, 14, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 14, 16, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }], bM = [{ [cv]: [X, Y], [n]: { [cA]: "https://{Bucket}.s3express-fips-{s3expressAvailabilityZoneId}.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: {} }, [ct]: n }, { [cv]: bI, [n]: { [cA]: "https://{Bucket}.s3express-fips-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: {} }, [ct]: n }, { [cv]: bJ, [n]: { [cA]: "https://{Bucket}.s3express-{s3expressAvailabilityZoneId}.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: {} }, [ct]: n }, { [cv]: bK, [n]: { [cA]: "https://{Bucket}.s3express-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: {} }, [ct]: n }], bN = [{ [cw]: k, [cx]: [ad, 6, 15, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 15, 17, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }], bO = [{ [cw]: k, [cx]: [ad, 6, 19, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 19, 21, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }], bP = [{ [cw]: k, [cx]: [ad, 6, 20, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 20, 22, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }], bQ = [{ [cw]: k, [cx]: [ad, 6, 26, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 26, 28, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }], bR = [{ [cv]: [X, Y], [n]: { [cA]: "https://{Bucket}.s3express-fips-{s3expressAvailabilityZoneId}.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }, { [cv]: bI, [n]: { [cA]: "https://{Bucket}.s3express-fips-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }, { [cv]: bJ, [n]: { [cA]: "https://{Bucket}.s3express-{s3expressAvailabilityZoneId}.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }, { [cv]: bK, [n]: { [cA]: "https://{Bucket}.s3express-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cB]: { [cC]: "S3Express", [cD]: [{ [cE]: true, [j]: "sigv4-s3express", [cF]: "s3express", [cG]: "{Region}" }] }, [cH]: {} }, [ct]: n }], bS = [ad, 0, 7, true], bT = [{ [cw]: k, [cx]: [ad, 7, 15, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 15, 17, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }], bU = [{ [cw]: k, [cx]: [ad, 7, 16, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 16, 18, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }], bV = [{ [cw]: k, [cx]: [ad, 7, 20, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 20, 22, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }], bW = [{ [cw]: k, [cx]: [ad, 7, 21, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 21, 23, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }], bX = [{ [cw]: k, [cx]: [ad, 7, 27, true], [cz]: "s3expressAvailabilityZoneId" }, { [cw]: k, [cx]: [ad, 27, 29, true], [cz]: "s3expressAvailabilityZoneDelim" }, { [cw]: h, [cx]: [{ [cy]: "s3expressAvailabilityZoneDelim" }, "--"] }], bY = [ac], bZ = [{ [cw]: y, [cx]: [{ [cy]: x }, false] }], ca = [{ [cw]: h, [cx]: [{ [cy]: v }, "beta"] }], cb = ["*"], cc = [{ [cw]: y, [cx]: [{ [cy]: "Region" }, false] }], cd = [{ [cw]: h, [cx]: [{ [cy]: "Region" }, "us-east-1"] }], ce = [{ [cw]: h, [cx]: [aT, K] }], cf = [{ [cw]: i, [cx]: [aS, "resourceId[1]"], [cz]: L }, { [cw]: r, [cx]: [{ [cw]: h, [cx]: [aV, I] }] }], cg = [aS, "resourceId[1]"], ch = [Y], ci = [{ [cw]: r, [cx]: [{ [cw]: h, [cx]: [{ [cw]: i, [cx]: [aS, "region"] }, I] }] }], cj = [{ [cw]: r, [cx]: [{ [cw]: d, [cx]: [{ [cw]: i, [cx]: [aS, "resourceId[2]"] }] }] }], ck = [aS, "resourceId[2]"], cl = [{ [cw]: g, [cx]: [{ [cw]: i, [cx]: [aS, "region"] }], [cz]: "bucketPartition" }], cm = [{ [cw]: h, [cx]: [ba, { [cw]: i, [cx]: [{ [cy]: "partitionResult" }, j] }] }], cn = [{ [cw]: y, [cx]: [{ [cw]: i, [cx]: [aS, "region"] }, true] }], co = [{ [cw]: y, [cx]: [bb, false] }], cp = [{ [cw]: y, [cx]: [aV, false] }], cq = [X], cr = [{ [cw]: y, [cx]: [{ [cy]: "Region" }, true] }];
const _data = { parameters: { Bucket: T, Region: T, UseFIPS: U, UseDualStack: U, Endpoint: T, ForcePathStyle: U, Accelerate: U, UseGlobalEndpoint: U, UseObjectLambdaEndpoint: V, Key: T, Prefix: T, CopySource: T, DisableAccessPoints: V, DisableMultiRegionAccessPoints: U, UseArnRegion: V, UseS3ExpressControlEndpoint: V, DisableS3ExpressSessionAuth: V }, [cu]: [{ [cv]: [{ [cw]: d, [cx]: by }], [cu]: [{ [cv]: [W, X], error: "Accelerate cannot be used with FIPS", [ct]: f }, { [cv]: [Y, Z], error: "Cannot set dual-stack in combination with a custom endpoint.", [ct]: f }, { [cv]: [Z, X], error: "A custom endpoint cannot be combined with FIPS", [ct]: f }, { [cv]: [Z, W], error: "A custom endpoint cannot be combined with S3 Accelerate", [ct]: f }, { [cv]: [X, aa, ab], error: "Partition does not support FIPS", [ct]: f }, { [cv]: [ac, { [cw]: k, [cx]: [ad, 0, a, c], [cz]: l }, { [cw]: h, [cx]: [{ [cy]: l }, "--x-s3"] }], [cu]: [ae, af, { [cv]: [ao, ap], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: [aj, aq], [cu]: [{ [cv]: bH, endpoint: { [cA]: "https://s3express-control-fips.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bI, endpoint: { [cA]: "https://s3express-control-fips.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bJ, endpoint: { [cA]: "https://s3express-control.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bK, endpoint: { [cA]: "https://s3express-control.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: ak, [cH]: al }, [ct]: n }], [ct]: o }], [ct]: o }], [ct]: o }, { [cv]: bF, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: bD, [cu]: [{ [cv]: bL, [cu]: bM, [ct]: o }, { [cv]: bN, [cu]: bM, [ct]: o }, { [cv]: bO, [cu]: bM, [ct]: o }, { [cv]: bP, [cu]: bM, [ct]: o }, { [cv]: bQ, [cu]: bM, [ct]: o }, at], [ct]: o }, { [cv]: bL, [cu]: bR, [ct]: o }, { [cv]: bN, [cu]: bR, [ct]: o }, { [cv]: bO, [cu]: bR, [ct]: o }, { [cv]: bP, [cu]: bR, [ct]: o }, { [cv]: bQ, [cu]: bR, [ct]: o }, at], [ct]: o }], [ct]: o }, an], [ct]: o }, { [cv]: [ac, { [cw]: k, [cx]: bS, [cz]: s }, { [cw]: h, [cx]: [{ [cy]: s }, "--xa-s3"] }], [cu]: [ae, af, { [cv]: bF, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: bD, [cu]: [{ [cv]: bT, [cu]: bM, [ct]: o }, { [cv]: bU, [cu]: bM, [ct]: o }, { [cv]: bV, [cu]: bM, [ct]: o }, { [cv]: bW, [cu]: bM, [ct]: o }, { [cv]: bX, [cu]: bM, [ct]: o }, at], [ct]: o }, { [cv]: bT, [cu]: bR, [ct]: o }, { [cv]: bU, [cu]: bR, [ct]: o }, { [cv]: bV, [cu]: bR, [ct]: o }, { [cv]: bW, [cu]: bR, [ct]: o }, { [cv]: bX, [cu]: bR, [ct]: o }, at], [ct]: o }], [ct]: o }, an], [ct]: o }, { [cv]: [au, ao, ap], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: bC, endpoint: { [cA]: t, [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bH, endpoint: { [cA]: "https://s3express-control-fips.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bI, endpoint: { [cA]: "https://s3express-control-fips.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bJ, endpoint: { [cA]: "https://s3express-control.dualstack.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: al }, [ct]: n }, { [cv]: bK, endpoint: { [cA]: "https://s3express-control.{Region}.{partitionResult#dnsSuffix}", [cB]: ak, [cH]: al }, [ct]: n }], [ct]: o }], [ct]: o }, { [cv]: [ac, { [cw]: k, [cx]: [ad, 49, 50, c], [cz]: u }, { [cw]: k, [cx]: [ad, 8, 12, c], [cz]: v }, { [cw]: k, [cx]: bS, [cz]: w }, { [cw]: k, [cx]: [ad, 32, 49, c], [cz]: x }, { [cw]: g, [cx]: by, [cz]: "regionPartition" }, { [cw]: h, [cx]: [{ [cy]: w }, "--op-s3"] }], [cu]: [{ [cv]: bZ, [cu]: [{ [cv]: bF, [cu]: [{ [cv]: [{ [cw]: h, [cx]: [av, "e"] }], [cu]: [{ [cv]: ca, [cu]: [aw, { [cv]: bC, endpoint: { [cA]: "https://{Bucket}.ec2.{url#authority}", [cB]: ax, [cH]: al }, [ct]: n }], [ct]: o }, { endpoint: { [cA]: "https://{Bucket}.ec2.s3-outposts.{Region}.{regionPartition#dnsSuffix}", [cB]: ax, [cH]: al }, [ct]: n }], [ct]: o }, { [cv]: [{ [cw]: h, [cx]: [av, "o"] }], [cu]: [{ [cv]: ca, [cu]: [aw, { [cv]: bC, endpoint: { [cA]: "https://{Bucket}.op-{outpostId}.{url#authority}", [cB]: ax, [cH]: al }, [ct]: n }], [ct]: o }, { endpoint: { [cA]: "https://{Bucket}.op-{outpostId}.s3-outposts.{Region}.{regionPartition#dnsSuffix}", [cB]: ax, [cH]: al }, [ct]: n }], [ct]: o }, { error: 'Unrecognized hardware type: "Expected hardware type o or e but got {hardwareType}"', [ct]: f }], [ct]: o }, { error: "Invalid Outposts Bucket alias - it must be a valid bucket name.", [ct]: f }], [ct]: o }, { error: "Invalid ARN: The outpost Id must only contain a-z, A-Z, 0-9 and `-`.", [ct]: f }], [ct]: o }, { [cv]: bY, [cu]: [{ [cv]: [Z, { [cw]: r, [cx]: [{ [cw]: d, [cx]: [{ [cw]: m, [cx]: bz }] }] }], error: "Custom endpoint `{Endpoint}` was not a valid URI", [ct]: f }, { [cv]: [ay, am], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cc, [cu]: [{ [cv]: [W, ab], error: "S3 Accelerate cannot be used in this region", [ct]: f }, { [cv]: [Y, X, aA, aq, aB], endpoint: { [cA]: "https://{Bucket}.s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [Y, X, aA, aq, aD, aE], [cu]: [{ endpoint: aF, [ct]: n }], [ct]: o }, { [cv]: [Y, X, aA, aq, aD, aH], endpoint: aF, [ct]: n }, { [cv]: [ar, X, aA, aq, aB], endpoint: { [cA]: "https://{Bucket}.s3-fips.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar, X, aA, aq, aD, aE], [cu]: [{ endpoint: aI, [ct]: n }], [ct]: o }, { [cv]: [ar, X, aA, aq, aD, aH], endpoint: aI, [ct]: n }, { [cv]: [Y, as, W, aq, aB], endpoint: { [cA]: "https://{Bucket}.s3-accelerate.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [Y, as, W, aq, aD, aE], [cu]: [{ endpoint: aJ, [ct]: n }], [ct]: o }, { [cv]: [Y, as, W, aq, aD, aH], endpoint: aJ, [ct]: n }, { [cv]: [Y, as, aA, aq, aB], endpoint: { [cA]: "https://{Bucket}.s3.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [Y, as, aA, aq, aD, aE], [cu]: [{ endpoint: aK, [ct]: n }], [ct]: o }, { [cv]: [Y, as, aA, aq, aD, aH], endpoint: aK, [ct]: n }, { [cv]: [ar, as, aA, Z, ag, ah, aB], endpoint: { [cA]: C, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar, as, aA, Z, ag, aL, aB], endpoint: { [cA]: q, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar, as, aA, Z, ag, ah, aD, aE], [cu]: [{ [cv]: cd, endpoint: aM, [ct]: n }, { endpoint: aM, [ct]: n }], [ct]: o }, { [cv]: [ar, as, aA, Z, ag, aL, aD, aE], [cu]: [{ [cv]: cd, endpoint: aN, [ct]: n }, aO], [ct]: o }, { [cv]: [ar, as, aA, Z, ag, ah, aD, aH], endpoint: aM, [ct]: n }, { [cv]: [ar, as, aA, Z, ag, aL, aD, aH], endpoint: aN, [ct]: n }, { [cv]: [ar, as, W, aq, aB], endpoint: { [cA]: D, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar, as, W, aq, aD, aE], [cu]: [{ [cv]: cd, endpoint: aP, [ct]: n }, { endpoint: aP, [ct]: n }], [ct]: o }, { [cv]: [ar, as, W, aq, aD, aH], endpoint: aP, [ct]: n }, { [cv]: [ar, as, aA, aq, aB], endpoint: { [cA]: E, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar, as, aA, aq, aD, aE], [cu]: [{ [cv]: cd, endpoint: { [cA]: E, [cB]: aG, [cH]: al }, [ct]: n }, { endpoint: aQ, [ct]: n }], [ct]: o }, { [cv]: [ar, as, aA, aq, aD, aH], endpoint: aQ, [ct]: n }], [ct]: o }, aR], [ct]: o }], [ct]: o }, { [cv]: [Z, ag, { [cw]: h, [cx]: [{ [cw]: i, [cx]: [ai, "scheme"] }, "http"] }, { [cw]: p, [cx]: [ad, c] }, ay, as, ar, aA], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cc, [cu]: [aO], [ct]: o }, aR], [ct]: o }], [ct]: o }, { [cv]: [ay, { [cw]: F, [cx]: bA, [cz]: G }], [cu]: [{ [cv]: [{ [cw]: i, [cx]: [aS, "resourceId[0]"], [cz]: H }, { [cw]: r, [cx]: [{ [cw]: h, [cx]: [aT, I] }] }], [cu]: [{ [cv]: [{ [cw]: h, [cx]: [aU, J] }], [cu]: [{ [cv]: ce, [cu]: [{ [cv]: cf, [cu]: [aW, aX, { [cv]: ci, [cu]: [aY, { [cv]: cj, [cu]: [aZ, { [cv]: cl, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cm, [cu]: [{ [cv]: cn, [cu]: [{ [cv]: [{ [cw]: h, [cx]: [bb, I] }], error: "Invalid ARN: Missing account id", [ct]: f }, { [cv]: co, [cu]: [{ [cv]: cp, [cu]: [{ [cv]: bC, endpoint: { [cA]: M, [cB]: bc, [cH]: al }, [ct]: n }, { [cv]: cq, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-object-lambda-fips.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bc, [cH]: al }, [ct]: n }, { endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-object-lambda.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bc, [cH]: al }, [ct]: n }], [ct]: o }, bd], [ct]: o }, be], [ct]: o }, bf], [ct]: o }, bg], [ct]: o }], [ct]: o }], [ct]: o }, bh], [ct]: o }, { error: "Invalid ARN: bucket ARN is missing a region", [ct]: f }], [ct]: o }, bi], [ct]: o }, { error: "Invalid ARN: Object Lambda ARNs only support `accesspoint` arn types, but found: `{arnType}`", [ct]: f }], [ct]: o }, { [cv]: ce, [cu]: [{ [cv]: cf, [cu]: [{ [cv]: ci, [cu]: [{ [cv]: ce, [cu]: [{ [cv]: ci, [cu]: [aY, { [cv]: cj, [cu]: [aZ, { [cv]: cl, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: [{ [cw]: h, [cx]: [ba, "{partitionResult#name}"] }], [cu]: [{ [cv]: cn, [cu]: [{ [cv]: [{ [cw]: h, [cx]: [aU, B] }], [cu]: [{ [cv]: co, [cu]: [{ [cv]: cp, [cu]: [{ [cv]: bB, error: "Access Points do not support S3 Accelerate", [ct]: f }, { [cv]: bH, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint-fips.dualstack.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bj, [cH]: al }, [ct]: n }, { [cv]: bI, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint-fips.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bj, [cH]: al }, [ct]: n }, { [cv]: bJ, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint.dualstack.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bj, [cH]: al }, [ct]: n }, { [cv]: [as, ar, Z, ag], endpoint: { [cA]: M, [cB]: bj, [cH]: al }, [ct]: n }, { [cv]: bK, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bj, [cH]: al }, [ct]: n }], [ct]: o }, bd], [ct]: o }, be], [ct]: o }, { error: "Invalid ARN: The ARN was not for the S3 service, found: {bucketArn#service}", [ct]: f }], [ct]: o }, bf], [ct]: o }, bg], [ct]: o }], [ct]: o }], [ct]: o }, bh], [ct]: o }], [ct]: o }], [ct]: o }, { [cv]: [{ [cw]: y, [cx]: [aV, c] }], [cu]: [{ [cv]: ch, error: "S3 MRAP does not support dual-stack", [ct]: f }, { [cv]: cq, error: "S3 MRAP does not support FIPS", [ct]: f }, { [cv]: bB, error: "S3 MRAP does not support S3 Accelerate", [ct]: f }, { [cv]: [{ [cw]: e, [cx]: [{ [cy]: "DisableMultiRegionAccessPoints" }, c] }], error: "Invalid configuration: Multi-Region Access Point ARNs are disabled.", [ct]: f }, { [cv]: [{ [cw]: g, [cx]: by, [cz]: N }], [cu]: [{ [cv]: [{ [cw]: h, [cx]: [{ [cw]: i, [cx]: [{ [cy]: N }, j] }, { [cw]: i, [cx]: [aS, "partition"] }] }], [cu]: [{ endpoint: { [cA]: "https://{accessPointName}.accesspoint.s3-global.{mrapPartition#dnsSuffix}", [cB]: { [cD]: [{ [cE]: c, name: z, [cF]: B, [cI]: cb }] }, [cH]: al }, [ct]: n }], [ct]: o }, { error: "Client was configured for partition `{mrapPartition#name}` but bucket referred to partition `{bucketArn#partition}`", [ct]: f }], [ct]: o }], [ct]: o }, { error: "Invalid Access Point Name", [ct]: f }], [ct]: o }, bi], [ct]: o }, { [cv]: [{ [cw]: h, [cx]: [aU, A] }], [cu]: [{ [cv]: ch, error: "S3 Outposts does not support Dual-stack", [ct]: f }, { [cv]: cq, error: "S3 Outposts does not support FIPS", [ct]: f }, { [cv]: bB, error: "S3 Outposts does not support S3 Accelerate", [ct]: f }, { [cv]: [{ [cw]: d, [cx]: [{ [cw]: i, [cx]: [aS, "resourceId[4]"] }] }], error: "Invalid Arn: Outpost Access Point ARN contains sub resources", [ct]: f }, { [cv]: [{ [cw]: i, [cx]: cg, [cz]: x }], [cu]: [{ [cv]: bZ, [cu]: [aZ, { [cv]: cl, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cm, [cu]: [{ [cv]: cn, [cu]: [{ [cv]: co, [cu]: [{ [cv]: [{ [cw]: i, [cx]: ck, [cz]: O }], [cu]: [{ [cv]: [{ [cw]: i, [cx]: [aS, "resourceId[3]"], [cz]: L }], [cu]: [{ [cv]: [{ [cw]: h, [cx]: [{ [cy]: O }, K] }], [cu]: [{ [cv]: bC, endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.{outpostId}.{url#authority}", [cB]: bk, [cH]: al }, [ct]: n }, { endpoint: { [cA]: "https://{accessPointName}-{bucketArn#accountId}.{outpostId}.s3-outposts.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cB]: bk, [cH]: al }, [ct]: n }], [ct]: o }, { error: "Expected an outpost type `accesspoint`, found {outpostType}", [ct]: f }], [ct]: o }, { error: "Invalid ARN: expected an access point name", [ct]: f }], [ct]: o }, { error: "Invalid ARN: Expected a 4-component resource", [ct]: f }], [ct]: o }, be], [ct]: o }, bf], [ct]: o }, bg], [ct]: o }], [ct]: o }], [ct]: o }, { error: "Invalid ARN: The outpost Id may only contain a-z, A-Z, 0-9 and `-`. Found: `{outpostId}`", [ct]: f }], [ct]: o }, { error: "Invalid ARN: The Outpost Id was not set", [ct]: f }], [ct]: o }, { error: "Invalid ARN: Unrecognized format: {Bucket} (type: {arnType})", [ct]: f }], [ct]: o }, { error: "Invalid ARN: No ARN type specified", [ct]: f }], [ct]: o }, { [cv]: [{ [cw]: k, [cx]: [ad, 0, 4, b], [cz]: P }, { [cw]: h, [cx]: [{ [cy]: P }, "arn:"] }, { [cw]: r, [cx]: [{ [cw]: d, [cx]: [bl] }] }], error: "Invalid ARN: `{Bucket}` was not a valid ARN", [ct]: f }, { [cv]: [{ [cw]: e, [cx]: [az, c] }, bl], error: "Path-style addressing cannot be used with ARN buckets", [ct]: f }, { [cv]: bE, [cu]: [{ [cv]: bG, [cu]: [{ [cv]: [aA], [cu]: [{ [cv]: [Y, aq, X, aB], endpoint: { [cA]: "https://s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [Y, aq, X, aD, aE], [cu]: [{ endpoint: bm, [ct]: n }], [ct]: o }, { [cv]: [Y, aq, X, aD, aH], endpoint: bm, [ct]: n }, { [cv]: [ar, aq, X, aB], endpoint: { [cA]: "https://s3-fips.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar, aq, X, aD, aE], [cu]: [{ endpoint: bn, [ct]: n }], [ct]: o }, { [cv]: [ar, aq, X, aD, aH], endpoint: bn, [ct]: n }, { [cv]: [Y, aq, as, aB], endpoint: { [cA]: "https://s3.dualstack.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [Y, aq, as, aD, aE], [cu]: [{ endpoint: bo, [ct]: n }], [ct]: o }, { [cv]: [Y, aq, as, aD, aH], endpoint: bo, [ct]: n }, { [cv]: [ar, Z, ag, as, aB], endpoint: { [cA]: Q, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar, Z, ag, as, aD, aE], [cu]: [{ [cv]: cd, endpoint: bp, [ct]: n }, { endpoint: bp, [ct]: n }], [ct]: o }, { [cv]: [ar, Z, ag, as, aD, aH], endpoint: bp, [ct]: n }, { [cv]: [ar, aq, as, aB], endpoint: { [cA]: R, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [ar, aq, as, aD, aE], [cu]: [{ [cv]: cd, endpoint: { [cA]: R, [cB]: aG, [cH]: al }, [ct]: n }, { endpoint: bq, [ct]: n }], [ct]: o }, { [cv]: [ar, aq, as, aD, aH], endpoint: bq, [ct]: n }], [ct]: o }, { error: "Path-style addressing cannot be used with S3 Accelerate", [ct]: f }], [ct]: o }], [ct]: o }], [ct]: o }, { [cv]: [{ [cw]: d, [cx]: [br] }, { [cw]: e, [cx]: [br, c] }], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cr, [cu]: [aW, aX, { [cv]: bC, endpoint: { [cA]: t, [cB]: bs, [cH]: al }, [ct]: n }, { [cv]: cq, endpoint: { [cA]: "https://s3-object-lambda-fips.{Region}.{partitionResult#dnsSuffix}", [cB]: bs, [cH]: al }, [ct]: n }, { endpoint: { [cA]: "https://s3-object-lambda.{Region}.{partitionResult#dnsSuffix}", [cB]: bs, [cH]: al }, [ct]: n }], [ct]: o }, aR], [ct]: o }], [ct]: o }, { [cv]: [au], [cu]: [{ [cv]: bG, [cu]: [{ [cv]: cr, [cu]: [{ [cv]: [X, Y, aq, aB], endpoint: { [cA]: "https://s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [X, Y, aq, aD, aE], [cu]: [{ endpoint: bt, [ct]: n }], [ct]: o }, { [cv]: [X, Y, aq, aD, aH], endpoint: bt, [ct]: n }, { [cv]: [X, ar, aq, aB], endpoint: { [cA]: "https://s3-fips.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [X, ar, aq, aD, aE], [cu]: [{ endpoint: bu, [ct]: n }], [ct]: o }, { [cv]: [X, ar, aq, aD, aH], endpoint: bu, [ct]: n }, { [cv]: [as, Y, aq, aB], endpoint: { [cA]: "https://s3.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [as, Y, aq, aD, aE], [cu]: [{ endpoint: bv, [ct]: n }], [ct]: o }, { [cv]: [as, Y, aq, aD, aH], endpoint: bv, [ct]: n }, { [cv]: [as, ar, Z, ag, aB], endpoint: { [cA]: t, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [as, ar, Z, ag, aD, aE], [cu]: [{ [cv]: cd, endpoint: bw, [ct]: n }, { endpoint: bw, [ct]: n }], [ct]: o }, { [cv]: [as, ar, Z, ag, aD, aH], endpoint: bw, [ct]: n }, { [cv]: [as, ar, aq, aB], endpoint: { [cA]: S, [cB]: aC, [cH]: al }, [ct]: n }, { [cv]: [as, ar, aq, aD, aE], [cu]: [{ [cv]: cd, endpoint: { [cA]: S, [cB]: aG, [cH]: al }, [ct]: n }, { endpoint: bx, [ct]: n }], [ct]: o }, { [cv]: [as, ar, aq, aD, aH], endpoint: bx, [ct]: n }], [ct]: o }, aR], [ct]: o }], [ct]: o }], [ct]: o }, { error: "A region must be set when sending requests to S3.", [ct]: f }] };
const ruleSet = _data;
const cache = new EndpointCache({
  size: 50,
  params: [
    "Accelerate",
    "Bucket",
    "DisableAccessPoints",
    "DisableMultiRegionAccessPoints",
    "DisableS3ExpressSessionAuth",
    "Endpoint",
    "ForcePathStyle",
    "Region",
    "UseArnRegion",
    "UseDualStack",
    "UseFIPS",
    "UseGlobalEndpoint",
    "UseObjectLambdaEndpoint",
    "UseS3ExpressControlEndpoint"
  ]
});
const defaultEndpointResolver = (endpointParams, context = {}) => {
  return cache.get(endpointParams, () => resolveEndpoint(ruleSet, {
    endpointParams,
    logger: context.logger
  }));
};
customEndpointFunctions.aws = awsEndpointFunctions;
const createEndpointRuleSetHttpAuthSchemeParametersProvider = (defaultHttpAuthSchemeParametersProvider) => async (config, context, input) => {
  if (!input) {
    throw new Error("Could not find `input` for `defaultEndpointRuleSetHttpAuthSchemeParametersProvider`");
  }
  const defaultParameters = await defaultHttpAuthSchemeParametersProvider(config, context, input);
  const instructionsFn = getSmithyContext(context)?.commandInstance?.constructor?.getEndpointParameterInstructions;
  if (!instructionsFn) {
    throw new Error(`getEndpointParameterInstructions() is not defined on '${context.commandName}'`);
  }
  const endpointParameters = await resolveParams(input, { getEndpointParameterInstructions: instructionsFn }, config);
  return Object.assign(defaultParameters, endpointParameters);
};
const _defaultS3HttpAuthSchemeParametersProvider = async (config, context, input) => {
  return {
    operation: getSmithyContext(context).operation,
    region: await normalizeProvider(config.region)() || (() => {
      throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
    })()
  };
};
const defaultS3HttpAuthSchemeParametersProvider = createEndpointRuleSetHttpAuthSchemeParametersProvider(_defaultS3HttpAuthSchemeParametersProvider);
function createAwsAuthSigv4HttpAuthOption(authParameters) {
  return {
    schemeId: "aws.auth#sigv4",
    signingProperties: {
      name: "s3",
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
function createAwsAuthSigv4aHttpAuthOption(authParameters) {
  return {
    schemeId: "aws.auth#sigv4a",
    signingProperties: {
      name: "s3",
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
const createEndpointRuleSetHttpAuthSchemeProvider = (defaultEndpointResolver2, defaultHttpAuthSchemeResolver, createHttpAuthOptionFunctions) => {
  const endpointRuleSetHttpAuthSchemeProvider = (authParameters) => {
    const endpoint = defaultEndpointResolver2(authParameters);
    const authSchemes = endpoint.properties?.authSchemes;
    if (!authSchemes) {
      return defaultHttpAuthSchemeResolver(authParameters);
    }
    const options = [];
    for (const scheme of authSchemes) {
      const { name: resolvedName, properties = {}, ...rest } = scheme;
      const name = resolvedName.toLowerCase();
      if (resolvedName !== name) {
        console.warn(`HttpAuthScheme has been normalized with lowercasing: '${resolvedName}' to '${name}'`);
      }
      let schemeId;
      if (name === "sigv4a") {
        schemeId = "aws.auth#sigv4a";
        const sigv4Present = authSchemes.find((s2) => {
          const name2 = s2.name.toLowerCase();
          return name2 !== "sigv4a" && name2.startsWith("sigv4");
        });
        if (SignatureV4MultiRegion.sigv4aDependency() === "none" && sigv4Present) {
          continue;
        }
      } else if (name.startsWith("sigv4")) {
        schemeId = "aws.auth#sigv4";
      } else {
        throw new Error(`Unknown HttpAuthScheme found in '@smithy.rules#endpointRuleSet': '${name}'`);
      }
      const createOption = createHttpAuthOptionFunctions[schemeId];
      if (!createOption) {
        throw new Error(`Could not find HttpAuthOption create function for '${schemeId}'`);
      }
      const option = createOption(authParameters);
      option.schemeId = schemeId;
      option.signingProperties = { ...option.signingProperties || {}, ...rest, ...properties };
      options.push(option);
    }
    return options;
  };
  return endpointRuleSetHttpAuthSchemeProvider;
};
const _defaultS3HttpAuthSchemeProvider = (authParameters) => {
  const options = [];
  switch (authParameters.operation) {
    default: {
      options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
      options.push(createAwsAuthSigv4aHttpAuthOption(authParameters));
    }
  }
  return options;
};
const defaultS3HttpAuthSchemeProvider = createEndpointRuleSetHttpAuthSchemeProvider(defaultEndpointResolver, _defaultS3HttpAuthSchemeProvider, {
  "aws.auth#sigv4": createAwsAuthSigv4HttpAuthOption,
  "aws.auth#sigv4a": createAwsAuthSigv4aHttpAuthOption
});
const resolveHttpAuthSchemeConfig = (config) => {
  const config_0 = resolveAwsSdkSigV4Config(config);
  const config_1 = resolveAwsSdkSigV4AConfig(config_0);
  return Object.assign(config_1, {
    authSchemePreference: normalizeProvider(config.authSchemePreference ?? [])
  });
};
const resolveClientEndpointParameters = (options) => {
  return Object.assign(options, {
    useFipsEndpoint: options.useFipsEndpoint ?? false,
    useDualstackEndpoint: options.useDualstackEndpoint ?? false,
    forcePathStyle: options.forcePathStyle ?? false,
    useAccelerateEndpoint: options.useAccelerateEndpoint ?? false,
    useGlobalEndpoint: options.useGlobalEndpoint ?? false,
    disableMultiregionAccessPoints: options.disableMultiregionAccessPoints ?? false,
    defaultSigningName: "s3",
    clientContextParams: options.clientContextParams ?? {}
  });
};
const commonParams = {
  ForcePathStyle: { type: "clientContextParams", name: "forcePathStyle" },
  UseArnRegion: { type: "clientContextParams", name: "useArnRegion" },
  DisableMultiRegionAccessPoints: { type: "clientContextParams", name: "disableMultiregionAccessPoints" },
  Accelerate: { type: "clientContextParams", name: "useAccelerateEndpoint" },
  DisableS3ExpressSessionAuth: { type: "clientContextParams", name: "disableS3ExpressSessionAuth" },
  UseGlobalEndpoint: { type: "builtInParams", name: "useGlobalEndpoint" },
  UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
  Endpoint: { type: "builtInParams", name: "endpoint" },
  Region: { type: "builtInParams", name: "region" },
  UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
};
class S3ServiceException extends ServiceException {
  constructor(options) {
    super(options);
    Object.setPrototypeOf(this, S3ServiceException.prototype);
  }
}
class NoSuchUpload extends S3ServiceException {
  name = "NoSuchUpload";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NoSuchUpload",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NoSuchUpload.prototype);
  }
}
class AccessDenied extends S3ServiceException {
  name = "AccessDenied";
  $fault = "client";
  constructor(opts) {
    super({
      name: "AccessDenied",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, AccessDenied.prototype);
  }
}
class ObjectNotInActiveTierError extends S3ServiceException {
  name = "ObjectNotInActiveTierError";
  $fault = "client";
  constructor(opts) {
    super({
      name: "ObjectNotInActiveTierError",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ObjectNotInActiveTierError.prototype);
  }
}
class BucketAlreadyExists extends S3ServiceException {
  name = "BucketAlreadyExists";
  $fault = "client";
  constructor(opts) {
    super({
      name: "BucketAlreadyExists",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, BucketAlreadyExists.prototype);
  }
}
class BucketAlreadyOwnedByYou extends S3ServiceException {
  name = "BucketAlreadyOwnedByYou";
  $fault = "client";
  constructor(opts) {
    super({
      name: "BucketAlreadyOwnedByYou",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, BucketAlreadyOwnedByYou.prototype);
  }
}
class NoSuchBucket extends S3ServiceException {
  name = "NoSuchBucket";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NoSuchBucket",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NoSuchBucket.prototype);
  }
}
class InvalidObjectState extends S3ServiceException {
  name = "InvalidObjectState";
  $fault = "client";
  StorageClass;
  AccessTier;
  constructor(opts) {
    super({
      name: "InvalidObjectState",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidObjectState.prototype);
    this.StorageClass = opts.StorageClass;
    this.AccessTier = opts.AccessTier;
  }
}
class NoSuchKey extends S3ServiceException {
  name = "NoSuchKey";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NoSuchKey",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NoSuchKey.prototype);
  }
}
class NotFound extends S3ServiceException {
  name = "NotFound";
  $fault = "client";
  constructor(opts) {
    super({
      name: "NotFound",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, NotFound.prototype);
  }
}
class EncryptionTypeMismatch extends S3ServiceException {
  name = "EncryptionTypeMismatch";
  $fault = "client";
  constructor(opts) {
    super({
      name: "EncryptionTypeMismatch",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, EncryptionTypeMismatch.prototype);
  }
}
class InvalidRequest extends S3ServiceException {
  name = "InvalidRequest";
  $fault = "client";
  constructor(opts) {
    super({
      name: "InvalidRequest",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidRequest.prototype);
  }
}
class InvalidWriteOffset extends S3ServiceException {
  name = "InvalidWriteOffset";
  $fault = "client";
  constructor(opts) {
    super({
      name: "InvalidWriteOffset",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, InvalidWriteOffset.prototype);
  }
}
class TooManyParts extends S3ServiceException {
  name = "TooManyParts";
  $fault = "client";
  constructor(opts) {
    super({
      name: "TooManyParts",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, TooManyParts.prototype);
  }
}
class IdempotencyParameterMismatch extends S3ServiceException {
  name = "IdempotencyParameterMismatch";
  $fault = "client";
  constructor(opts) {
    super({
      name: "IdempotencyParameterMismatch",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, IdempotencyParameterMismatch.prototype);
  }
}
class ObjectAlreadyInActiveTierError extends S3ServiceException {
  name = "ObjectAlreadyInActiveTierError";
  $fault = "client";
  constructor(opts) {
    super({
      name: "ObjectAlreadyInActiveTierError",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ObjectAlreadyInActiveTierError.prototype);
  }
}
const _ACL_ = "ACL";
const _AD = "AccessDenied";
const _AKI = "AccessKeyId";
const _AT = "AccessTier";
const _B = "Bucket";
const _BAE = "BucketAlreadyExists";
const _BAOBY = "BucketAlreadyOwnedByYou";
const _BKE = "BucketKeyEnabled";
const _Bo = "Body";
const _CA = "ChecksumAlgorithm";
const _CC = "CacheControl";
const _CCRC = "ChecksumCRC32";
const _CCRCC = "ChecksumCRC32C";
const _CCRCNVME = "ChecksumCRC64NVME";
const _CC_ = "Cache-Control";
const _CD_ = "Content-Disposition";
const _CDo = "ContentDisposition";
const _CE_ = "Content-Encoding";
const _CEo = "ContentEncoding";
const _CL = "ContentLanguage";
const _CL_ = "Content-Language";
const _CL__ = "Content-Length";
const _CLo = "ContentLength";
const _CM = "Content-MD5";
const _CMD = "ContentMD5";
const _CSHA = "ChecksumSHA1";
const _CSHAh = "ChecksumSHA256";
const _CSO = "CreateSessionOutput";
const _CSR = "CreateSessionResult";
const _CSRr = "CreateSessionRequest";
const _CSr = "CreateSession";
const _CT = "ChecksumType";
const _CT_ = "Content-Type";
const _CTo = "ContentType";
const _Cr = "Credentials";
const _E = "Expiration";
const _EBO = "ExpectedBucketOwner";
const _ETM = "EncryptionTypeMismatch";
const _ETa = "ETag";
const _Ex = "Expires";
const _GFC = "GrantFullControl";
const _GR = "GrantRead";
const _GRACP = "GrantReadACP";
const _GWACP = "GrantWriteACP";
const _IM = "IfMatch";
const _IM_ = "If-Match";
const _INM = "IfNoneMatch";
const _INM_ = "If-None-Match";
const _IOS = "InvalidObjectState";
const _IPM = "IdempotencyParameterMismatch";
const _IR = "InvalidRequest";
const _IWO = "InvalidWriteOffset";
const _K = "Key";
const _M = "Metadata";
const _NF = "NotFound";
const _NSB = "NoSuchBucket";
const _NSK = "NoSuchKey";
const _NSU = "NoSuchUpload";
const _OAIATE = "ObjectAlreadyInActiveTierError";
const _OLLHS = "ObjectLockLegalHoldStatus";
const _OLM = "ObjectLockMode";
const _OLRUD = "ObjectLockRetainUntilDate";
const _ONIATE = "ObjectNotInActiveTierError";
const _PO = "PutObject";
const _POO = "PutObjectOutput";
const _POR = "PutObjectRequest";
const _RC = "RequestCharged";
const _RP = "RequestPayer";
const _SAK = "SecretAccessKey";
const _SB = "StreamingBlob";
const _SC = "StorageClass";
const _SCV = "SessionCredentialValue";
const _SCe = "SessionCredentials";
const _SM = "SessionMode";
const _SSE = "ServerSideEncryption";
const _SSECA = "SSECustomerAlgorithm";
const _SSECK = "SSECustomerKey";
const _SSECKMD = "SSECustomerKeyMD5";
const _SSEKMSEC = "SSEKMSEncryptionContext";
const _SSEKMSKI = "SSEKMSKeyId";
const _ST = "SessionToken";
const _Si = "Size";
const _TMP = "TooManyParts";
const _Tag = "Tagging";
const _VI = "VersionId";
const _WOB = "WriteOffsetBytes";
const _WRL = "WebsiteRedirectLocation";
const _c = "client";
const _e = "error";
const _h = "http";
const _hC = "httpChecksum";
const _hE = "httpError";
const _hH = "httpHeader";
const _hPH = "httpPrefixHeaders";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.s3";
const _st = "streaming";
const _xN = "xmlName";
const _xaa = "x-amz-acl";
const _xacc = "x-amz-checksum-crc32";
const _xacc_ = "x-amz-checksum-crc32c";
const _xacc__ = "x-amz-checksum-crc64nvme";
const _xacs = "x-amz-checksum-sha1";
const _xacs_ = "x-amz-checksum-sha256";
const _xacsm = "x-amz-create-session-mode";
const _xact = "x-amz-checksum-type";
const _xae = "x-amz-expiration";
const _xaebo = "x-amz-expected-bucket-owner";
const _xagfc = "x-amz-grant-full-control";
const _xagr = "x-amz-grant-read";
const _xagra = "x-amz-grant-read-acp";
const _xagwa = "x-amz-grant-write-acp";
const _xam = "x-amz-meta-";
const _xaollh = "x-amz-object-lock-legal-hold";
const _xaolm = "x-amz-object-lock-mode";
const _xaolrud = "x-amz-object-lock-retain-until-date";
const _xaos = "x-amz-object-size";
const _xarc = "x-amz-request-charged";
const _xarp = "x-amz-request-payer";
const _xasc = "x-amz-storage-class";
const _xasca = "x-amz-sdk-checksum-algorithm";
const _xasse = "x-amz-server-side-encryption";
const _xasseakki = "x-amz-server-side-encryption-aws-kms-key-id";
const _xassebke = "x-amz-server-side-encryption-bucket-key-enabled";
const _xassec = "x-amz-server-side-encryption-context";
const _xasseca = "x-amz-server-side-encryption-customer-algorithm";
const _xasseck = "x-amz-server-side-encryption-customer-key";
const _xasseckM = "x-amz-server-side-encryption-customer-key-MD5";
const _xat = "x-amz-tagging";
const _xavi = "x-amz-version-id";
const _xawob = "x-amz-write-offset-bytes";
const _xawrl = "x-amz-website-redirect-location";
const n0 = "com.amazonaws.s3";
const _s_registry = TypeRegistry.for(_s);
var S3ServiceException$ = [-3, _s, "S3ServiceException", 0, [], []];
_s_registry.registerError(S3ServiceException$, S3ServiceException);
const n0_registry = TypeRegistry.for(n0);
var AccessDenied$ = [
  -3,
  n0,
  _AD,
  { [_e]: _c, [_hE]: 403 },
  [],
  []
];
n0_registry.registerError(AccessDenied$, AccessDenied);
var BucketAlreadyExists$ = [
  -3,
  n0,
  _BAE,
  { [_e]: _c, [_hE]: 409 },
  [],
  []
];
n0_registry.registerError(BucketAlreadyExists$, BucketAlreadyExists);
var BucketAlreadyOwnedByYou$ = [
  -3,
  n0,
  _BAOBY,
  { [_e]: _c, [_hE]: 409 },
  [],
  []
];
n0_registry.registerError(BucketAlreadyOwnedByYou$, BucketAlreadyOwnedByYou);
var EncryptionTypeMismatch$ = [
  -3,
  n0,
  _ETM,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(EncryptionTypeMismatch$, EncryptionTypeMismatch);
var IdempotencyParameterMismatch$ = [
  -3,
  n0,
  _IPM,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(IdempotencyParameterMismatch$, IdempotencyParameterMismatch);
var InvalidObjectState$ = [
  -3,
  n0,
  _IOS,
  { [_e]: _c, [_hE]: 403 },
  [_SC, _AT],
  [0, 0]
];
n0_registry.registerError(InvalidObjectState$, InvalidObjectState);
var InvalidRequest$ = [
  -3,
  n0,
  _IR,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(InvalidRequest$, InvalidRequest);
var InvalidWriteOffset$ = [
  -3,
  n0,
  _IWO,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(InvalidWriteOffset$, InvalidWriteOffset);
var NoSuchBucket$ = [
  -3,
  n0,
  _NSB,
  { [_e]: _c, [_hE]: 404 },
  [],
  []
];
n0_registry.registerError(NoSuchBucket$, NoSuchBucket);
var NoSuchKey$ = [
  -3,
  n0,
  _NSK,
  { [_e]: _c, [_hE]: 404 },
  [],
  []
];
n0_registry.registerError(NoSuchKey$, NoSuchKey);
var NoSuchUpload$ = [
  -3,
  n0,
  _NSU,
  { [_e]: _c, [_hE]: 404 },
  [],
  []
];
n0_registry.registerError(NoSuchUpload$, NoSuchUpload);
var NotFound$ = [
  -3,
  n0,
  _NF,
  { [_e]: _c },
  [],
  []
];
n0_registry.registerError(NotFound$, NotFound);
var ObjectAlreadyInActiveTierError$ = [
  -3,
  n0,
  _OAIATE,
  { [_e]: _c, [_hE]: 403 },
  [],
  []
];
n0_registry.registerError(ObjectAlreadyInActiveTierError$, ObjectAlreadyInActiveTierError);
var ObjectNotInActiveTierError$ = [
  -3,
  n0,
  _ONIATE,
  { [_e]: _c, [_hE]: 403 },
  [],
  []
];
n0_registry.registerError(ObjectNotInActiveTierError$, ObjectNotInActiveTierError);
var TooManyParts$ = [
  -3,
  n0,
  _TMP,
  { [_e]: _c, [_hE]: 400 },
  [],
  []
];
n0_registry.registerError(TooManyParts$, TooManyParts);
const errorTypeRegistries = [
  _s_registry,
  n0_registry
];
var SessionCredentialValue = [0, n0, _SCV, 8, 0];
var SSECustomerKey = [0, n0, _SSECK, 8, 0];
var SSEKMSEncryptionContext = [0, n0, _SSEKMSEC, 8, 0];
var SSEKMSKeyId = [0, n0, _SSEKMSKI, 8, 0];
var StreamingBlob = [0, n0, _SB, { [_st]: 1 }, 42];
var CreateSessionOutput$ = [
  3,
  n0,
  _CSO,
  { [_xN]: _CSR },
  [_Cr, _SSE, _SSEKMSKI, _SSEKMSEC, _BKE],
  [[() => SessionCredentials$, { [_xN]: _Cr }], [0, { [_hH]: _xasse }], [() => SSEKMSKeyId, { [_hH]: _xasseakki }], [() => SSEKMSEncryptionContext, { [_hH]: _xassec }], [2, { [_hH]: _xassebke }]],
  1
];
var CreateSessionRequest$ = [
  3,
  n0,
  _CSRr,
  0,
  [_B, _SM, _SSE, _SSEKMSKI, _SSEKMSEC, _BKE],
  [[0, 1], [0, { [_hH]: _xacsm }], [0, { [_hH]: _xasse }], [() => SSEKMSKeyId, { [_hH]: _xasseakki }], [() => SSEKMSEncryptionContext, { [_hH]: _xassec }], [2, { [_hH]: _xassebke }]],
  1
];
var PutObjectOutput$ = [
  3,
  n0,
  _POO,
  0,
  [_E, _ETa, _CCRC, _CCRCC, _CCRCNVME, _CSHA, _CSHAh, _CT, _SSE, _VI, _SSECA, _SSECKMD, _SSEKMSKI, _SSEKMSEC, _BKE, _Si, _RC],
  [[0, { [_hH]: _xae }], [0, { [_hH]: _ETa }], [0, { [_hH]: _xacc }], [0, { [_hH]: _xacc_ }], [0, { [_hH]: _xacc__ }], [0, { [_hH]: _xacs }], [0, { [_hH]: _xacs_ }], [0, { [_hH]: _xact }], [0, { [_hH]: _xasse }], [0, { [_hH]: _xavi }], [0, { [_hH]: _xasseca }], [0, { [_hH]: _xasseckM }], [() => SSEKMSKeyId, { [_hH]: _xasseakki }], [() => SSEKMSEncryptionContext, { [_hH]: _xassec }], [2, { [_hH]: _xassebke }], [1, { [_hH]: _xaos }], [0, { [_hH]: _xarc }]]
];
var PutObjectRequest$ = [
  3,
  n0,
  _POR,
  0,
  [_B, _K, _ACL_, _Bo, _CC, _CDo, _CEo, _CL, _CLo, _CMD, _CTo, _CA, _CCRC, _CCRCC, _CCRCNVME, _CSHA, _CSHAh, _Ex, _IM, _INM, _GFC, _GR, _GRACP, _GWACP, _WOB, _M, _SSE, _SC, _WRL, _SSECA, _SSECK, _SSECKMD, _SSEKMSKI, _SSEKMSEC, _BKE, _RP, _Tag, _OLM, _OLRUD, _OLLHS, _EBO],
  [[0, 1], [0, 1], [0, { [_hH]: _xaa }], [() => StreamingBlob, 16], [0, { [_hH]: _CC_ }], [0, { [_hH]: _CD_ }], [0, { [_hH]: _CE_ }], [0, { [_hH]: _CL_ }], [1, { [_hH]: _CL__ }], [0, { [_hH]: _CM }], [0, { [_hH]: _CT_ }], [0, { [_hH]: _xasca }], [0, { [_hH]: _xacc }], [0, { [_hH]: _xacc_ }], [0, { [_hH]: _xacc__ }], [0, { [_hH]: _xacs }], [0, { [_hH]: _xacs_ }], [4, { [_hH]: _Ex }], [0, { [_hH]: _IM_ }], [0, { [_hH]: _INM_ }], [0, { [_hH]: _xagfc }], [0, { [_hH]: _xagr }], [0, { [_hH]: _xagra }], [0, { [_hH]: _xagwa }], [1, { [_hH]: _xawob }], [128 | 0, { [_hPH]: _xam }], [0, { [_hH]: _xasse }], [0, { [_hH]: _xasc }], [0, { [_hH]: _xawrl }], [0, { [_hH]: _xasseca }], [() => SSECustomerKey, { [_hH]: _xasseck }], [0, { [_hH]: _xasseckM }], [() => SSEKMSKeyId, { [_hH]: _xasseakki }], [() => SSEKMSEncryptionContext, { [_hH]: _xassec }], [2, { [_hH]: _xassebke }], [0, { [_hH]: _xarp }], [0, { [_hH]: _xat }], [0, { [_hH]: _xaolm }], [5, { [_hH]: _xaolrud }], [0, { [_hH]: _xaollh }], [0, { [_hH]: _xaebo }]],
  2
];
var SessionCredentials$ = [
  3,
  n0,
  _SCe,
  0,
  [_AKI, _SAK, _ST, _E],
  [[0, { [_xN]: _AKI }], [() => SessionCredentialValue, { [_xN]: _SAK }], [() => SessionCredentialValue, { [_xN]: _ST }], [4, { [_xN]: _E }]],
  4
];
var CreateSession$ = [
  9,
  n0,
  _CSr,
  { [_h]: ["GET", "/?session", 200] },
  () => CreateSessionRequest$,
  () => CreateSessionOutput$
];
var PutObject$ = [
  9,
  n0,
  _PO,
  { [_hC]: "-", [_h]: ["PUT", "/{Key+}?x-id=PutObject", 200] },
  () => PutObjectRequest$,
  () => PutObjectOutput$
];
class CreateSessionCommand extends Command.classBuilder().ep({
  ...commonParams,
  DisableS3ExpressSessionAuth: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "CreateSession", {}).n("S3Client", "CreateSessionCommand").sc(CreateSession$).build() {
}
const version = "3.1000.0";
const packageInfo = {
  version
};
const getRuntimeConfig$1 = (config) => {
  return {
    apiVersion: "2006-03-01",
    base64Decoder: config?.base64Decoder ?? fromBase64,
    base64Encoder: config?.base64Encoder ?? toBase64,
    disableHostPrefix: config?.disableHostPrefix ?? false,
    endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
    extensions: config?.extensions ?? [],
    getAwsChunkedEncodingStream: config?.getAwsChunkedEncodingStream ?? getAwsChunkedEncodingStream,
    httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultS3HttpAuthSchemeProvider,
    httpAuthSchemes: config?.httpAuthSchemes ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new AwsSdkSigV4Signer()
      },
      {
        schemeId: "aws.auth#sigv4a",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4a"),
        signer: new AwsSdkSigV4ASigner()
      }
    ],
    logger: config?.logger ?? new NoOpLogger(),
    protocol: config?.protocol ?? AwsRestXmlProtocol,
    protocolSettings: config?.protocolSettings ?? {
      defaultNamespace: "com.amazonaws.s3",
      errorTypeRegistries,
      xmlNamespace: "http://s3.amazonaws.com/doc/2006-03-01/",
      version: "2006-03-01",
      serviceTarget: "AmazonS3"
    },
    sdkStreamMixin: config?.sdkStreamMixin ?? sdkStreamMixin,
    serviceId: config?.serviceId ?? "S3",
    signerConstructor: config?.signerConstructor ?? SignatureV4MultiRegion,
    signingEscapePath: config?.signingEscapePath ?? false,
    urlParser: config?.urlParser ?? parseUrl,
    useArnRegion: config?.useArnRegion ?? void 0,
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
    credentialDefaultProvider: config?.credentialDefaultProvider ?? defaultProvider,
    defaultUserAgentProvider: config?.defaultUserAgentProvider ?? createDefaultUserAgentProvider({ serviceId: clientSharedValues.serviceId, clientVersion: packageInfo.version }),
    disableS3ExpressSessionAuth: config?.disableS3ExpressSessionAuth ?? loadConfig(NODE_DISABLE_S3_EXPRESS_SESSION_AUTH_OPTIONS, loaderConfig),
    eventStreamSerdeProvider: config?.eventStreamSerdeProvider ?? eventStreamSerdeProvider,
    maxAttempts: config?.maxAttempts ?? loadConfig(NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config),
    md5: config?.md5 ?? Hash.bind(null, "md5"),
    region: config?.region ?? loadConfig(NODE_REGION_CONFIG_OPTIONS, { ...NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
    requestChecksumCalculation: config?.requestChecksumCalculation ?? loadConfig(NODE_REQUEST_CHECKSUM_CALCULATION_CONFIG_OPTIONS, loaderConfig),
    requestHandler: NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
    responseChecksumValidation: config?.responseChecksumValidation ?? loadConfig(NODE_RESPONSE_CHECKSUM_VALIDATION_CONFIG_OPTIONS, loaderConfig),
    retryMode: config?.retryMode ?? loadConfig({
      ...NODE_RETRY_MODE_CONFIG_OPTIONS,
      default: async () => (await defaultConfigProvider()).retryMode || DEFAULT_RETRY_MODE
    }, config),
    sha1: config?.sha1 ?? Hash.bind(null, "sha1"),
    sha256: config?.sha256 ?? Hash.bind(null, "sha256"),
    sigv4aSigningRegionSet: config?.sigv4aSigningRegionSet ?? loadConfig(NODE_SIGV4A_CONFIG_OPTIONS, loaderConfig),
    streamCollector: config?.streamCollector ?? streamCollector,
    streamHasher: config?.streamHasher ?? readableStreamHasher,
    useArnRegion: config?.useArnRegion ?? loadConfig(NODE_USE_ARN_REGION_CONFIG_OPTIONS, loaderConfig),
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
      const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
      if (index === -1) {
        _httpAuthSchemes.push(httpAuthScheme);
      } else {
        _httpAuthSchemes.splice(index, 1, httpAuthScheme);
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
class S3Client extends Client {
  config;
  constructor(...[configuration]) {
    const _config_0 = getRuntimeConfig(configuration || {});
    super(_config_0);
    this.initConfig = _config_0;
    const _config_1 = resolveClientEndpointParameters(_config_0);
    const _config_2 = resolveUserAgentConfig(_config_1);
    const _config_3 = resolveFlexibleChecksumsConfig(_config_2);
    const _config_4 = resolveRetryConfig(_config_3);
    const _config_5 = resolveRegionConfig(_config_4);
    const _config_6 = resolveHostHeaderConfig(_config_5);
    const _config_7 = resolveEndpointConfig(_config_6);
    const _config_8 = resolveEventStreamSerdeConfig(_config_7);
    const _config_9 = resolveHttpAuthSchemeConfig(_config_8);
    const _config_10 = resolveS3Config(_config_9, { session: [() => this, CreateSessionCommand] });
    const _config_11 = resolveRuntimeExtensions(_config_10, configuration?.extensions || []);
    this.config = _config_11;
    this.middlewareStack.use(getSchemaSerdePlugin(this.config));
    this.middlewareStack.use(getUserAgentPlugin(this.config));
    this.middlewareStack.use(getRetryPlugin(this.config));
    this.middlewareStack.use(getContentLengthPlugin(this.config));
    this.middlewareStack.use(getHostHeaderPlugin(this.config));
    this.middlewareStack.use(getLoggerPlugin(this.config));
    this.middlewareStack.use(getRecursionDetectionPlugin(this.config));
    this.middlewareStack.use(getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
      httpAuthSchemeParametersProvider: defaultS3HttpAuthSchemeParametersProvider,
      identityProviderConfigProvider: async (config) => new DefaultIdentityProviderConfig({
        "aws.auth#sigv4": config.credentials,
        "aws.auth#sigv4a": config.credentials
      })
    }));
    this.middlewareStack.use(getHttpSigningPlugin(this.config));
    this.middlewareStack.use(getValidateBucketNamePlugin(this.config));
    this.middlewareStack.use(getAddExpectContinuePlugin(this.config));
    this.middlewareStack.use(getRegionRedirectMiddlewarePlugin(this.config));
    this.middlewareStack.use(getS3ExpressPlugin(this.config));
    this.middlewareStack.use(getS3ExpressHttpSigningPlugin(this.config));
  }
  destroy() {
    super.destroy();
  }
}
class PutObjectCommand extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { "httpHeader": "x-amz-sdk-checksum-algorithm", "name": "ChecksumAlgorithm" },
      requestChecksumRequired: false
    }),
    getCheckContentLengthHeaderPlugin(),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config)
  ];
}).s("AmazonS3", "PutObject", {}).n("S3Client", "PutObjectCommand").sc(PutObject$).build() {
}
export {
  PutObjectCommand as P,
  S3Client as S
};
