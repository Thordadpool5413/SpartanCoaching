const workspaceUxSetting = String(
  process.env.EXPO_PUBLIC_UX_WORKSPACE_IMPROVEMENTS ?? "true",
).toLowerCase();

export const UX_WORKSPACE_IMPROVEMENTS = workspaceUxSetting !== "false";
