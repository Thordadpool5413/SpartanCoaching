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
    expect(home).toContain("What conversation needs your best thinking?");
    expect(home).toContain("Prepare the next conversation.");
    expect(home).toContain("Talk it through before it matters.");
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
    expect(tour).toContain('title="Library" body="Read, listen, and use approved field resources."');
    expect(tour).toContain("field tools by the job you need to do");
    expect(tour).not.toContain("every Library resource");
    expect(tourState).toContain("shouldAutoPresentGuidedTour");
    expect(welcome).toContain("shouldAutoPresentGuidedTour");
    expect(account).toContain("hard deleted after 90 days");
    expect(account).toContain("Organization admins never see prompts, drafts, recordings, transcripts, or unshared outputs");
    expect(rootLayout).toContain('name="tour"');
  });

  it("uses the supplied brand film for the accessible native launch experience", () => {
    const stamp = read("components/brand/BrandStamp.tsx");
    const helmet = read("components/brand/HelmetMark.tsx");
    const launch = read("components/LaunchExperience.tsx");

    expect(stamp).toContain("brand-stamp.png");
    expect(helmet).toContain("helmet-mark.png");
    expect(launch).toContain("spartan-launch-film.mp4");
    expect(launch).toContain("useVideoPlayer");
    expect(launch).toContain('contentFit="contain"');
    expect(launch).toContain('accessibilityLabel="Skip introduction"');
    expect(launch).toContain('player.addListener("playToEnd"');
    expect(launch).toContain("12_000");
  });

  it("locks the approved Figma Home target and its native action hierarchy", () => {
    const home = read("app/(tabs)/index.tsx");
    const publicHome = read("components/WelcomeExperience.tsx");
    const acceptance = read("design/home-acceptance-spec.md");

    expect(acceptance).toContain("node `33:13`");
    expect(acceptance).toContain("440 by 956 points");
    expect(publicHome).toContain("<SpartanHeader");
    expect(publicHome).toContain("Start with what you need.");
    expect(publicHome).toContain("OPEN A WORKSPACE");
    expect(publicHome).toContain("Build the plan");
    expect(publicHome).toContain("Rehearse the moment");
    expect(publicHome).toContain('label: "Plan"');
    expect(publicHome).toContain('route: "/(tabs)/tools?category=Plan"');
    expect(publicHome).toContain('label: "Practice"');
    expect(publicHome).toContain('route: "/(tabs)/tools?category=Practice"');
    expect(publicHome).toContain('label: "Measure"');
    expect(publicHome).toContain('route: "/(tabs)/tools?category=Measure"');
    expect(publicHome).toContain('label: "Library"');
    expect(publicHome).toContain('route: "/(tabs)/learn"');
    expect(publicHome).toContain("Explore all {FIELD_KIT_TOOLS.length} field tools");
    expect(publicHome).toContain("No Spartan account is required before Apple purchase.");
    expect(home).toContain('open("/tool/playbook" as Href)');
    expect(home).toContain('"/(tabs)/coach"');
    expect(home).toContain("<SpartanHeader");
    expect(read("components/ui/SpartanHeader.tsx")).toContain('title = "Hospice Sales Pro"');
    expect(read("components/ui/SpartanHeader.tsx")).toContain('subtitle = "by Spartan Coaching"');
    expect(home).not.toContain("Pick up where you left off");
    expect(home).toContain("Explore every tool");
    expect(acceptance).toContain("binding visual target is Figma");
  });
});
