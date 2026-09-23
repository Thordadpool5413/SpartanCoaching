/**
 * `executionEnvironment === "storeClient"` also includes Expo development
 * clients. Combine it with the Expo Go ownership marker so installed
 * development and TestFlight builds keep access to native StoreKit.
 */
export function isExpoGoRuntime(
  executionEnvironment: string | null | undefined,
  appOwnership: string | null | undefined,
): boolean {
  return executionEnvironment === "storeClient" && appOwnership === "expo";
}
