const stage = process.env.stage;
const resourcePrefix = process.env.resourcePrefix;

const adminPhoneNumber = "+14151234567";

// Sample - stage specific configuration.
const stageConfigs = {
  dev: {
    stripeKeyName: "/stripeSecretKey/test"
  },
  prod: {
    stripeKeyName: "/stripeSecretKey/live"
  }
};

// Default stage configuration - dev is used as default here.
const config = stageConfigs[stage] || stageConfigs.dev;

export default {
  stage,
  resourcePrefix,
  adminPhoneNumber,
  ...config
};
