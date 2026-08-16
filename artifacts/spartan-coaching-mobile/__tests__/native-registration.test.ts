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

    expect(screen).toContain("Create secure account");
    expect(screen).toContain("register({ name, email, password })");
    expect(screen).toContain("register-accept-terms");
    expect(screen).toContain("register-confirm-no-phi");
    expect(auth).toContain("registerMobile(input)");
    expect(api).toContain('fetch(`${getBase()}/api/auth/register`');
    expect(api).toContain("acceptTerms: true");
    expect(api).toContain("noPhi: true");
    expect(login).toContain('router.push("/register")');
    expect(login).not.toContain('openWebsite("/register")');
  });
});
