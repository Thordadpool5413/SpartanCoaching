const packagesToTransform = [
  "(jest-)?react-native",
  "@react-native(-community)?",
  "@react-native(\\+|/).*",
  "expo(nent)?(-.*)?",
  "unimodules-.*",
  "@unimodules(\\+|/).*",
  "sentry-expo",
  "native-base",
  "@expo(nent)?(\\+|/).*",
  "@expo-google-fonts(\\+|/).*",
  "react-navigation",
  "@react-navigation(\\+|/).*",
  "react-native-svg",
  "react-native-.*",
];

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.tsx", "**/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.js"],
  transformIgnorePatterns: [
    `node_modules/(?!(\\.pnpm/)?(${packagesToTransform.join("|")})(@|/|$))`,
  ],
};
