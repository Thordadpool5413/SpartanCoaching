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
