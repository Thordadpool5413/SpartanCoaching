import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const login = fs.readFileSync(path.join(root, "app/login.tsx"), "utf8");
const register = fs.readFileSync(path.join(root, "app/register.tsx"), "utf8");

describe("former company member recovery experience", () => {
  it("explains the individual recovery route without exposing account status", () => {
    expect(login).toContain("Company access ended?");
    expect(login).toContain("Choose individual access through Apple");
    expect(login).toContain("same email");
    expect(login).toContain("30 day recovery window");
    expect(login).toContain("Email or password is incorrect.");
  });

  it("tells returning members exactly what is and is not recovered", () => {
    expect(register).toContain("Returning after company access?");
    expect(register).toContain("Use the same email address you used with your company seat");
    expect(register).toContain("within 30 days of offboarding");
    expect(register).toContain("preserved private commitments reconnect");
    expect(register).toContain("Raw Coach conversations are not restored");
  });
});
