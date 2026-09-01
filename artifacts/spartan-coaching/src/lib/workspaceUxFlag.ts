const workspaceUxSetting = String(
  import.meta.env.VITE_UX_WORKSPACE_IMPROVEMENTS ?? "true",
).toLowerCase();

// The repaired workspace is the default. Operations can still roll it back
// immediately with VITE_UX_WORKSPACE_IMPROVEMENTS=false.
export const UX_WORKSPACE_IMPROVEMENTS = workspaceUxSetting !== "false";
