import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("native registration contract", () => {
  it("creates the individual account inside the iPhone app", () => {
    const screen = read("app/register.tsx");
    const auth = read("lib/AuthContext.tsx");
    const api = read("lib/api.ts");
    const login = read("app/login.tsx");
    const home = read("app/(tabs)/index.tsx");
    const welcome = read("components/WelcomeExperience.tsx");
    const account = read("app/(tabs)/account.tsx");
    const membership = read("app/membership.tsx");

    expect(screen).toContain("Create secure account");
    expect(screen).toContain("register({ name, email, password })");
    expect(screen).toContain("register-accept-terms");
    expect(screen).toContain("register-confirm-no-phi");
    expect(auth).toContain("registerMobile(input)");
    expect(api).toContain('fetch(`${getBase()}/api/auth/register`');
    expect(api).toContain("acceptTerms: true");
    expect(api).toContain("noPhi: true");
    expect(login).toContain('router.push("/register" as Href)');
    expect(home).toContain("<WelcomeExperience");
    expect(welcome).toContain('open("/membership")');
    expect(account).toContain('router.push("/membership" as any)');
    expect(membership).toContain('router.push("/register" as any)');
    expect(membership).toContain("Apple confirmed your membership");
    expect(login).toContain('type Href');
    expect(login).not.toContain('openWebsite("/register")');
  });
});
