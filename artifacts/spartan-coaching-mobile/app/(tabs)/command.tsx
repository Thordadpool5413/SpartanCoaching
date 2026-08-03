import React from "react";
import { Redirect } from "expo-router";

/**
 * Command tab → Sales Command Center (matches web membership daily spine).
 */
export default function CommandTab() {
  return <Redirect href="/sales-workflow" />;
}
