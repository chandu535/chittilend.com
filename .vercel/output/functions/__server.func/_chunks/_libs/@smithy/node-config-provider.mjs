import { C as CredentialsProviderError, f as fromStatic$1, m as memoize, c as chain } from "./property-provider.mjs";
import { g as getProfileName, l as loadSharedConfigFiles } from "./shared-ini-file-loader.mjs";
function getSelectorName(functionString) {
  try {
    const constants = new Set(Array.from(functionString.match(/([A-Z_]){3,}/g) ?? []));
    constants.delete("CONFIG");
    constants.delete("CONFIG_PREFIX_SEPARATOR");
    constants.delete("ENV");
    return [...constants].join(", ");
  } catch (e) {
    return functionString;
  }
}
const fromEnv = (envVarSelector, options) => async () => {
  try {
    const config = envVarSelector(process.env, options);
    if (config === void 0) {
      throw new Error();
    }
    return config;
  } catch (e) {
    throw new CredentialsProviderError(e.message || `Not found in ENV: ${getSelectorName(envVarSelector.toString())}`, { logger: options?.logger });
  }
};
const fromSharedConfigFiles = (configSelector, { preferredFile = "config", ...init } = {}) => async () => {
  const profile = getProfileName(init);
  const { configFile, credentialsFile } = await loadSharedConfigFiles(init);
  const profileFromCredentials = credentialsFile[profile] || {};
  const profileFromConfig = configFile[profile] || {};
  const mergedProfile = preferredFile === "config" ? { ...profileFromCredentials, ...profileFromConfig } : { ...profileFromConfig, ...profileFromCredentials };
  try {
    const cfgFile = preferredFile === "config" ? configFile : credentialsFile;
    const configValue = configSelector(mergedProfile, cfgFile);
    if (configValue === void 0) {
      throw new Error();
    }
    return configValue;
  } catch (e) {
    throw new CredentialsProviderError(e.message || `Not found in config files w/ profile [${profile}]: ${getSelectorName(configSelector.toString())}`, { logger: init.logger });
  }
};
const isFunction = (func) => typeof func === "function";
const fromStatic = (defaultValue) => isFunction(defaultValue) ? async () => await defaultValue() : fromStatic$1(defaultValue);
const loadConfig = ({ environmentVariableSelector, configFileSelector, default: defaultValue }, configuration = {}) => {
  const { signingName, logger } = configuration;
  const envOptions = { signingName, logger };
  return memoize(chain(fromEnv(environmentVariableSelector, envOptions), fromSharedConfigFiles(configFileSelector, configuration), fromStatic(defaultValue)));
};
export {
  loadConfig as l
};
