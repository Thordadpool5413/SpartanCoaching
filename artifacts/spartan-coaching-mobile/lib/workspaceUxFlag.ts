export const UX_WORKSPACE_IMPROVEMENTS =
  String(
    process.env.EXPO_PUBLIC_UX_WORKSPACE_IMPROVEMENTS ?? "",
  ).toLowerCase() === "true";
