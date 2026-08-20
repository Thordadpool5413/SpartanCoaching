/**
 * React Native 0.81's bundled Jest Text mock calls `requireActual` on a module
 * that uses Flow `component` syntax. Under Jest 29 that default export is
 * undefined, so the upstream mock crashes before rendering any test.
 *
 * Override the affected lazy host exports with stable host components. All
 * other React Native exports continue to come from the Expo preset.
 */
jest.mock("react-native", () => {
  const reactNative = jest.requireActual("react-native");
  for (const componentName of [
    "ActivityIndicator",
    "Text",
    "TextInput",
    "Switch",
  ]) {
    Object.defineProperty(reactNative, componentName, {
      configurable: true,
      enumerable: true,
      value: componentName,
    });
  }
  return reactNative;
});

/** AsyncStorage is a native module — in-memory mock for unit tests. */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

/**
 * Vector icons load font assets asynchronously in React Native. Unit tests do
 * not need that native side effect, and leaving it enabled creates misleading
 * post-render state update warnings even when the screen behavior is correct.
 */
jest.mock("@expo/vector-icons", () => ({
  Feather: "Feather",
}));

process.env.EXPO_PUBLIC_API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://spartanhospicecoaching.com";

jest.mock("react-native-iap", () => ({
  ErrorCode: { UserCancelled: "user-cancelled" },
  getAvailablePurchases: jest.fn().mockResolvedValue([]),
  deepLinkToSubscriptions: jest.fn().mockResolvedValue(undefined),
  useIAP: () => ({
    connected: false,
    subscriptions: [],
    fetchProducts: jest.fn().mockResolvedValue(undefined),
    requestPurchase: jest.fn().mockResolvedValue(undefined),
    finishTransaction: jest.fn().mockResolvedValue(undefined),
  }),
}));
