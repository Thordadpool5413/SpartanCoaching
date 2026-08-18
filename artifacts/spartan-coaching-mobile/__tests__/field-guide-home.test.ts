import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (name: string) => fs.readFileSync(path.join(root, name), "utf8");

describe("Field Guide experience contract", () => {
  it("starts with a guided value experience instead of a CRM dashboard", () => {
    const welcome = read("components/WelcomeExperience.tsx");
    const home = read("app/(tabs)/index.tsx");

    expect(welcome).toContain("Walk through Spartan Coaching");
    expect(welcome).toContain("account comes after purchase");
    expect(home).toContain("What are you walking into?");
    expect(home).toContain("Prepare for a conversation");
    expect(home).not.toContain("Command Center");
  });

  it("provides a native six step Field Guide tour using fictional information", () => {
    const tour = read("app/tour.tsx");
    const account = read("app/(tabs)/account.tsx");
    const rootLayout = read("app/_layout.tsx");

    expect(tour).toContain("FICTIONAL ACCOUNT");
    expect(tour).toContain("1 · THE SITUATION");
    expect(tour).toContain("2 · PREPARE");
    expect(tour).toContain("3 · PRACTICE");
    expect(tour).toContain("4 · COACH FEEDBACK");
    expect(tour).toContain("5 · FOLLOW THROUGH");
    expect(tour).toContain("6 · KNOW YOUR ACCESS");
    expect(tour).toContain("Never enter patient PHI into Spartan Coaching");
    expect(tour).toContain("There is no account required for this tour");
    expect(account).toContain("hard deleted after 90 days");
    expect(account).toContain("Organization admins never see prompts, drafts, recordings, transcripts, or unshared outputs");
    expect(rootLayout).toContain('name="tour"');
  });

  it("uses the distressed logo for identity and the helmet only as an icon", () => {
    const stamp = read("components/brand/BrandStamp.tsx");
    const helmet = read("components/brand/HelmetMark.tsx");
    const launch = read("components/LaunchExperience.tsx");

    expect(stamp).toContain("brand-stamp.png");
    expect(helmet).toContain("icon.png");
    expect(launch).toContain("<BrandStamp");
    expect(launch).not.toContain("<HelmetMark");
  });

  it("locks the approved Home target and its native action hierarchy", () => {
    const home = read("app/(tabs)/index.tsx");
    const acceptance = read("design/home-acceptance-spec.md");

    expect(fs.existsSync(path.join(root, "design/references/home-option-2-approved.png"))).toBe(true);
    expect(fs.existsSync(path.join(root, "assets/images/field-guide-navy-texture.png"))).toBe(true);
    expect(fs.existsSync(path.join(root, "assets/images/field-guide-crimson-texture.png"))).toBe(true);
    expect(home).toContain('router.push("/tool/playbook"');
    expect(home).toContain('"/tool/objection"');
    expect(home).toContain('router.push("/(tabs)/account"');
    expect(home).toContain("Your field guide is ready.");
    expect(acceptance).toContain("binding visual target");
  });
});
