import fs from "node:fs";
import path from "node:path";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import { SPARTAN_OFFERINGS } from "../lib/productExperience";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("native product completeness", () => {
  it("does not route a core catalog tool to the website", () => {
    expect(FIELD_KIT_TOOLS.filter((tool) => tool.mobile !== "native")).toEqual([]);
    expect(FIELD_KIT_TOOLS.filter((tool) => !tool.mobileRoute)).toEqual([]);
    expect(fs.existsSync(path.join(root, "app/tool-web.tsx"))).toBe(false);
    expect(read("app/_layout.tsx")).not.toContain('name="tool-web"');
  });

  it("opens Library items and Spartan Method content inside the app", () => {
    const explore = read("app/(tabs)/tools.tsx");
    const library = read("app/(tabs)/learn.tsx");
    const reader = read("app/library-item.tsx");
    const method = read("app/method-guide.tsx");
    expect(library).not.toContain("Linking.openURL");
    expect(library).not.toContain('pathname: "/tool-web"');
    expect(library).toContain('pathname: "/library-item"');
    expect(library).toContain('pathname: "/method-guide"');
    expect(explore).toContain('view === "library"');
    expect(explore).toContain("<LearnScreen />");
    expect(reader).toContain("library-native-reader");
    expect(reader).toContain("NativeArticleReader");
    expect(reader).toContain("NativeResourceReader");
    expect(reader).toContain("SPARTAN_RESOURCE_NOT_FOUND");
    expect(reader).toContain("saveTextLibraryItem");
    expect(reader).toContain("View the original source");
    expect(method).toContain("Discipline. Empathy. Strategy.");
  });

  it("matches the approved Coach landing hierarchy before the workflow begins", () => {
    const coach = read("app/(tabs)/coach.tsx");
    expect(coach).toContain('testID="screen-elite-coach-home"');
    expect(coach).toContain("Practice the conversation before it matters.");
    expect(coach).toContain("What are you preparing for?");
    expect(coach).toContain("Resume a private conversation");
    expect(coach).toContain("Your privacy is protected");
  });

  it("stores complete first party article copy for the native reader", () => {
    const schema = read("../../lib/db/src/schema/schema.ts");
    const migration = read("../../lib/db/migrations/0019_native_article_content.sql");
    const admin = read("../spartan-coaching/src/pages/Admin.tsx");
    expect(schema).toContain('content: text("content")');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS "content" text');
    expect(admin).toContain('data-testid="input-article-content"');
  });

  it("persists optional team leadership context without changing primary role", () => {
    const authSchema = read("../../lib/db/src/schema/auth.ts");
    const migration = read("../../lib/db/migrations/0020_member_leadership_context.sql");
    const mobileAccount = read("app/(tabs)/account.tsx");
    const webPortal = read("../spartan-coaching/src/pages/Portal.tsx");
    expect(authSchema).toContain('alsoLeadsTeam: boolean("also_leads_team")');
    expect(authSchema).toContain("alsoLeadsTeam: z.boolean().optional()");
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS "also_leads_team" boolean');
    expect(mobileAccount).toContain("I also lead a team");
    expect(webPortal).toContain('data-testid="switch-also-leads-team"');
  });

  it("reopens native text downloads without requiring a website URL", () => {
    const downloads = read("lib/libraryDownloads.ts");
    const myWork = read("app/(tabs)/my-work.tsx");
    const reader = read("app/library-item.tsx");
    expect(downloads).toContain("saveTextLibraryItem");
    expect(downloads).toContain("content?: string");
    expect(myWork).toContain("downloadKey: item.sourceUrl");
    expect(reader).toContain("downloaded?.content || article?.content");
  });

  it("keeps offline storage safety free of a runtime require cycle", () => {
    const architecture = read("lib/offlineArchitecture.ts");
    const queue = read("lib/offlineQueue.ts");
    const drafts = read("lib/toolDraftCache.ts");
    expect(architecture).toContain("OFFLINE_STORAGE_BLOCKED_TOOL_IDS");
    expect(queue).toContain('from "@/lib/offlineArchitecture"');
    expect(drafts).toContain('from "@/lib/offlineArchitecture"');
    expect(drafts).not.toContain('from "@/lib/offlineQueue"');
  });

  it("never presents placeholder Library content as a completed resource", () => {
    const library = read("app/(tabs)/learn.tsx");
    const reader = read("app/library-item.tsx");
    expect(library).toContain("Boolean(item.audioUrl)");
    expect(reader).not.toContain("Full article being prepared");
    expect(reader).not.toContain("Attachment coming soon");
    expect(reader).toContain("Take it into the field");
    expect(reader).toContain("Use the resource overview");
  });

  it("does not retain a browser checkout path in the iOS product", () => {
    const api = read("lib/api.ts");
    const ceremony = read("components/ActivationCeremony.tsx");
    expect(api).not.toContain("startIndividualCheckout");
    expect(api).not.toContain("openBillingPortal");
    expect(ceremony).not.toContain("Stripe");
    expect(ceremony).toContain("entitlement transition");
  });

  it("keeps account recovery and administrator work native", () => {
    const login = read("app/login.tsx");
    const admin = read("app/admin.tsx");
    const rootLayout = read("app/_layout.tsx");
    expect(login).toContain('router.push("/forgot-password" as Href)');
    expect(login).not.toContain('openWebsite("/forgot-password")');
    expect(admin).not.toContain("Linking.openURL");
    expect(admin).toContain("Admin visibility has a hard boundary");
    expect(admin).toContain("setOrganizationMemberRole");
    expect(admin).toContain("assignOrganizationMember");
    expect(admin).toContain("offboardOrganizationMember");
    expect(rootLayout).toContain('name="forgot-password"');
    expect(rootLayout).toContain('name="reset-password"');
  });

  it("supports a separate Microsoft Bookings schedule inside the app", () => {
    const consulting = read("app/(tabs)/contact.tsx");
    const schedule = read("app/consulting-schedule.tsx");
    const config = read("lib/consultingBookings.ts");
    expect(config).toContain("EXPO_PUBLIC_MICROSOFT_BOOKINGS_URL");
    expect(consulting).toContain("Choose an exact time");
    expect(schedule).toContain("Microsoft Bookings");
    expect(schedule).toContain("<WebView");
    expect(schedule).toContain("Do not enter patient PHI");
  });

  it("does not route current member actions into the retired Command tab", () => {
    const activation = read("components/ActivationCeremony.tsx");
    const result = read("components/FieldResultPanel.tsx");
    const links = read("lib/deepLinks.ts");

    expect(activation).toContain('router.push("/(tabs)/tools")');
    expect(activation).not.toContain('router.push("/(tabs)/command")');
    expect(result).toContain('router.push("/tool/playbook"');
    expect(result).not.toContain('router.push("/(tabs)/command")');
    expect(links).not.toContain('pathname: "/(tabs)/command"');
  });

  it("makes product scope and purchasing visible before authentication", () => {
    const home = read("components/WelcomeExperience.tsx");
    const membership = read("app/membership.tsx");
    const access = read("app/access.tsx");
    expect(home).toContain("Know what to do next");
    expect(home).toContain("Practice with Spartan Coach");
    expect(home).toContain('actionLabel={signedIn ? undefined : "Sign in"}');
    expect(home).toContain("signedIn ? undefined");
    expect(home).toContain("Compare Standard and Elite");
    expect(membership).toContain("Payment happens through Apple before Spartan account creation");
    expect(membership).toContain("Private Spartan Coach");
    expect(access).toContain("THE COMPLETE APP");
  });

  it("uses the approved five destination navigation and keeps Library native", () => {
    const tabs = read("app/(tabs)/_layout.tsx");
    expect(tabs).toContain('title: "Home"');
    expect(tabs).toContain('title: "Coach"');
    expect(tabs).toContain('title: "Explore"');
    expect(tabs).toContain('title: "My Work"');
    expect(tabs).toContain('title: "Account"');
    expect(tabs).toContain('name="learn" options={{ href: null }}');
    expect(read("app/(tabs)/my-work.tsx")).toContain("Pick up where you left off");
    expect(read("app/(tabs)/learn.tsx")).toContain('placeholder="Search tools and resources"');
    expect(read("app/(tabs)/learn.tsx")).toContain("Boolean(item.audioUrl)");
    expect(read("app/(tabs)/learn.tsx")).toContain("Only complete, playable episodes appear here");
    expect(read("app/(tabs)/learn.tsx")).toContain("LibraryModeIntro");
    expect(read("app/(tabs)/learn.tsx")).toContain("library-mode-");
  });

  it("makes the complete native tool inventory visible instead of relying on featured cards", () => {
    const explore = read("app/(tabs)/tools.tsx");
    expect(explore).toContain('testID="complete-tool-directory"');
    expect(explore).toContain("category === \"All\"");
    expect(explore).toContain("FIELD_KIT_CATEGORIES");
    expect(explore).toContain("Every tool is visible here");
    expect(explore).toContain("Guided tour");
    expect(explore).toContain("Access map");
  });

  it("defines one app wide source of truth for every major offering", () => {
    expect(SPARTAN_OFFERINGS.map((offering) => offering.id)).toEqual([
      "home",
      "coach",
      "tools",
      "my-work",
      "library",
      "consulting",
      "account",
      "admin",
    ]);
    for (const offering of SPARTAN_OFFERINGS) {
      expect(offering.promise.length).toBeGreaterThan(20);
      expect(offering.capabilities.length).toBeGreaterThanOrEqual(4);
      expect(offering.offline.length).toBeGreaterThan(20);
    }
  });

  it("renders advanced AI results as a semantic product experience", () => {
    const tool = read("components/ai-tool-screen.tsx");
    const result = read("components/PremiumAiResult.tsx");
    expect(tool).toContain("PremiumAiResult");
    expect(tool).toContain("formatAiResultForSharing");
    expect(tool).toContain("Readable output, not a JSON dump");
    expect(result).toContain("Executive answer");
    expect(result).toContain("Field ready language");
    expect(result).toContain("Next actions");
    expect(result).toContain("Evidence & review");
  });
});
