import { platform, release } from "node:os";
import { versions, env } from "node:process";
import { readFile } from "node:fs/promises";
import { normalize, sep, join } from "node:path";
import { D as DEFAULT_UA_APP_ID } from "./middleware-user-agent.mjs";
const getRuntimeUserAgentPair = () => {
  const runtimesToCheck = ["deno", "bun", "llrt"];
  for (const runtime of runtimesToCheck) {
    if (versions[runtime]) {
      return [`md/${runtime}`, versions[runtime]];
    }
  }
  return ["md/nodejs", versions.node];
};
const getTypeScriptPackageJsonPath = (dirname = "") => {
  let nodeModulesPath;
  const normalizedPath = normalize(dirname);
  const parts = normalizedPath.split(sep);
  const nodeModulesIndex = parts.indexOf("node_modules");
  if (nodeModulesIndex !== -1) {
    nodeModulesPath = parts.slice(0, nodeModulesIndex).join(sep);
  } else {
    nodeModulesPath = dirname;
  }
  return join(nodeModulesPath, "node_modules", "typescript", "package.json");
};
let tscVersion;
const getTypeScriptUserAgentPair = async () => {
  if (tscVersion === null) {
    return void 0;
  } else if (typeof tscVersion === "string") {
    return ["md/tsc", tscVersion];
  }
  try {
    const packageJson = await readFile(getTypeScriptPackageJsonPath(__dirname), "utf-8");
    const { version } = JSON.parse(packageJson);
    if (typeof version !== "string") {
      tscVersion = null;
      return void 0;
    }
    tscVersion = version;
    return ["md/tsc", tscVersion];
  } catch {
    tscVersion = null;
  }
};
const isCrtAvailable = () => {
  return null;
};
const createDefaultUserAgentProvider = ({ serviceId, clientVersion }) => {
  const runtimeUserAgentPair = getRuntimeUserAgentPair();
  return async (config) => {
    const sections = [
      ["aws-sdk-js", clientVersion],
      ["ua", "2.1"],
      [`os/${platform()}`, release()],
      ["lang/js"],
      runtimeUserAgentPair
    ];
    const typescriptUserAgentPair = await getTypeScriptUserAgentPair();
    if (typescriptUserAgentPair) {
      sections.push(typescriptUserAgentPair);
    }
    const crtAvailable = isCrtAvailable();
    if (crtAvailable) {
      sections.push(crtAvailable);
    }
    if (serviceId) {
      sections.push([`api/${serviceId}`, clientVersion]);
    }
    if (env.AWS_EXECUTION_ENV) {
      sections.push([`exec-env/${env.AWS_EXECUTION_ENV}`]);
    }
    const appId = await config?.userAgentAppId?.();
    const resolvedUserAgent = appId ? [...sections, [`app/${appId}`]] : [...sections];
    return resolvedUserAgent;
  };
};
const UA_APP_ID_ENV_NAME = "AWS_SDK_UA_APP_ID";
const UA_APP_ID_INI_NAME = "sdk_ua_app_id";
const UA_APP_ID_INI_NAME_DEPRECATED = "sdk-ua-app-id";
const NODE_APP_ID_CONFIG_OPTIONS = {
  environmentVariableSelector: (env2) => env2[UA_APP_ID_ENV_NAME],
  configFileSelector: (profile) => profile[UA_APP_ID_INI_NAME] ?? profile[UA_APP_ID_INI_NAME_DEPRECATED],
  default: DEFAULT_UA_APP_ID
};
export {
  NODE_APP_ID_CONFIG_OPTIONS as N,
  createDefaultUserAgentProvider as c
};
