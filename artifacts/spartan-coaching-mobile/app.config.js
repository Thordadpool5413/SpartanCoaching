const appJson = require('./app.json');

const base = appJson.expo;

module.exports = {
  expo: {
    ...base,
    extra: {
      ...base.extra,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || base.extra?.eas?.projectId,
      },
    },
  },
};
