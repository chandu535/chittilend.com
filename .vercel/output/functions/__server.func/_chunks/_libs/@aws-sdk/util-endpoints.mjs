import { i as isValidHostLabel, a as isIpAddress, c as customEndpointFunctions } from "../@smithy/util-endpoints.mjs";
const isVirtualHostableS3Bucket = (value, allowSubDomains = false) => {
  if (allowSubDomains) {
    for (const label of value.split(".")) {
      if (!isVirtualHostableS3Bucket(label)) {
        return false;
      }
    }
    return true;
  }
  if (!isValidHostLabel(value)) {
    return false;
  }
  if (value.length < 3 || value.length > 63) {
    return false;
  }
  if (value !== value.toLowerCase()) {
    return false;
  }
  if (isIpAddress(value)) {
    return false;
  }
  return true;
};
const ARN_DELIMITER = ":";
const RESOURCE_DELIMITER = "/";
const parseArn = (value) => {
  const segments = value.split(ARN_DELIMITER);
  if (segments.length < 6)
    return null;
  const [arn, partition2, service, region, accountId, ...resourcePath] = segments;
  if (arn !== "arn" || partition2 === "" || service === "" || resourcePath.join(ARN_DELIMITER) === "")
    return null;
  const resourceId = resourcePath.map((resource) => resource.split(RESOURCE_DELIMITER)).flat();
  return {
    partition: partition2,
    service,
    region,
    accountId,
    resourceId
  };
};
const partitions = [{ "id": "aws", "outputs": { "dnsSuffix": "amazonaws.com", "dualStackDnsSuffix": "api.aws", "implicitGlobalRegion": "us-east-1", "name": "aws", "supportsDualStack": true, "supportsFIPS": true }, "regionRegex": "^(us|eu|ap|sa|ca|me|af|il|mx)\\-\\w+\\-\\d+$", "regions": { "af-south-1": { "description": "Africa (Cape Town)" }, "ap-east-1": { "description": "Asia Pacific (Hong Kong)" }, "ap-east-2": { "description": "Asia Pacific (Taipei)" }, "ap-northeast-1": { "description": "Asia Pacific (Tokyo)" }, "ap-northeast-2": { "description": "Asia Pacific (Seoul)" }, "ap-northeast-3": { "description": "Asia Pacific (Osaka)" }, "ap-south-1": { "description": "Asia Pacific (Mumbai)" }, "ap-south-2": { "description": "Asia Pacific (Hyderabad)" }, "ap-southeast-1": { "description": "Asia Pacific (Singapore)" }, "ap-southeast-2": { "description": "Asia Pacific (Sydney)" }, "ap-southeast-3": { "description": "Asia Pacific (Jakarta)" }, "ap-southeast-4": { "description": "Asia Pacific (Melbourne)" }, "ap-southeast-5": { "description": "Asia Pacific (Malaysia)" }, "ap-southeast-6": { "description": "Asia Pacific (New Zealand)" }, "ap-southeast-7": { "description": "Asia Pacific (Thailand)" }, "aws-global": { "description": "aws global region" }, "ca-central-1": { "description": "Canada (Central)" }, "ca-west-1": { "description": "Canada West (Calgary)" }, "eu-central-1": { "description": "Europe (Frankfurt)" }, "eu-central-2": { "description": "Europe (Zurich)" }, "eu-north-1": { "description": "Europe (Stockholm)" }, "eu-south-1": { "description": "Europe (Milan)" }, "eu-south-2": { "description": "Europe (Spain)" }, "eu-west-1": { "description": "Europe (Ireland)" }, "eu-west-2": { "description": "Europe (London)" }, "eu-west-3": { "description": "Europe (Paris)" }, "il-central-1": { "description": "Israel (Tel Aviv)" }, "me-central-1": { "description": "Middle East (UAE)" }, "me-south-1": { "description": "Middle East (Bahrain)" }, "mx-central-1": { "description": "Mexico (Central)" }, "sa-east-1": { "description": "South America (Sao Paulo)" }, "us-east-1": { "description": "US East (N. Virginia)" }, "us-east-2": { "description": "US East (Ohio)" }, "us-west-1": { "description": "US West (N. California)" }, "us-west-2": { "description": "US West (Oregon)" } } }, { "id": "aws-cn", "outputs": { "dnsSuffix": "amazonaws.com.cn", "dualStackDnsSuffix": "api.amazonwebservices.com.cn", "implicitGlobalRegion": "cn-northwest-1", "name": "aws-cn", "supportsDualStack": true, "supportsFIPS": true }, "regionRegex": "^cn\\-\\w+\\-\\d+$", "regions": { "aws-cn-global": { "description": "aws-cn global region" }, "cn-north-1": { "description": "China (Beijing)" }, "cn-northwest-1": { "description": "China (Ningxia)" } } }, { "id": "aws-eusc", "outputs": { "dnsSuffix": "amazonaws.eu", "dualStackDnsSuffix": "api.amazonwebservices.eu", "implicitGlobalRegion": "eusc-de-east-1", "name": "aws-eusc", "supportsDualStack": true, "supportsFIPS": true }, "regionRegex": "^eusc\\-(de)\\-\\w+\\-\\d+$", "regions": { "eusc-de-east-1": { "description": "AWS European Sovereign Cloud (Germany)" } } }, { "id": "aws-iso", "outputs": { "dnsSuffix": "c2s.ic.gov", "dualStackDnsSuffix": "api.aws.ic.gov", "implicitGlobalRegion": "us-iso-east-1", "name": "aws-iso", "supportsDualStack": true, "supportsFIPS": true }, "regionRegex": "^us\\-iso\\-\\w+\\-\\d+$", "regions": { "aws-iso-global": { "description": "aws-iso global region" }, "us-iso-east-1": { "description": "US ISO East" }, "us-iso-west-1": { "description": "US ISO WEST" } } }, { "id": "aws-iso-b", "outputs": { "dnsSuffix": "sc2s.sgov.gov", "dualStackDnsSuffix": "api.aws.scloud", "implicitGlobalRegion": "us-isob-east-1", "name": "aws-iso-b", "supportsDualStack": true, "supportsFIPS": true }, "regionRegex": "^us\\-isob\\-\\w+\\-\\d+$", "regions": { "aws-iso-b-global": { "description": "aws-iso-b global region" }, "us-isob-east-1": { "description": "US ISOB East (Ohio)" }, "us-isob-west-1": { "description": "US ISOB West" } } }, { "id": "aws-iso-e", "outputs": { "dnsSuffix": "cloud.adc-e.uk", "dualStackDnsSuffix": "api.cloud-aws.adc-e.uk", "implicitGlobalRegion": "eu-isoe-west-1", "name": "aws-iso-e", "supportsDualStack": true, "supportsFIPS": true }, "regionRegex": "^eu\\-isoe\\-\\w+\\-\\d+$", "regions": { "aws-iso-e-global": { "description": "aws-iso-e global region" }, "eu-isoe-west-1": { "description": "EU ISOE West" } } }, { "id": "aws-iso-f", "outputs": { "dnsSuffix": "csp.hci.ic.gov", "dualStackDnsSuffix": "api.aws.hci.ic.gov", "implicitGlobalRegion": "us-isof-south-1", "name": "aws-iso-f", "supportsDualStack": true, "supportsFIPS": true }, "regionRegex": "^us\\-isof\\-\\w+\\-\\d+$", "regions": { "aws-iso-f-global": { "description": "aws-iso-f global region" }, "us-isof-east-1": { "description": "US ISOF EAST" }, "us-isof-south-1": { "description": "US ISOF SOUTH" } } }, { "id": "aws-us-gov", "outputs": { "dnsSuffix": "amazonaws.com", "dualStackDnsSuffix": "api.aws", "implicitGlobalRegion": "us-gov-west-1", "name": "aws-us-gov", "supportsDualStack": true, "supportsFIPS": true }, "regionRegex": "^us\\-gov\\-\\w+\\-\\d+$", "regions": { "aws-us-gov-global": { "description": "aws-us-gov global region" }, "us-gov-east-1": { "description": "AWS GovCloud (US-East)" }, "us-gov-west-1": { "description": "AWS GovCloud (US-West)" } } }];
const partitionsInfo = {
  partitions
};
let selectedPartitionsInfo = partitionsInfo;
const partition = (value) => {
  const { partitions: partitions2 } = selectedPartitionsInfo;
  for (const partition2 of partitions2) {
    const { regions, outputs } = partition2;
    for (const [region, regionData] of Object.entries(regions)) {
      if (region === value) {
        return {
          ...outputs,
          ...regionData
        };
      }
    }
  }
  for (const partition2 of partitions2) {
    const { regionRegex, outputs } = partition2;
    if (new RegExp(regionRegex).test(value)) {
      return {
        ...outputs
      };
    }
  }
  const DEFAULT_PARTITION = partitions2.find((partition2) => partition2.id === "aws");
  if (!DEFAULT_PARTITION) {
    throw new Error("Provided region was not found in the partition array or regex, and default partition with id 'aws' doesn't exist.");
  }
  return {
    ...DEFAULT_PARTITION.outputs
  };
};
const awsEndpointFunctions = {
  isVirtualHostableS3Bucket,
  parseArn,
  partition
};
customEndpointFunctions.aws = awsEndpointFunctions;
export {
  awsEndpointFunctions as a
};
