export type SpartanAccess = "visitor" | "standard" | "elite" | "company" | "admin";

export type SpartanOffering = {
  id: string;
  title: string;
  promise: string;
  route: string;
  access: SpartanAccess[];
  capabilities: string[];
  offline: string;
  privacy?: string;
};

export const SPARTAN_OFFERINGS: SpartanOffering[] = [
  {
    id: "home",
    title: "Home",
    promise: "Know the next useful move without turning your day into a CRM dashboard.",
    route: "/(tabs)",
    access: ["visitor", "standard", "elite", "company", "admin"],
    capabilities: [
      "Guided first experience",
      "Conversation preparation",
      "Commitment continuity",
      "Clear membership and access state",
    ],
    offline: "Selected planning and the latest private commitment remain available on this iPhone.",
  },
  {
    id: "coach",
    title: "Spartan Coach",
    promise: "Prepare, rehearse, receive direct feedback, and leave with one clear commitment.",
    route: "/(tabs)/coach",
    access: ["visitor", "elite", "company", "admin"],
    capabilities: [
      "Private coaching conversations",
      "Voice rehearsal and transcription",
      "Optional editable memory",
      "Commitments and follow through",
    ],
    offline: "Coach, transcription, memory sync, and new AI feedback require a secure connection.",
    privacy: "Raw Coach conversations are private, are never visible to an organization admin, and are hard deleted after 90 days.",
  },
  {
    id: "tools",
    title: "Tools",
    promise: "Use purpose built field tools for preparation, practice, outreach, planning, research, and measurement.",
    route: "/(tabs)/tools",
    access: ["visitor", "standard", "elite", "company", "admin"],
    capabilities: [
      "Sales workflow and playbooks",
      "Objection and role play practice",
      "Outreach and weekly planning",
      "Research and business calculators",
    ],
    offline: "Approved nonclinical outputs and selected planning can be saved for offline reference.",
  },
  {
    id: "library",
    title: "Library",
    promise: "Read, listen, practice the Spartan Method, and keep approved resources close to the field.",
    route: "/(tabs)/learn",
    access: ["visitor", "standard", "elite", "company", "admin"],
    capabilities: [
      "Native field notes",
      "Audio briefings",
      "Method, drills, quiz, and manifesto",
      "Downloaded and organization resources",
    ],
    offline: "Downloaded Library items and approved nonclinical resources remain available offline.",
  },
  {
    id: "consulting",
    title: "Consulting",
    promise: "Request contracted human advisory support without confusing it with the Apple subscription.",
    route: "/(tabs)/contact",
    access: ["visitor", "standard", "elite", "company", "admin"],
    capabilities: [
      "View consulting options",
      "Request a meeting",
      "Provide intake context",
      "Receive an in app confirmation",
    ],
    offline: "Scheduling and intake submission require a secure connection.",
  },
  {
    id: "account",
    title: "Account",
    promise: "Control membership, privacy, appearance, role, saved information, and support from one place.",
    route: "/(tabs)/account",
    access: ["visitor", "standard", "elite", "company", "admin"],
    capabilities: [
      "Membership and purchase state",
      "System, Light, and Dark appearance",
      "Privacy and personal data controls",
      "Role, territory, and jurisdiction preferences",
    ],
    offline: "Local preferences remain visible offline. Billing, account changes, and secure sharing require a connection.",
  },
  {
    id: "admin",
    title: "Organization Admin",
    promise: "Manage contracted seats and adoption without exposing private member coaching content.",
    route: "/admin",
    access: ["admin"],
    capabilities: [
      "Seat and invitation management",
      "Member and manager roles",
      "Usage counts and trends",
      "Explicitly shared summaries and commitments only",
    ],
    offline: "Administration requires a secure connection.",
    privacy: "Admins never receive raw Coach prompts, drafts, recordings, transcripts, or unshared outputs.",
  },
];

export const MEMBERSHIP_ACCESS = {
  standard: {
    title: "Standard",
    priceFallback: "$14.99 / week",
    summary: "The complete field system for preparation, practice, planning, outreach, measurement, Library, and saved work.",
    includes: ["home", "tools", "library", "consulting", "account"],
  },
  elite: {
    title: "Elite",
    priceFallback: "$19.99 / week",
    summary: "Everything in Standard plus private Spartan Coach, voice rehearsal, optional memory, advanced AI, and deidentified clinical education tools.",
    includes: ["home", "coach", "tools", "library", "consulting", "account"],
  },
} as const;

export function offeringById(id: string) {
  return SPARTAN_OFFERINGS.find((offering) => offering.id === id);
}
