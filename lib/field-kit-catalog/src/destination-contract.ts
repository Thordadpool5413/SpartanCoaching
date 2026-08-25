/**
 * Shared information architecture contract for the Spartan workspace.
 *
 * Keep destination jobs here so web, iPhone, search, and guided tours cannot
 * quietly invent competing meanings for the same place.
 */

export type SpartanDestinationId =
  | "home"
  | "command"
  | "explore"
  | "library"
  | "my-work"
  | "access"
  | "membership";

export type SpartanDestinationContract = {
  id: SpartanDestinationId;
  primaryJob: string;
  permittedCrossLinks: readonly SpartanDestinationId[];
  webPath: string;
  mobilePath: string;
};

export const SPARTAN_DESTINATION_CONTRACTS: readonly SpartanDestinationContract[] = [
  {
    id: "home",
    primaryJob: "Orient the member and recommend the next useful move.",
    permittedCrossLinks: ["command", "explore", "library", "my-work", "access", "membership"],
    webPath: "/portal",
    mobilePath: "/(tabs)",
  },
  {
    id: "command",
    primaryJob: "Drive the current account workflow from preparation through next step.",
    permittedCrossLinks: ["home", "explore", "my-work", "library"],
    webPath: "/tools/sales-workflow",
    mobilePath: "/sales-workflow",
  },
  {
    id: "explore",
    primaryJob: "Find and open interactive field tools by the job to be done.",
    permittedCrossLinks: ["home", "command", "my-work", "access", "membership"],
    webPath: "/tools",
    mobilePath: "/(tabs)/tools",
  },
  {
    id: "library",
    primaryJob: "Read, listen to, and use approved field resources and learning material.",
    permittedCrossLinks: ["home", "explore", "my-work", "access", "membership"],
    webPath: "/resources",
    mobilePath: "/(tabs)/learn",
  },
  {
    id: "my-work",
    primaryJob: "Resume commitments, plans, saved outputs, and downloaded resources.",
    permittedCrossLinks: ["home", "command", "explore", "library", "access"],
    webPath: "/resources/weekly-plan",
    mobilePath: "/(tabs)/my-work",
  },
  {
    id: "access",
    primaryJob: "Explain capabilities, eligibility, offline behavior, and privacy boundaries.",
    permittedCrossLinks: ["home", "explore", "library", "membership"],
    webPath: "/membership",
    mobilePath: "/access",
  },
  {
    id: "membership",
    primaryJob: "Let a member choose, purchase, or manage Standard and Elite membership.",
    permittedCrossLinks: ["home", "access", "explore"],
    webPath: "/membership",
    mobilePath: "/membership",
  },
];

const DESTINATION_IDS = new Set<SpartanDestinationId>(
  SPARTAN_DESTINATION_CONTRACTS.map((destination) => destination.id),
);

export function getDestinationContract(id: SpartanDestinationId) {
  return SPARTAN_DESTINATION_CONTRACTS.find((destination) => destination.id === id);
}

export function validateDestinationContracts(): string[] {
  const errors: string[] = [];
  if (new Set(SPARTAN_DESTINATION_CONTRACTS.map((d) => d.id)).size !== SPARTAN_DESTINATION_CONTRACTS.length) {
    errors.push("destination ids must be unique");
  }
  for (const destination of SPARTAN_DESTINATION_CONTRACTS) {
    if (!destination.primaryJob.trim()) errors.push(`${destination.id} is missing its primary job`);
    if (!destination.webPath.startsWith("/") || !destination.mobilePath.startsWith("/")) {
      errors.push(`${destination.id} must define web and mobile routes`);
    }
    for (const link of destination.permittedCrossLinks) {
      if (!DESTINATION_IDS.has(link)) errors.push(`${destination.id} links to unknown destination ${link}`);
    }
  }
  return errors;
}

export type CatalogDestinationOwner = "command" | "explore" | "library";

export function catalogOwnershipErrors(
  destinations: readonly { id: string; owner?: CatalogDestinationOwner }[],
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const destination of destinations) {
    if (ids.has(destination.id)) errors.push(`duplicate catalog destination ${destination.id}`);
    ids.add(destination.id);
    if (!destination.owner) errors.push(`${destination.id} must name its destination owner`);
    else if (!["command", "explore", "library"].includes(destination.owner)) {
      errors.push(`${destination.id} has an invalid destination owner`);
    }
  }
  return errors;
}