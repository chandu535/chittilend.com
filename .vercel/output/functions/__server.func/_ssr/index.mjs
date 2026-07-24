import { c as createMemoryHistory } from "../_chunks/_libs/@tanstack/history.mjs";
import { p as parseRedirect, o as mergeHeaders, b as isRedirect, a as rootRouteId, q as getNormalizedURL, u as getOrigin, v as attachRouterServerSsrUtils, w as defineHandlerCallback, x as createSerializationAdapter, y as createRawStreamRPCPlugin, i as isNotFound, z as isResolvedRedirect, A as executeRewriteInput, C as defaultSerovalPlugins, D as makeSerovalPlugin } from "../_chunks/_libs/@tanstack/router-core.mjs";
import { AsyncLocalStorage } from "node:async_hooks";
import { d as deleteCookie$1, s as setCookie$1, p as parseCookies, H as H3Event, t as toResponse } from "../_libs/h3-v2.mjs";
import { i as invariant } from "../_libs/tiny-invariant.mjs";
import { a as au, I as Iu, o as ou } from "../_libs/seroval.mjs";
import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { r as renderRouterToStream, R as RouterProvider } from "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
function StartServer(props) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RouterProvider, { router: props.router });
}
const defaultStreamHandler = defineHandlerCallback(
  ({ request, router, responseHeaders }) => renderRouterToStream({
    request,
    router,
    responseHeaders,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(StartServer, { router })
  })
);
const TSS_FORMDATA_CONTEXT = "__TSS_CONTEXT";
const TSS_SERVER_FUNCTION = /* @__PURE__ */ Symbol.for("TSS_SERVER_FUNCTION");
const TSS_SERVER_FUNCTION_FACTORY = /* @__PURE__ */ Symbol.for(
  "TSS_SERVER_FUNCTION_FACTORY"
);
const X_TSS_SERIALIZED = "x-tss-serialized";
const X_TSS_RAW_RESPONSE = "x-tss-raw";
const TSS_CONTENT_TYPE_FRAMED = "application/x-tss-framed";
const FrameType = {
  /** Seroval JSON chunk (NDJSON line) */
  JSON: 0,
  /** Raw stream data chunk */
  CHUNK: 1,
  /** Raw stream end (EOF) */
  END: 2,
  /** Raw stream error */
  ERROR: 3
};
const FRAME_HEADER_SIZE = 9;
const TSS_FRAMED_PROTOCOL_VERSION = 1;
const TSS_CONTENT_TYPE_FRAMED_VERSIONED = `${TSS_CONTENT_TYPE_FRAMED}; v=${TSS_FRAMED_PROTOCOL_VERSION}`;
const GLOBAL_STORAGE_KEY = /* @__PURE__ */ Symbol.for("tanstack-start:start-storage-context");
const globalObj$1 = globalThis;
if (!globalObj$1[GLOBAL_STORAGE_KEY]) {
  globalObj$1[GLOBAL_STORAGE_KEY] = new AsyncLocalStorage();
}
const startStorage = globalObj$1[GLOBAL_STORAGE_KEY];
async function runWithStartContext(context, fn) {
  return startStorage.run(context, fn);
}
function getStartContext(opts) {
  const context = startStorage.getStore();
  if (!context && opts?.throwIfNotFound !== false) {
    throw new Error(
      `No Start context found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`
    );
  }
  return context;
}
const getStartOptions = () => getStartContext().startOptions;
const getStartContextServerOnly = getStartContext;
function isSafeKey(key) {
  return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}
function safeObjectMerge(target, source) {
  const result = /* @__PURE__ */ Object.create(null);
  if (target) {
    for (const key of Object.keys(target)) {
      if (isSafeKey(key)) result[key] = target[key];
    }
  }
  if (source && typeof source === "object") {
    for (const key of Object.keys(source)) {
      if (isSafeKey(key)) result[key] = source[key];
    }
  }
  return result;
}
function createNullProtoObject(source) {
  if (!source) return /* @__PURE__ */ Object.create(null);
  const obj = /* @__PURE__ */ Object.create(null);
  for (const key of Object.keys(source)) {
    if (isSafeKey(key)) obj[key] = source[key];
  }
  return obj;
}
const createServerFn = (options, __opts) => {
  const resolvedOptions = __opts || options || {};
  if (typeof resolvedOptions.method === "undefined") {
    resolvedOptions.method = "GET";
  }
  const res = {
    options: resolvedOptions,
    middleware: (middleware) => {
      const newMiddleware = [...resolvedOptions.middleware || []];
      middleware.map((m) => {
        if (TSS_SERVER_FUNCTION_FACTORY in m) {
          if (m.options.middleware) {
            newMiddleware.push(...m.options.middleware);
          }
        } else {
          newMiddleware.push(m);
        }
      });
      const newOptions = {
        ...resolvedOptions,
        middleware: newMiddleware
      };
      const res2 = createServerFn(void 0, newOptions);
      res2[TSS_SERVER_FUNCTION_FACTORY] = true;
      return res2;
    },
    inputValidator: (inputValidator) => {
      const newOptions = { ...resolvedOptions, inputValidator };
      return createServerFn(void 0, newOptions);
    },
    handler: (...args) => {
      const [extractedFn, serverFn] = args;
      const newOptions = { ...resolvedOptions, extractedFn, serverFn };
      const resolvedMiddleware = [
        ...newOptions.middleware || [],
        serverFnBaseToMiddleware(newOptions)
      ];
      extractedFn.method = resolvedOptions.method;
      return Object.assign(
        async (opts) => {
          const result = await executeMiddleware$1(resolvedMiddleware, "client", {
            ...extractedFn,
            ...newOptions,
            data: opts?.data,
            headers: opts?.headers,
            signal: opts?.signal,
            fetch: opts?.fetch,
            context: createNullProtoObject()
          });
          const redirect = parseRedirect(result.error);
          if (redirect) {
            throw redirect;
          }
          if (result.error) throw result.error;
          return result.result;
        },
        {
          // This copies over the URL, function ID
          ...extractedFn,
          // Expose the declared HTTP method so the server handler
          // can reject mismatched methods before parsing payloads
          method: resolvedOptions.method,
          // The extracted function on the server-side calls
          // this function
          __executeServer: async (opts) => {
            const startContext = getStartContextServerOnly();
            const serverContextAfterGlobalMiddlewares = startContext.contextAfterGlobalMiddlewares;
            const ctx = {
              ...extractedFn,
              ...opts,
              // Ensure we use the full serverFnMeta from the provider file's extractedFn
              // (which has id, name, filename) rather than the partial one from SSR/client
              // callers (which only has id)
              serverFnMeta: extractedFn.serverFnMeta,
              // Use safeObjectMerge for opts.context which comes from client
              context: safeObjectMerge(
                serverContextAfterGlobalMiddlewares,
                opts.context
              ),
              request: startContext.request
            };
            const result = await executeMiddleware$1(
              resolvedMiddleware,
              "server",
              ctx
            ).then((d) => ({
              // Only send the result and sendContext back to the client
              result: d.result,
              error: d.error,
              context: d.sendContext
            }));
            return result;
          }
        }
      );
    }
  };
  const fun = (options2) => {
    const newOptions = {
      ...resolvedOptions,
      ...options2
    };
    return createServerFn(void 0, newOptions);
  };
  return Object.assign(fun, res);
};
async function executeMiddleware$1(middlewares, env, opts) {
  const globalMiddlewares = getStartOptions()?.functionMiddleware || [];
  let flattenedMiddlewares = flattenMiddlewares([
    ...globalMiddlewares,
    ...middlewares
  ]);
  if (env === "server") {
    const startContext = getStartContextServerOnly({ throwIfNotFound: false });
    if (startContext?.executedRequestMiddlewares) {
      flattenedMiddlewares = flattenedMiddlewares.filter(
        (m) => !startContext.executedRequestMiddlewares.has(m)
      );
    }
  }
  const callNextMiddleware = async (ctx) => {
    const nextMiddleware = flattenedMiddlewares.shift();
    if (!nextMiddleware) {
      return ctx;
    }
    try {
      if ("inputValidator" in nextMiddleware.options && nextMiddleware.options.inputValidator && env === "server") {
        ctx.data = await execValidator(
          nextMiddleware.options.inputValidator,
          ctx.data
        );
      }
      let middlewareFn = void 0;
      if (env === "client") {
        if ("client" in nextMiddleware.options) {
          middlewareFn = nextMiddleware.options.client;
        }
      } else if ("server" in nextMiddleware.options) {
        middlewareFn = nextMiddleware.options.server;
      }
      if (middlewareFn) {
        const userNext = async (userCtx = {}) => {
          const nextCtx = {
            ...ctx,
            ...userCtx,
            context: safeObjectMerge(ctx.context, userCtx.context),
            sendContext: safeObjectMerge(ctx.sendContext, userCtx.sendContext),
            headers: mergeHeaders(ctx.headers, userCtx.headers),
            _callSiteFetch: ctx._callSiteFetch,
            fetch: ctx._callSiteFetch ?? userCtx.fetch ?? ctx.fetch,
            result: userCtx.result !== void 0 ? userCtx.result : userCtx instanceof Response ? userCtx : ctx.result,
            error: userCtx.error ?? ctx.error
          };
          const result2 = await callNextMiddleware(nextCtx);
          if (result2.error) {
            throw result2.error;
          }
          return result2;
        };
        const result = await middlewareFn({
          ...ctx,
          next: userNext
        });
        if (isRedirect(result)) {
          return {
            ...ctx,
            error: result
          };
        }
        if (result instanceof Response) {
          return {
            ...ctx,
            result
          };
        }
        if (!result) {
          throw new Error(
            "User middleware returned undefined. You must call next() or return a result in your middlewares."
          );
        }
        return result;
      }
      return callNextMiddleware(ctx);
    } catch (error) {
      return {
        ...ctx,
        error
      };
    }
  };
  return callNextMiddleware({
    ...opts,
    headers: opts.headers || {},
    sendContext: opts.sendContext || {},
    context: opts.context || createNullProtoObject(),
    _callSiteFetch: opts.fetch
  });
}
function flattenMiddlewares(middlewares, maxDepth = 100) {
  const seen = /* @__PURE__ */ new Set();
  const flattened = [];
  const recurse = (middleware, depth) => {
    if (depth > maxDepth) {
      throw new Error(
        `Middleware nesting depth exceeded maximum of ${maxDepth}. Check for circular references.`
      );
    }
    middleware.forEach((m) => {
      if (m.options.middleware) {
        recurse(m.options.middleware, depth + 1);
      }
      if (!seen.has(m)) {
        seen.add(m);
        flattened.push(m);
      }
    });
  };
  recurse(middlewares, 0);
  return flattened;
}
async function execValidator(validator, input) {
  if (validator == null) return {};
  if ("~standard" in validator) {
    const result = await validator["~standard"].validate(input);
    if (result.issues)
      throw new Error(JSON.stringify(result.issues, void 0, 2));
    return result.value;
  }
  if ("parse" in validator) {
    return validator.parse(input);
  }
  if (typeof validator === "function") {
    return validator(input);
  }
  throw new Error("Invalid validator type!");
}
function serverFnBaseToMiddleware(options) {
  return {
    "~types": void 0,
    options: {
      inputValidator: options.inputValidator,
      client: async ({ next, sendContext, fetch: fetch2, ...ctx }) => {
        const payload = {
          ...ctx,
          // switch the sendContext over to context
          context: sendContext,
          fetch: fetch2
        };
        const res = await options.extractedFn?.(payload);
        return next(res);
      },
      server: async ({ next, ...ctx }) => {
        const result = await options.serverFn?.(ctx);
        return next({
          ...ctx,
          result
        });
      }
    }
  };
}
function getDefaultSerovalPlugins() {
  const start = getStartOptions();
  const adapters = start?.serializationAdapters;
  return [
    ...adapters?.map(makeSerovalPlugin) ?? [],
    ...defaultSerovalPlugins
  ];
}
const GLOBAL_EVENT_STORAGE_KEY = /* @__PURE__ */ Symbol.for("tanstack-start:event-storage");
const globalObj = globalThis;
if (!globalObj[GLOBAL_EVENT_STORAGE_KEY]) {
  globalObj[GLOBAL_EVENT_STORAGE_KEY] = new AsyncLocalStorage();
}
const eventStorage = globalObj[GLOBAL_EVENT_STORAGE_KEY];
function isPromiseLike(value) {
  return typeof value.then === "function";
}
function getSetCookieValues(headers) {
  const headersWithSetCookie = headers;
  if (typeof headersWithSetCookie.getSetCookie === "function") {
    return headersWithSetCookie.getSetCookie();
  }
  const value = headers.get("set-cookie");
  return value ? [value] : [];
}
function mergeEventResponseHeaders(response, event) {
  if (response.ok) {
    return;
  }
  const eventSetCookies = getSetCookieValues(event.res.headers);
  if (eventSetCookies.length === 0) {
    return;
  }
  const responseSetCookies = getSetCookieValues(response.headers);
  response.headers.delete("set-cookie");
  for (const cookie of responseSetCookies) {
    response.headers.append("set-cookie", cookie);
  }
  for (const cookie of eventSetCookies) {
    response.headers.append("set-cookie", cookie);
  }
}
function attachResponseHeaders(value, event) {
  if (isPromiseLike(value)) {
    return value.then((resolved) => {
      if (resolved instanceof Response) {
        mergeEventResponseHeaders(resolved, event);
      }
      return resolved;
    });
  }
  if (value instanceof Response) {
    mergeEventResponseHeaders(value, event);
  }
  return value;
}
function requestHandler(handler) {
  return (request, requestOpts) => {
    const h3Event = new H3Event(request);
    const response = eventStorage.run(
      { h3Event },
      () => handler(request, requestOpts)
    );
    return toResponse(attachResponseHeaders(response, h3Event), h3Event);
  };
}
function getH3Event() {
  const event = eventStorage.getStore();
  if (!event) {
    throw new Error(
      `No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`
    );
  }
  return event.h3Event;
}
function getCookies() {
  const event = getH3Event();
  return parseCookies(event);
}
function getCookie(name) {
  return getCookies()[name] || void 0;
}
function setCookie(name, value, options) {
  const event = getH3Event();
  setCookie$1(event, name, value, options);
}
function deleteCookie(name, options) {
  const event = getH3Event();
  deleteCookie$1(event, name, options);
}
function getResponse() {
  const event = getH3Event();
  return event.res;
}
async function getStartManifest(matchedRoutes) {
  const { tsrStartManifest } = await import("./_tanstack-start-manifest_v-CKtXIpnu.mjs");
  const startManifest = tsrStartManifest();
  const rootRoute = startManifest.routes[rootRouteId] = startManifest.routes[rootRouteId] || {};
  rootRoute.assets = rootRoute.assets || [];
  let injectedHeadScripts;
  const manifest2 = {
    routes: Object.fromEntries(
      Object.entries(startManifest.routes).flatMap(([k, v]) => {
        const result = {};
        let hasData = false;
        if (v.preloads && v.preloads.length > 0) {
          result["preloads"] = v.preloads;
          hasData = true;
        }
        if (v.assets && v.assets.length > 0) {
          result["assets"] = v.assets;
          hasData = true;
        }
        if (!hasData) {
          return [];
        }
        return [[k, result]];
      })
    )
  };
  return {
    manifest: manifest2,
    clientEntry: startManifest.clientEntry,
    injectedHeadScripts
  };
}
const textEncoder$1 = new TextEncoder();
const EMPTY_PAYLOAD = new Uint8Array(0);
function encodeFrame(type, streamId, payload) {
  const frame = new Uint8Array(FRAME_HEADER_SIZE + payload.length);
  frame[0] = type;
  frame[1] = streamId >>> 24 & 255;
  frame[2] = streamId >>> 16 & 255;
  frame[3] = streamId >>> 8 & 255;
  frame[4] = streamId & 255;
  frame[5] = payload.length >>> 24 & 255;
  frame[6] = payload.length >>> 16 & 255;
  frame[7] = payload.length >>> 8 & 255;
  frame[8] = payload.length & 255;
  frame.set(payload, FRAME_HEADER_SIZE);
  return frame;
}
function encodeJSONFrame(json) {
  return encodeFrame(FrameType.JSON, 0, textEncoder$1.encode(json));
}
function encodeChunkFrame(streamId, chunk) {
  return encodeFrame(FrameType.CHUNK, streamId, chunk);
}
function encodeEndFrame(streamId) {
  return encodeFrame(FrameType.END, streamId, EMPTY_PAYLOAD);
}
function encodeErrorFrame(streamId, error) {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  return encodeFrame(FrameType.ERROR, streamId, textEncoder$1.encode(message));
}
function createMultiplexedStream(jsonStream, rawStreams) {
  let activePumps = 1 + rawStreams.size;
  let controllerRef = null;
  let cancelled = false;
  const cancelReaders = [];
  const safeEnqueue = (chunk) => {
    if (cancelled || !controllerRef) return;
    try {
      controllerRef.enqueue(chunk);
    } catch {
    }
  };
  const safeError = (err) => {
    if (cancelled || !controllerRef) return;
    try {
      controllerRef.error(err);
    } catch {
    }
  };
  const safeClose = () => {
    if (cancelled || !controllerRef) return;
    try {
      controllerRef.close();
    } catch {
    }
  };
  const checkComplete = () => {
    activePumps--;
    if (activePumps === 0) {
      safeClose();
    }
  };
  return new ReadableStream({
    start(controller) {
      controllerRef = controller;
      cancelReaders.length = 0;
      const pumpJSON = async () => {
        const reader = jsonStream.getReader();
        cancelReaders.push(() => {
          reader.cancel().catch(() => {
          });
        });
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (cancelled) break;
            if (done) break;
            safeEnqueue(encodeJSONFrame(value));
          }
        } catch (error) {
          safeError(error);
        } finally {
          reader.releaseLock();
          checkComplete();
        }
      };
      const pumpRawStream = async (streamId, stream) => {
        const reader = stream.getReader();
        cancelReaders.push(() => {
          reader.cancel().catch(() => {
          });
        });
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (cancelled) break;
            if (done) {
              safeEnqueue(encodeEndFrame(streamId));
              break;
            }
            safeEnqueue(encodeChunkFrame(streamId, value));
          }
        } catch (error) {
          safeEnqueue(encodeErrorFrame(streamId, error));
        } finally {
          reader.releaseLock();
          checkComplete();
        }
      };
      pumpJSON();
      for (const [streamId, stream] of rawStreams) {
        pumpRawStream(streamId, stream);
      }
    },
    cancel() {
      cancelled = true;
      controllerRef = null;
      for (const cancelReader of cancelReaders) {
        cancelReader();
      }
      cancelReaders.length = 0;
    }
  });
}
const manifest = { "c66295356ee1bed9dcd6acc6996417714105d1c255d6dc117cb348c4624a9cfa": {
  functionName: "login_createServerFn_handler",
  importer: () => import("./auth-DNFnH8E0.mjs")
}, "29fdd7534a8fc4cc73a2fc0e6a37abee71570be1256a0cd8b872f6c5140c326e": {
  functionName: "logout_createServerFn_handler",
  importer: () => import("./auth-DNFnH8E0.mjs")
}, "bf7d44565f0a75f8775052ea39a4b3599b3e66c0d477bc07f07917b7fb9585ca": {
  functionName: "getSession_createServerFn_handler",
  importer: () => import("./auth-DNFnH8E0.mjs")
}, "8829a2c83808fdbc570343dfba48bb912c280a25f1e33ff0d12598054a2751a2": {
  functionName: "verifyPortalToken_createServerFn_handler",
  importer: () => import("./auth-DNFnH8E0.mjs")
}, "19c53245c787054aa8380a119cf8051162f8b3ea34375828992f42047dbe4e46": {
  functionName: "getPortalData_createServerFn_handler",
  importer: () => import("./portal-B1s1RRWz.mjs")
}, "86137142a74d80357aac4d577d75d056d30cd47b41a4a6566b21623b672b5b1e": {
  functionName: "getDashboardSummary_createServerFn_handler",
  importer: () => import("./analytics-CqAN6B03.mjs")
}, "21372f13675cb16fef1a6a80ea212d700ad9e6d25ba796aa09565aef12f5cbe7": {
  functionName: "getCashflowTimeline_createServerFn_handler",
  importer: () => import("./analytics-CqAN6B03.mjs")
}, "6545723090aa22a2c36a2643951f144b7b594339e32a0728c055a08805363cae": {
  functionName: "getAreaBreakdown_createServerFn_handler",
  importer: () => import("./analytics-CqAN6B03.mjs")
}, "659dadff243a85a5bac6d9206571e508b15d4876047c9dc57011f252f79ff484": {
  functionName: "getBorrowerRanking_createServerFn_handler",
  importer: () => import("./analytics-CqAN6B03.mjs")
}, "3e9c2c0571901ffe57141eacf53b8ed8d92472b720c79109737bf5aa8f528922": {
  functionName: "getStatusDistribution_createServerFn_handler",
  importer: () => import("./analytics-CqAN6B03.mjs")
}, "dbd9f7730ebad79ea4ce6669df1e8129b72f2cacf83639e4d70a092dbc83e880": {
  functionName: "getMonthlySnapshot_createServerFn_handler",
  importer: () => import("./analytics-CqAN6B03.mjs")
}, "e9a4555d7c844d233b99e27d25f094e7df13d73cd7572c2b83920784810d6748": {
  functionName: "getRecentActivity_createServerFn_handler",
  importer: () => import("./analytics-CqAN6B03.mjs")
}, "ddff522c8bb9ccb79a21689bc8a037e0bc5c0b03976bfad9aea68f21c22e49e0": {
  functionName: "listPaymentsByLoan_createServerFn_handler",
  importer: () => import("./payments-B8sU1Ybk.mjs")
}, "59c15f949d8dc113c6350ef01cf363752f956a68f708bdf6f58805fda162f915": {
  functionName: "markPaymentPaid_createServerFn_handler",
  importer: () => import("./payments-B8sU1Ybk.mjs")
}, "8f1f91b5598343ef977b6533acc047b67e13f3f1a85847038c59286ffbae29bf": {
  functionName: "markPaymentPartial_createServerFn_handler",
  importer: () => import("./payments-B8sU1Ybk.mjs")
}, "24c97fbfdfdea218d73ce4fe6aa689f5ada68672778a74aac52cdfdc7f376115": {
  functionName: "markPaymentWaived_createServerFn_handler",
  importer: () => import("./payments-B8sU1Ybk.mjs")
}, "27af284ac630b437bdbda95142b0abfbefc64d0f0ff24c5f855347ceaec795df": {
  functionName: "listUpcomingPayments_createServerFn_handler",
  importer: () => import("./payments-B8sU1Ybk.mjs")
}, "eb9a0a8f9fbcc6d36f47887494e1861a79a993fc0634c5fab13f0bfadff2181f": {
  functionName: "listOverduePayments_createServerFn_handler",
  importer: () => import("./payments-B8sU1Ybk.mjs")
}, "467a4add2f8162dd6e91ae88288e840b44a1533c7629bd97404f41a8e480e67b": {
  functionName: "listRecentPayments_createServerFn_handler",
  importer: () => import("./payments-B8sU1Ybk.mjs")
}, "1b7c1f44b08991f3daafb4a2ca8a6a97cedb276718c2c33042cf5e1c0dda0be9": {
  functionName: "revertPayment_createServerFn_handler",
  importer: () => import("./payments-B8sU1Ybk.mjs")
}, "ee8c6974c87a15c3f851649bc5854dcd90080d025f99584e051c0187379c58b5": {
  functionName: "bulkUpdateOverdueStatus_createServerFn_handler",
  importer: () => import("./payments-B8sU1Ybk.mjs")
}, "cc11e524a6bf78967b71a718ff53a0b27099805b4c84beb43f5eb652c045bf60": {
  functionName: "getCapitalBalance_createServerFn_handler",
  importer: () => import("./capital-00ruq479.mjs")
}, "727e83e3ba9a6397583d7296131d393575f763162e2298693aa6ed034b64ed61": {
  functionName: "getCapitalLog_createServerFn_handler",
  importer: () => import("./capital-00ruq479.mjs")
}, "b5b76cdd5bf2632d2f5e9c07e7f1cee2047f8cc7b538a73532cb598e98860fc0": {
  functionName: "addInvestment_createServerFn_handler",
  importer: () => import("./capital-00ruq479.mjs")
}, "c6aac2c5f1e616252a1cd37b59ff41c6b3ed900ab92cbd85e8c5b69b6725aef3": {
  functionName: "listLoans_createServerFn_handler",
  importer: () => import("./loans-EnIicyuY.mjs")
}, "598abfe0b55db0d95b1f41e6294dee2fb9697115d41bec08c40a6a51475a1790": {
  functionName: "getLoanById_createServerFn_handler",
  importer: () => import("./loans-EnIicyuY.mjs")
}, "dc465117bc796bf617a74a59b0b3cf5a9a299261996da1e1500aafb78575d145": {
  functionName: "createLoan_createServerFn_handler",
  importer: () => import("./loans-EnIicyuY.mjs")
}, "deaca83f8752c79c3c1dda0649870988e1cf3c42f1baffc248e4cdec82929de1": {
  functionName: "updateLoan_createServerFn_handler",
  importer: () => import("./loans-EnIicyuY.mjs")
}, "30b913d22c4bf7659f9f140cd86dc966712ef404a269811cd4222e03d847627f": {
  functionName: "extendTenure_createServerFn_handler",
  importer: () => import("./loans-EnIicyuY.mjs")
}, "361d9805ac41dce6e3f105c867a61b961eed5b15f6fcfa1883da0be151707733": {
  functionName: "changeStatus_createServerFn_handler",
  importer: () => import("./loans-EnIicyuY.mjs")
}, "2b1febee5c8352ad582297cea76d90d23bf6ab8bb6f7abdcc2d6b34723e07067": {
  functionName: "listBorrowers_createServerFn_handler",
  importer: () => import("./borrowers-C7M5H29w.mjs")
}, "f8fa8e37fb95dcb732a5664237572af025802fa7026aa5bb268ecb5b3db6efa8": {
  functionName: "getBorrowerById_createServerFn_handler",
  importer: () => import("./borrowers-C7M5H29w.mjs")
}, "9224c6c400432973e2a31c14018e45cd63e0a8de4b5ec9883bb6ff7b28501648": {
  functionName: "createBorrower_createServerFn_handler",
  importer: () => import("./borrowers-C7M5H29w.mjs")
}, "b7a4cf04ffd8a5b15f834ee95339c99b18115fde677512f72a588f58ff6d4387": {
  functionName: "updateBorrower_createServerFn_handler",
  importer: () => import("./borrowers-C7M5H29w.mjs")
}, "17d267557b2ea379c4700e1419c007e8de89febce492c7fade7b8b457a61f2f7": {
  functionName: "generateNewMagicLink_createServerFn_handler",
  importer: () => import("./borrowers-C7M5H29w.mjs")
}, "89ade9f6e5ddc3ac6b5567266dc044c9dcdeb1bae24e7d378d558882950d24b1": {
  functionName: "searchBorrowers_createServerFn_handler",
  importer: () => import("./borrowers-C7M5H29w.mjs")
}, "8e6468c5eff369b3b413d794897027be351edd040f192ff3545adfccc32ca6e4": {
  functionName: "deleteBorrower_createServerFn_handler",
  importer: () => import("./borrowers-C7M5H29w.mjs")
}, "faf23032f626d47cf6b4fdfa73ba96d0e74bb314fefc6c764d95b0f7bacf768d": {
  functionName: "listAreas_createServerFn_handler",
  importer: () => import("./borrowers-C7M5H29w.mjs")
}, "542cd0838f496f237f9f1a986b69ea6cab57c0d2acf4519ea5d55ed771e7606a": {
  functionName: "uploadBorrowerPhoto_createServerFn_handler",
  importer: () => import("./upload-CEfkfd5L.mjs")
}, "4ac19b88fda24680112998290cab23be6b3ca6dbd7a210ce4a0ded515ed2c8ba": {
  functionName: "listManagers_createServerFn_handler",
  importer: () => import("./users-Cnpt9kgS.mjs")
}, "3522d6afa08eb1863225729ae565bc746cf03f7dff76d212cb10a9b18ba28bbd": {
  functionName: "createManager_createServerFn_handler",
  importer: () => import("./users-Cnpt9kgS.mjs")
}, "0de027824cdfd2a4d95cdce2b5fe1a4d14143af767c24d1ce2d191f08b910dc0": {
  functionName: "toggleManagerActive_createServerFn_handler",
  importer: () => import("./users-Cnpt9kgS.mjs")
}, "2f15cf97c55a997040ea638dacd5e036f9ef72c63417c6b0124d32db95c057d7": {
  functionName: "sendLoanWhatsAppTemplate_createServerFn_handler",
  importer: () => import("./whatsapp-YnvE5i-7.mjs")
} };
async function getServerFnById(id) {
  const serverFnInfo = manifest[id];
  if (!serverFnInfo) {
    throw new Error("Server function info not found for " + id);
  }
  const fnModule = await serverFnInfo.importer();
  if (!fnModule) {
    console.info("serverFnInfo", serverFnInfo);
    throw new Error("Server function module not resolved for " + id);
  }
  const action = fnModule[serverFnInfo.functionName];
  if (!action) {
    console.info("serverFnInfo", serverFnInfo);
    console.info("fnModule", fnModule);
    throw new Error(
      `Server function module export not resolved for serverFn ID: ${id}`
    );
  }
  return action;
}
let serovalPlugins = void 0;
const textEncoder = new TextEncoder();
const FORM_DATA_CONTENT_TYPES = [
  "multipart/form-data",
  "application/x-www-form-urlencoded"
];
const MAX_PAYLOAD_SIZE = 1e6;
const handleServerAction = async ({
  request,
  context,
  serverFnId
}) => {
  const method = request.method;
  const methodUpper = method.toUpperCase();
  const url = new URL(request.url);
  const action = await getServerFnById(serverFnId);
  if (action.method && methodUpper !== action.method) {
    return new Response(
      `expected ${action.method} method. Got ${methodUpper}`,
      {
        status: 405,
        headers: {
          Allow: action.method
        }
      }
    );
  }
  const isServerFn = request.headers.get("x-tsr-serverFn") === "true";
  if (!serovalPlugins) {
    serovalPlugins = getDefaultSerovalPlugins();
  }
  const contentType = request.headers.get("Content-Type");
  function parsePayload(payload) {
    const parsedPayload = Iu(payload, { plugins: serovalPlugins });
    return parsedPayload;
  }
  const response = await (async () => {
    try {
      let serializeResult = function(res2) {
        let nonStreamingBody = void 0;
        const alsResponse = getResponse();
        if (res2 !== void 0) {
          const rawStreams = /* @__PURE__ */ new Map();
          const rawStreamPlugin = createRawStreamRPCPlugin(
            (id, stream2) => {
              rawStreams.set(id, stream2);
            }
          );
          const plugins = [rawStreamPlugin, ...serovalPlugins || []];
          let done = false;
          const callbacks = {
            onParse: (value) => {
              nonStreamingBody = value;
            },
            onDone: () => {
              done = true;
            },
            onError: (error) => {
              throw error;
            }
          };
          au(res2, {
            refs: /* @__PURE__ */ new Map(),
            plugins,
            onParse(value) {
              callbacks.onParse(value);
            },
            onDone() {
              callbacks.onDone();
            },
            onError: (error) => {
              callbacks.onError(error);
            }
          });
          if (done && rawStreams.size === 0) {
            return new Response(
              nonStreamingBody ? JSON.stringify(nonStreamingBody) : void 0,
              {
                status: alsResponse.status,
                statusText: alsResponse.statusText,
                headers: {
                  "Content-Type": "application/json",
                  [X_TSS_SERIALIZED]: "true"
                }
              }
            );
          }
          if (rawStreams.size > 0) {
            const jsonStream = new ReadableStream({
              start(controller) {
                callbacks.onParse = (value) => {
                  controller.enqueue(JSON.stringify(value) + "\n");
                };
                callbacks.onDone = () => {
                  try {
                    controller.close();
                  } catch {
                  }
                };
                callbacks.onError = (error) => controller.error(error);
                if (nonStreamingBody !== void 0) {
                  callbacks.onParse(nonStreamingBody);
                }
              }
            });
            const multiplexedStream = createMultiplexedStream(
              jsonStream,
              rawStreams
            );
            return new Response(multiplexedStream, {
              status: alsResponse.status,
              statusText: alsResponse.statusText,
              headers: {
                "Content-Type": TSS_CONTENT_TYPE_FRAMED_VERSIONED,
                [X_TSS_SERIALIZED]: "true"
              }
            });
          }
          const stream = new ReadableStream({
            start(controller) {
              callbacks.onParse = (value) => controller.enqueue(
                textEncoder.encode(JSON.stringify(value) + "\n")
              );
              callbacks.onDone = () => {
                try {
                  controller.close();
                } catch (error) {
                  controller.error(error);
                }
              };
              callbacks.onError = (error) => controller.error(error);
              if (nonStreamingBody !== void 0) {
                callbacks.onParse(nonStreamingBody);
              }
            }
          });
          return new Response(stream, {
            status: alsResponse.status,
            statusText: alsResponse.statusText,
            headers: {
              "Content-Type": "application/x-ndjson",
              [X_TSS_SERIALIZED]: "true"
            }
          });
        }
        return new Response(void 0, {
          status: alsResponse.status,
          statusText: alsResponse.statusText
        });
      };
      let res = await (async () => {
        if (FORM_DATA_CONTENT_TYPES.some(
          (type) => contentType && contentType.includes(type)
        )) {
          invariant(
            methodUpper !== "GET",
            "GET requests with FormData payloads are not supported"
          );
          const formData = await request.formData();
          const serializedContext = formData.get(TSS_FORMDATA_CONTEXT);
          formData.delete(TSS_FORMDATA_CONTEXT);
          const params = {
            context,
            data: formData,
            method: methodUpper
          };
          if (typeof serializedContext === "string") {
            try {
              const parsedContext = JSON.parse(serializedContext);
              const deserializedContext = Iu(parsedContext, {
                plugins: serovalPlugins
              });
              if (typeof deserializedContext === "object" && deserializedContext) {
                params.context = safeObjectMerge(
                  context,
                  deserializedContext
                );
              }
            } catch (e) {
              if (false) ;
            }
          }
          return await action(params);
        }
        if (methodUpper === "GET") {
          const payloadParam = url.searchParams.get("payload");
          if (payloadParam && payloadParam.length > MAX_PAYLOAD_SIZE) {
            throw new Error("Payload too large");
          }
          const payload2 = payloadParam ? parsePayload(JSON.parse(payloadParam)) : {};
          payload2.context = safeObjectMerge(context, payload2.context);
          payload2.method = methodUpper;
          return await action(payload2);
        }
        let jsonPayload;
        if (contentType?.includes("application/json")) {
          jsonPayload = await request.json();
        }
        const payload = jsonPayload ? parsePayload(jsonPayload) : {};
        payload.context = safeObjectMerge(payload.context, context);
        payload.method = methodUpper;
        return await action(payload);
      })();
      const unwrapped = res.result || res.error;
      if (isNotFound(res)) {
        res = isNotFoundResponse(res);
      }
      if (!isServerFn) {
        return unwrapped;
      }
      if (unwrapped instanceof Response) {
        if (isRedirect(unwrapped)) {
          return unwrapped;
        }
        unwrapped.headers.set(X_TSS_RAW_RESPONSE, "true");
        return unwrapped;
      }
      return serializeResult(res);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      if (isNotFound(error)) {
        return isNotFoundResponse(error);
      }
      console.info();
      console.info("Server Fn Error!");
      console.info();
      console.error(error);
      console.info();
      const serializedError = JSON.stringify(
        await Promise.resolve(
          ou(error, {
            refs: /* @__PURE__ */ new Map(),
            plugins: serovalPlugins
          })
        )
      );
      const response2 = getResponse();
      return new Response(serializedError, {
        status: response2.status ?? 500,
        statusText: response2.statusText,
        headers: {
          "Content-Type": "application/json",
          [X_TSS_SERIALIZED]: "true"
        }
      });
    }
  })();
  return response;
};
function isNotFoundResponse(error) {
  const { headers, ...rest } = error;
  return new Response(JSON.stringify(rest), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      ...headers || {}
    }
  });
}
function resolveTransformConfig(transform) {
  if (typeof transform === "string") {
    const prefix = transform;
    return {
      type: "transform",
      transformFn: ({ url }) => `${prefix}${url}`,
      cache: true
    };
  }
  if (typeof transform === "function") {
    return {
      type: "transform",
      transformFn: transform,
      cache: true
    };
  }
  if ("createTransform" in transform && transform.createTransform) {
    return {
      type: "createTransform",
      createTransform: transform.createTransform,
      cache: transform.cache !== false
    };
  }
  const transformFn = typeof transform.transform === "string" ? (({ url }) => `${transform.transform}${url}`) : transform.transform;
  return {
    type: "transform",
    transformFn,
    cache: transform.cache !== false
  };
}
function buildClientEntryScriptTag(clientEntry, injectedHeadScripts) {
  const clientEntryLiteral = JSON.stringify(clientEntry);
  let script = `import(${clientEntryLiteral})`;
  if (injectedHeadScripts) {
    script = `${injectedHeadScripts};${script}`;
  }
  return {
    tag: "script",
    attrs: {
      type: "module",
      async: true
    },
    children: script
  };
}
function transformManifestUrls(source, transformFn, opts) {
  return (async () => {
    const manifest2 = opts?.clone ? structuredClone(source.manifest) : source.manifest;
    for (const route of Object.values(manifest2.routes)) {
      if (route.preloads) {
        route.preloads = await Promise.all(
          route.preloads.map(
            (url) => Promise.resolve(transformFn({ url, type: "modulepreload" }))
          )
        );
      }
      if (route.assets) {
        for (const asset of route.assets) {
          if (asset.tag === "link" && asset.attrs?.href) {
            asset.attrs.href = await Promise.resolve(
              transformFn({
                url: asset.attrs.href,
                type: "stylesheet"
              })
            );
          }
        }
      }
    }
    const transformedClientEntry = await Promise.resolve(
      transformFn({
        url: source.clientEntry,
        type: "clientEntry"
      })
    );
    const rootRoute = manifest2.routes[rootRouteId];
    if (rootRoute) {
      rootRoute.assets = rootRoute.assets || [];
      rootRoute.assets.push(
        buildClientEntryScriptTag(
          transformedClientEntry,
          source.injectedHeadScripts
        )
      );
    }
    return manifest2;
  })();
}
function buildManifestWithClientEntry(source) {
  const scriptTag = buildClientEntryScriptTag(
    source.clientEntry,
    source.injectedHeadScripts
  );
  const baseRootRoute = source.manifest.routes[rootRouteId];
  const routes = {
    ...source.manifest.routes,
    ...baseRootRoute ? {
      [rootRouteId]: {
        ...baseRootRoute,
        assets: [...baseRootRoute.assets || [], scriptTag]
      }
    } : {}
  };
  return { routes };
}
const HEADERS = {
  TSS_SHELL: "X-TSS_SHELL"
};
const ServerFunctionSerializationAdapter = createSerializationAdapter({
  key: "$TSS/serverfn",
  test: (v) => {
    if (typeof v !== "function") return false;
    if (!(TSS_SERVER_FUNCTION in v)) return false;
    return !!v[TSS_SERVER_FUNCTION];
  },
  toSerializable: ({ serverFnMeta }) => ({ functionId: serverFnMeta.id }),
  fromSerializable: ({ functionId }) => {
    const fn = async (opts, signal) => {
      const serverFn = await getServerFnById(functionId);
      const result = await serverFn(opts ?? {}, signal);
      return result.result;
    };
    return fn;
  }
});
function getStartResponseHeaders(opts) {
  const headers = mergeHeaders(
    {
      "Content-Type": "text/html; charset=utf-8"
    },
    ...opts.router.state.matches.map((match) => {
      return match.headers;
    })
  );
  return headers;
}
let entriesPromise;
let baseManifestPromise;
let cachedFinalManifestPromise;
async function loadEntries() {
  const routerEntry = await import("./router-_jeUSzJ6.mjs").then((n) => n.r);
  const startEntry = await import("./start-HYkvq4Ni.mjs");
  return { startEntry, routerEntry };
}
function getEntries() {
  if (!entriesPromise) {
    entriesPromise = loadEntries();
  }
  return entriesPromise;
}
function getBaseManifest(matchedRoutes) {
  if (!baseManifestPromise) {
    baseManifestPromise = getStartManifest();
  }
  return baseManifestPromise;
}
async function resolveManifest(matchedRoutes, transformFn, cache) {
  const base = await getBaseManifest();
  const computeFinalManifest = async () => {
    return transformFn ? await transformManifestUrls(base, transformFn, { clone: !cache }) : buildManifestWithClientEntry(base);
  };
  if (!transformFn || cache) {
    if (!cachedFinalManifestPromise) {
      cachedFinalManifestPromise = computeFinalManifest();
    }
    return cachedFinalManifestPromise;
  }
  return computeFinalManifest();
}
const ROUTER_BASEPATH = "/";
const SERVER_FN_BASE = "/_serverFn/";
const IS_PRERENDERING = process.env.TSS_PRERENDERING === "true";
const IS_SHELL_ENV = process.env.TSS_SHELL === "true";
const ERR_NO_RESPONSE = "Internal Server Error";
const ERR_NO_DEFER = "Internal Server Error";
function throwRouteHandlerError() {
  throw new Error(ERR_NO_RESPONSE);
}
function throwIfMayNotDefer() {
  throw new Error(ERR_NO_DEFER);
}
function isSpecialResponse(value) {
  return value instanceof Response || isRedirect(value);
}
function handleCtxResult(result) {
  if (isSpecialResponse(result)) {
    return { response: result };
  }
  return result;
}
function executeMiddleware(middlewares, ctx) {
  let index = -1;
  const next = async (nextCtx) => {
    if (nextCtx) {
      if (nextCtx.context) {
        ctx.context = safeObjectMerge(ctx.context, nextCtx.context);
      }
      for (const key of Object.keys(nextCtx)) {
        if (key !== "context") {
          ctx[key] = nextCtx[key];
        }
      }
    }
    index++;
    const middleware = middlewares[index];
    if (!middleware) return ctx;
    let result;
    try {
      result = await middleware({ ...ctx, next });
    } catch (err) {
      if (isSpecialResponse(err)) {
        ctx.response = err;
        return ctx;
      }
      throw err;
    }
    const normalized = handleCtxResult(result);
    if (normalized) {
      if (normalized.response !== void 0) {
        ctx.response = normalized.response;
      }
      if (normalized.context) {
        ctx.context = safeObjectMerge(ctx.context, normalized.context);
      }
    }
    return ctx;
  };
  return next();
}
function handlerToMiddleware(handler, mayDefer = false) {
  if (mayDefer) {
    return handler;
  }
  return async (ctx) => {
    const response = await handler({ ...ctx, next: throwIfMayNotDefer });
    if (!response) {
      throwRouteHandlerError();
    }
    return response;
  };
}
function createStartHandler(cbOrOptions) {
  const cb = typeof cbOrOptions === "function" ? cbOrOptions : cbOrOptions.handler;
  const transformAssetUrlsOption = typeof cbOrOptions === "function" ? void 0 : cbOrOptions.transformAssetUrls;
  const warmupTransformManifest = !!transformAssetUrlsOption && typeof transformAssetUrlsOption === "object" && transformAssetUrlsOption.warmup === true;
  const resolvedTransformConfig = transformAssetUrlsOption ? resolveTransformConfig(transformAssetUrlsOption) : void 0;
  const cache = resolvedTransformConfig ? resolvedTransformConfig.cache : true;
  let cachedCreateTransformPromise;
  const getTransformFn = async (opts) => {
    if (!resolvedTransformConfig) return void 0;
    if (resolvedTransformConfig.type === "createTransform") {
      if (cache) {
        if (!cachedCreateTransformPromise) {
          cachedCreateTransformPromise = Promise.resolve(
            resolvedTransformConfig.createTransform(opts)
          );
        }
        return cachedCreateTransformPromise;
      }
      return resolvedTransformConfig.createTransform(opts);
    }
    return resolvedTransformConfig.transformFn;
  };
  if (warmupTransformManifest && cache && true && !cachedFinalManifestPromise) {
    const warmupPromise = (async () => {
      const base = await getBaseManifest();
      const transformFn = await getTransformFn({ warmup: true });
      return transformFn ? await transformManifestUrls(base, transformFn, { clone: false }) : buildManifestWithClientEntry(base);
    })();
    cachedFinalManifestPromise = warmupPromise;
    warmupPromise.catch(() => {
      if (cachedFinalManifestPromise === warmupPromise) {
        cachedFinalManifestPromise = void 0;
      }
      cachedCreateTransformPromise = void 0;
    });
  }
  const startRequestResolver = async (request, requestOpts) => {
    let router = null;
    let cbWillCleanup = false;
    try {
      const { url, handledProtocolRelativeURL } = getNormalizedURL(request.url);
      const href = url.pathname + url.search + url.hash;
      const origin = getOrigin(request);
      if (handledProtocolRelativeURL) {
        return Response.redirect(url, 308);
      }
      const entries = await getEntries();
      const startOptions = await entries.startEntry.startInstance?.getOptions() || {};
      const serializationAdapters = [
        ...startOptions.serializationAdapters || [],
        ServerFunctionSerializationAdapter
      ];
      const requestStartOptions = {
        ...startOptions,
        serializationAdapters
      };
      const flattenedRequestMiddlewares = startOptions.requestMiddleware ? flattenMiddlewares(startOptions.requestMiddleware) : [];
      const executedRequestMiddlewares = new Set(
        flattenedRequestMiddlewares
      );
      const getRouter = async () => {
        if (router) return router;
        router = await entries.routerEntry.getRouter();
        let isShell = IS_SHELL_ENV;
        if (IS_PRERENDERING && !isShell) {
          isShell = request.headers.get(HEADERS.TSS_SHELL) === "true";
        }
        const history = createMemoryHistory({
          initialEntries: [href]
        });
        router.update({
          history,
          isShell,
          isPrerendering: IS_PRERENDERING,
          origin: router.options.origin ?? origin,
          ...{
            defaultSsr: requestStartOptions.defaultSsr,
            serializationAdapters: [
              ...requestStartOptions.serializationAdapters,
              ...router.options.serializationAdapters || []
            ]
          },
          basepath: ROUTER_BASEPATH
        });
        return router;
      };
      if (SERVER_FN_BASE && url.pathname.startsWith(SERVER_FN_BASE)) {
        const serverFnId = url.pathname.slice(SERVER_FN_BASE.length).split("/")[0];
        if (!serverFnId) {
          throw new Error("Invalid server action param for serverFnId");
        }
        const serverFnHandler = async ({ context }) => {
          return runWithStartContext(
            {
              getRouter,
              startOptions: requestStartOptions,
              contextAfterGlobalMiddlewares: context,
              request,
              executedRequestMiddlewares
            },
            () => handleServerAction({
              request,
              context: requestOpts?.context,
              serverFnId
            })
          );
        };
        const middlewares2 = flattenedRequestMiddlewares.map(
          (d) => d.options.server
        );
        const ctx2 = await executeMiddleware([...middlewares2, serverFnHandler], {
          request,
          pathname: url.pathname,
          context: createNullProtoObject(requestOpts?.context)
        });
        return handleRedirectResponse(ctx2.response, request, getRouter);
      }
      const executeRouter = async (serverContext, matchedRoutes) => {
        const acceptHeader = request.headers.get("Accept") || "*/*";
        const acceptParts = acceptHeader.split(",");
        const supportedMimeTypes = ["*/*", "text/html"];
        const isSupported = supportedMimeTypes.some(
          (mimeType) => acceptParts.some((part) => part.trim().startsWith(mimeType))
        );
        if (!isSupported) {
          return Response.json(
            { error: "Only HTML requests are supported here" },
            { status: 500 }
          );
        }
        const manifest2 = await resolveManifest(
          matchedRoutes,
          await getTransformFn({ warmup: false, request }),
          cache
        );
        const routerInstance = await getRouter();
        attachRouterServerSsrUtils({
          router: routerInstance,
          manifest: manifest2
        });
        routerInstance.update({ additionalContext: { serverContext } });
        await routerInstance.load();
        if (routerInstance.state.redirect) {
          return routerInstance.state.redirect;
        }
        await routerInstance.serverSsr.dehydrate();
        const responseHeaders = getStartResponseHeaders({
          router: routerInstance
        });
        cbWillCleanup = true;
        return cb({
          request,
          router: routerInstance,
          responseHeaders
        });
      };
      const requestHandlerMiddleware = async ({ context }) => {
        return runWithStartContext(
          {
            getRouter,
            startOptions: requestStartOptions,
            contextAfterGlobalMiddlewares: context,
            request,
            executedRequestMiddlewares
          },
          async () => {
            try {
              return await handleServerRoutes({
                getRouter,
                request,
                url,
                executeRouter,
                context,
                executedRequestMiddlewares
              });
            } catch (err) {
              if (err instanceof Response) {
                return err;
              }
              throw err;
            }
          }
        );
      };
      const middlewares = flattenedRequestMiddlewares.map(
        (d) => d.options.server
      );
      const ctx = await executeMiddleware(
        [...middlewares, requestHandlerMiddleware],
        {
          request,
          pathname: url.pathname,
          context: createNullProtoObject(requestOpts?.context)
        }
      );
      return handleRedirectResponse(ctx.response, request, getRouter);
    } finally {
      if (router && !cbWillCleanup) {
        router.serverSsr?.cleanup();
      }
      router = null;
    }
  };
  return requestHandler(startRequestResolver);
}
async function handleRedirectResponse(response, request, getRouter) {
  if (!isRedirect(response)) {
    return response;
  }
  if (isResolvedRedirect(response)) {
    if (request.headers.get("x-tsr-serverFn") === "true") {
      return Response.json(
        { ...response.options, isSerializedRedirect: true },
        { headers: response.headers }
      );
    }
    return response;
  }
  const opts = response.options;
  if (opts.to && typeof opts.to === "string" && !opts.to.startsWith("/")) {
    throw new Error(
      `Server side redirects must use absolute paths via the 'href' or 'to' options. The redirect() method's "to" property accepts an internal path only. Use the "href" property to provide an external URL. Received: ${JSON.stringify(opts)}`
    );
  }
  if (["params", "search", "hash"].some(
    (d) => typeof opts[d] === "function"
  )) {
    throw new Error(
      `Server side redirects must use static search, params, and hash values and do not support functional values. Received functional values for: ${Object.keys(
        opts
      ).filter((d) => typeof opts[d] === "function").map((d) => `"${d}"`).join(", ")}`
    );
  }
  const router = await getRouter();
  const redirect = router.resolveRedirect(response);
  if (request.headers.get("x-tsr-serverFn") === "true") {
    return Response.json(
      { ...response.options, isSerializedRedirect: true },
      { headers: response.headers }
    );
  }
  return redirect;
}
async function handleServerRoutes({
  getRouter,
  request,
  url,
  executeRouter,
  context,
  executedRequestMiddlewares
}) {
  const router = await getRouter();
  const rewrittenUrl = executeRewriteInput(router.rewrite, url);
  const pathname = rewrittenUrl.pathname;
  const { matchedRoutes, foundRoute, routeParams } = router.getMatchedRoutes(pathname);
  const isExactMatch = foundRoute && routeParams["**"] === void 0;
  const routeMiddlewares = [];
  for (const route of matchedRoutes) {
    const serverMiddleware = route.options.server?.middleware;
    if (serverMiddleware) {
      const flattened = flattenMiddlewares(serverMiddleware);
      for (const m of flattened) {
        if (!executedRequestMiddlewares.has(m)) {
          routeMiddlewares.push(m.options.server);
        }
      }
    }
  }
  const server2 = foundRoute?.options.server;
  if (server2?.handlers && isExactMatch) {
    const handlers = typeof server2.handlers === "function" ? server2.handlers({ createHandlers: (d) => d }) : server2.handlers;
    const requestMethod = request.method.toUpperCase();
    const handler = handlers[requestMethod] ?? handlers["ANY"];
    if (handler) {
      const mayDefer = !!foundRoute.options.component;
      if (typeof handler === "function") {
        routeMiddlewares.push(handlerToMiddleware(handler, mayDefer));
      } else {
        if (handler.middleware?.length) {
          const handlerMiddlewares = flattenMiddlewares(handler.middleware);
          for (const m of handlerMiddlewares) {
            routeMiddlewares.push(m.options.server);
          }
        }
        if (handler.handler) {
          routeMiddlewares.push(handlerToMiddleware(handler.handler, mayDefer));
        }
      }
    }
  }
  routeMiddlewares.push(
    (ctx2) => executeRouter(ctx2.context, matchedRoutes)
  );
  const ctx = await executeMiddleware(routeMiddlewares, {
    request,
    context,
    params: routeParams,
    pathname
  });
  return ctx.response;
}
const fetch = createStartHandler(defaultStreamHandler);
function createServerEntry(entry) {
  return {
    async fetch(...args) {
      return await entry.fetch(...args);
    }
  };
}
const server = createServerEntry({ fetch });
export {
  TSS_SERVER_FUNCTION as T,
  getCookie as a,
  createServerFn as c,
  createServerEntry,
  deleteCookie as d,
  server as default,
  getServerFnById as g,
  setCookie as s
};
