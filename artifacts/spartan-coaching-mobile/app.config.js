const appJson = require('./app.json');

const base = appJson.expo;

module.exports = {
  expo: {
    ...base,
    ...(process.env.EXPO_ACCOUNT_SLUG
      ? { owner: process.env.EXPO_ACCOUNT_SLUG }
      : {}),
    extra: {
      ...base.extra,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || undefined,
      },
    },
  },
};
