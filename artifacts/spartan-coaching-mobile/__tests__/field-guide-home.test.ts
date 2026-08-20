import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (name: string) => fs.readFileSync(path.join(root, name), "utf8");

describe("Field Guide experience contract", () => {
  it("starts with a guided value experience instead of a CRM dashboard", () => {
    const welcome = read("components/WelcomeExperience.tsx");
    const home = read("app/(tabs)/index.tsx");

    expect(welcome).toContain("Take the complete app tour");
    expect(welcome).toContain("No Spartan account is required before Apple purchase.");
    expect(home).toContain("What do you need to prepare for?");
    expect(home).toContain("Plan the conversation");
    expect(home).not.toContain("Command Center");
  });

  it("provides a complete native product tour using fictional information", () => {
    const tour = read("app/tour.tsx");
    const tourState = read("lib/guidedTour.ts");
    const welcome = read("components/WelcomeExperience.tsx");
    const account = read("app/(tabs)/account.tsx");
    const rootLayout = read("app/_layout.tsx");

    expect(tour).toContain("FICTIONAL ACCOUNT");
    expect(tour).toContain("1 · START HERE");
    expect(tour).toContain("2 · THE SITUATION");
    expect(tour).toContain("3 · PREPARE");
    expect(tour).toContain("4 · PRACTICE");
    expect(tour).toContain("5 · COACH FEEDBACK");
    expect(tour).toContain("6 · FOLLOW THROUGH");
    expect(tour).toContain("7 · FIND EVERY TOOL");
    expect(tour).toContain("8 · LIBRARY AND OFFLINE");
    expect(tour).toContain("9 · IPHONE AND WEBSITE");
    expect(tour).toContain("10 · CHOOSE YOUR ACCESS");
    expect(tour).toContain("Never enter patient PHI into Spartan Coaching");
    expect(tour).toContain("There is no account required for this tour");
    expect(tour).toContain("getGuidedTourState");
    expect(tour).toContain('accessibilityRole="progressbar"');
    expect(tourState).toContain("shouldAutoPresentGuidedTour");
    expect(welcome).toContain("shouldAutoPresentGuidedTour");
    expect(account).toContain("hard deleted after 90 days");
    expect(account).toContain("Organization admins never see prompts, drafts, recordings, transcripts, or unshared outputs");
    expect(rootLayout).toContain('name="tour"');
  });

  it("uses the transparent helmet as the native mark and preserves the distressed logo asset", () => {
    const stamp = read("components/brand/BrandStamp.tsx");
    const helmet = read("components/brand/HelmetMark.tsx");
    const launch = read("components/LaunchExperience.tsx");

    expect(stamp).toContain("brand-stamp.png");
    expect(helmet).toContain("helmet-mark.png");
    expect(launch).toContain("<HelmetMark");
    expect(launch).not.toContain("<BrandStamp");
  });

  it("locks the approved Figma Home target and its native action hierarchy", () => {
    const home = read("app/(tabs)/index.tsx");
    const publicHome = read("components/WelcomeExperience.tsx");
    const acceptance = read("design/home-acceptance-spec.md");

    expect(acceptance).toContain("node `33:13`");
    expect(acceptance).toContain("440 by 956 points");
    expect(publicHome).toContain("<SpartanHeader");
    expect(publicHome).toContain("Know what to do next.");
    expect(publicHome).toContain("home-pillar-plan");
    expect(publicHome).toContain("home-pillar-practice");
    expect(publicHome).toContain("home-pillar-measure");
    expect(publicHome).toContain("home-pillar-library");
    expect(publicHome).toContain("Explore all {FIELD_KIT_TOOLS.length} tools and resources");
    expect(publicHome).toContain("No Spartan account is required before Apple purchase.");
    expect(home).toContain('route: "/tool/playbook"');
    expect(home).toContain('"/tool/objection"');
    expect(home).toContain("<SpartanHeader");
    expect(home).not.toContain("Pick up where you left off");
    expect(home).toContain("Explore tools and resources");
    expect(acceptance).toContain("binding visual target is Figma");
  });
});
