import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

describe("protected Spartan Coaching brand asset", () => {
  it("keeps the supplied helmet and lockup pixel source unchanged", () => {
    const asset = fs.readFileSync(
      path.resolve(__dirname, "../assets/images/spartan-coaching-lockup.png"),
    );
    expect(createHash("sha256").update(asset).digest("hex")).toBe(
      "f4438421b4922868f8327298a972cf8b5e6c9235f08593df6cc5d2ee63f67793",
    );
  });

  it("keeps the approved helmet on the square icon assets", () => {
    for (const name of ["icon.png", "logo.png"]) {
      const asset = fs.readFileSync(
        path.resolve(__dirname, `../assets/images/${name}`),
      );
      expect(createHash("sha256").update(asset).digest("hex")).toBe(
        "6fe975b859ec56296dad621103c47c742886916e06403aa6106a65a1fa1cf96a",
      );

      expect(asset.readUInt32BE(16)).toBe(2048);
      expect(asset.readUInt32BE(20)).toBe(2048);
      expect(asset[25]).toBe(2);
    }
  });

  it("keeps the supplied distressed Spartan Coaching logo unchanged", () => {
    const asset = fs.readFileSync(
      path.resolve(__dirname, "../assets/images/brand-stamp.png"),
    );
    expect(createHash("sha256").update(asset).digest("hex")).toBe(
      "5a7db9fa3af9c888849cf62d66f3b0581e799608b9a9bec476351e30ea6268d0",
    );
  });

  it("uses the stamp as the Home logo and reserves the supplied helmet for compact marks", () => {
    const login = fs.readFileSync(path.resolve(__dirname, "../app/login.tsx"), "utf8");
    const home = fs.readFileSync(path.resolve(__dirname, "../app/(tabs)/index.tsx"), "utf8");
    const coach = fs.readFileSync(path.resolve(__dirname, "../app/(tabs)/coach.tsx"), "utf8");
    const helmet = fs.readFileSync(path.resolve(__dirname, "../components/brand/HelmetMark.tsx"), "utf8");
    expect(login).toContain("<HelmetMark");
    expect(home).not.toContain("<HelmetMark");
    expect(coach).toContain("<HelmetMark");
    expect(helmet).toContain('require("@/assets/images/icon.png")');
    expect(home).toContain("<BrandStamp");
    expect(login).toContain("Forgot password");
    expect(login).toContain("Sign in securely");
  });
});
