import { b as booleanSelector, S as SelectorType } from "../@smithy/util-config-provider.mjs";
const NODE_USE_ARN_REGION_ENV_NAME = "AWS_S3_USE_ARN_REGION";
const NODE_USE_ARN_REGION_INI_NAME = "s3_use_arn_region";
const NODE_USE_ARN_REGION_CONFIG_OPTIONS = {
  environmentVariableSelector: (env) => booleanSelector(env, NODE_USE_ARN_REGION_ENV_NAME, SelectorType.ENV),
  configFileSelector: (profile) => booleanSelector(profile, NODE_USE_ARN_REGION_INI_NAME, SelectorType.CONFIG),
  default: void 0
};
export {
  NODE_USE_ARN_REGION_CONFIG_OPTIONS as N
};
