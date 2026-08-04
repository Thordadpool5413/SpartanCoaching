/**
 * Native satellite tool routes under /tool/[tab].
 * Priority order: practice → prepare → plan.
 */
export type ToolTab =
  | "objection"
  | "playbook"
  | "email"
  | "roleplay"
  | "research"
  | "weekly"
  | "cold";

export const VALID_TABS = new Set<ToolTab>([
  "objection",
  "playbook",
  "email",
  "roleplay",
  "research",
  "weekly",
  "cold",
]);

export const TOOL_TABS: {
  key: ToolTab;
  label: string;
  icon: "shield" | "book-open" | "mail" | "users" | "search" | "calendar" | "phone";
}[] = [
  { key: "objection", label: "Objections", icon: "shield" },
  { key: "playbook", label: "Playbooks", icon: "book-open" },
  { key: "email", label: "Email", icon: "mail" },
  { key: "roleplay", label: "Role-Play", icon: "users" },
  { key: "research", label: "Research", icon: "search" },
  { key: "weekly", label: "Weekly", icon: "calendar" },
  { key: "cold", label: "Cold Call", icon: "phone" },
];
