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
});
